import { classifyRatings, record, textValue } from './model.ts';
import type { TrialRecord } from './model.ts';

export interface WikidataReport {
  status: 'complete' | 'partial' | 'failed'; requests: number; moviesTested: number; seriesNotTested: number;
  states: Record<string, number>; fillsMissing: number; agreements: number; disagreements: number;
  candidatesWithReferences: number; candidatesWithoutReferences: number; errors: Record<string, number>;
}
// Verified entities for current US MPA classifications; never infer a rating from a label.
const mpa: Record<string, string> = { Q18665330: 'G', Q18665334: 'PG', Q18665339: 'PG-13', Q18665344: 'R', Q18665349: 'NC-17' };
const bump = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };
const entity = (input: unknown) => {
  const value = record(input);
  if (value.type !== 'uri' || typeof value.value !== 'string') return null;
  return /^https?:\/\/www\.wikidata\.org\/entity\/(Q[1-9]\d*)$/.exec(value.value)?.[1] ?? null;
};
interface Candidate { item: string; rating: string | null; qualified: boolean; referenced: boolean }
class LookupError extends Error {
  readonly category: string;
  constructor(category: string) { super(category); this.category = category; }
}

export async function evaluateWikidata(records: TrialRecord[], fetcher: typeof fetch, options: { maxMovies?: number; onCandidate?: (titleId: string, rating: string, itemId: string) => void } = {}): Promise<WikidataReport> {
  const movies = records.filter(x => x.title.kind === 'movie');
  const report: WikidataReport = {
    status: 'complete', requests: 0, moviesTested: movies.length, seriesNotTested: records.filter(x => x.title.kind === 'series').length,
    states: {}, fillsMissing: 0, agreements: 0, disagreements: 0, candidatesWithReferences: 0, candidatesWithoutReferences: 0, errors: {},
  };
  const ids = [...new Set(movies.map(x => x.title.sourceIds.imdb).filter((x): x is string => !!x && /^tt\d+$/.test(x)))];
  const found = new Map<string, Candidate[]>();
  const failed = new Set<string>();
  if (movies.length > (options.maxMovies ?? 100) || (options.maxMovies ?? 100) > 600) throw new LookupError('budget');
  for (let offset = 0; offset < ids.length; offset += 25) {
    const batch = ids.slice(offset, offset + 25);
    const query = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
SELECT DISTINCT ?imdb ?item ?rating ?qualified ?referenced WHERE {
  VALUES ?imdb { ${batch.map(id => `"${id}"`).join(' ')} }
  ?item p:P345 ?identifier .
  ?identifier ps:P345 ?imdb ; wikibase:rank ?idRank .
  FILTER(?idRank != wikibase:DeprecatedRank)
  OPTIONAL {
    ?item p:P1657 ?ratingStatement .
    ?ratingStatement wikibase:rank ?ratingRank .
    FILTER(?ratingRank != wikibase:DeprecatedRank)
    OPTIONAL { ?ratingStatement ps:P1657 ?rating }
    BIND(EXISTS { ?ratingStatement ?qualifier ?value . FILTER(STRSTARTS(STR(?qualifier), "http://www.wikidata.org/prop/qualifier/") && ?qualifier != <http://www.wikidata.org/prop/qualifier/P2676>) } AS ?qualified)
    BIND(EXISTS { ?ratingStatement prov:wasDerivedFrom ?reference } AS ?referenced)
  }
} LIMIT 1001`;
    try {
      report.requests++; // Batches of 25, bounded by the trial/preview movie cap; no retries.
      let response: Response;
      try {
        response = await fetcher('https://query.wikidata.org/sparql', {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
          headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ViewportCatalogTrial/0.1 (https://github.com/HaydenMay/Viewport)' },
          body: new URLSearchParams({ query }).toString(),
        });
      } catch { throw new LookupError('network'); }
      if (!response.ok) throw new LookupError(response.status === 429 ? 'quota' : 'http');
      let payload: unknown;
      try { payload = await response.json(); } catch { throw new LookupError('invalid-response'); }
      const rows = record(record(payload).results).bindings;
      if (!Array.isArray(rows) || rows.length >= 1001) throw new LookupError('invalid-response');
      const parsed: { imdb: string; candidate: Candidate }[] = [];
      for (const raw of rows) {
        const row = record(raw);
        const imdb = textValue(record(row.imdb).value);
        const item = entity(row.item);
        const rating = row.rating === undefined ? null : entity(row.rating);
        const qualified = record(row.qualified).value;
        const referenced = record(row.referenced).value;
        if (record(row.imdb).type !== 'literal' || !imdb || !batch.includes(imdb) || !item || (row.rating !== undefined && (!rating || !['true', 'false'].includes(String(qualified)) || !['true', 'false'].includes(String(referenced))))) throw new LookupError('invalid-response');
        parsed.push({ imdb, candidate: { item, rating, qualified: qualified === 'true', referenced: referenced === 'true' } });
      }
      for (const { imdb, candidate } of parsed) found.set(imdb, [...(found.get(imdb) ?? []), candidate]);
    } catch (error) {
      bump(report.errors, error instanceof LookupError ? error.category : 'invalid-response');
      for (const id of ids.slice(offset)) failed.add(id);
      break; // Respect quota/server failures; don't hammer the shared public endpoint.
    }
  }
  for (const { title } of movies) {
    const id = title.sourceIds.imdb;
    const rows = id ? found.get(id) ?? [] : [];
    let state: string;
    if (!id || !/^tt\d+$/.test(id)) state = 'missing-id';
    else if (failed.has(id)) state = 'error';
    else if (!rows.length) state = 'no-match';
    else if (new Set(rows.map(x => x.item)).size !== 1) state = 'ambiguous';
    else if (rows.some(x => x.qualified)) state = 'qualified';
    else {
      const ratings = [...new Set(rows.map(x => x.rating).filter((x): x is string => x !== null))];
      if (!ratings.length) state = 'missing-rating';
      else if (ratings.length > 1) state = 'conflict';
      else if (!mpa[ratings[0]]) state = 'unrecognized';
      else {
        state = 'rated';
        options.onCandidate?.(title.id, mpa[ratings[0]], rows[0].item);
        const candidate = classifyRatings([{ country: 'usa', name: mpa[ratings[0]] }], 'movie');
        if (title.ratings.state === 'missing') report.fillsMissing++;
        else if (title.ratings.state === 'rated') report[candidate.labels[0] === title.ratings.labels[0] ? 'agreements' : 'disagreements']++;
        report[rows.some(x => x.rating === ratings[0] && x.referenced) ? 'candidatesWithReferences' : 'candidatesWithoutReferences']++;
      }
    }
    bump(report.states, state);
  }
  if (report.states.error) report.status = ids.every(id => failed.has(id)) ? 'failed' : 'partial';
  return report;
}
