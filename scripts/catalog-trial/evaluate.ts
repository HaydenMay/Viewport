import { PROVIDERS } from '../../src/providers.ts';
import { TrialError } from './client.ts';
import type { ErrorCategory, SourceName, TrialHttpClient } from './client.ts';
import { mergeTitles, normalizeShow, normalizeTvdb, record, selectTvdbMatch, textValue } from './model.ts';
import type { Kind, TrialRecord } from './model.ts';

export interface TrialReport {
  version: 1; generatedAt: string; target: 100; selected: number;
  completion: 'complete' | 'partial' | 'failed';
  kinds: { movie: number; series: number }; providers: Record<string, number>;
  requests: { availability: number; tvdb: number }; duplicates: number; multipleProviders: number;
  missing: { name: number; year: number; summary: number; genres: number; usRating: number };
  matchStates: Record<string, number>; ratingStates: Record<string, number>; ratingLabels: Record<string, number>;
  links: { accepted: number; rejected: number; needsDeviceVerification: number };
  horrorGenre: number; unknownContent: { scary: number; seasonal: number; violence: number; sexual: number; language: number };
  discoveryIssues: Record<string, number>;
  responseDiagnostics: Record<string, number>;
  errors: Partial<Record<SourceName, Partial<Record<ErrorCategory, number>>>>;
  estimatedTrialsPer1000Requests: number | null;
}
const increment = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };
const knownLabels = new Set(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-G', 'TV-Y7', 'TV-Y7-FV', 'TV-PG', 'TV-14', 'TV-MA', 'NR', 'UNRATED', 'NOT RATED']);
interface Bucket { provider: string; kind: Kind; cursor: string | null; seen: Set<string>; done: boolean; records: TrialRecord[] }

function interleave(buckets: Bucket[]): TrialRecord[] {
  const output: TrialRecord[] = [];
  const max = Math.max(0, ...buckets.map(x => x.records.length));
  for (let index = 0; index < max; index++) for (const bucket of buckets) if (bucket.records[index]) output.push(bucket.records[index]);
  return output;
}
function select(records: TrialRecord[], relax = false): TrialRecord[] {
  const chosen: TrialRecord[] = [];
  const kinds = { movie: 0, series: 0 };
  for (const item of records) if (chosen.length < 100 && kinds[item.title.kind] < 50) { chosen.push(item); kinds[item.title.kind]++; }
  if (relax) for (const item of records) if (chosen.length < 100 && !chosen.some(x => x.title.id === item.title.id)) chosen.push(item);
  return chosen;
}

export async function evaluateCatalog(clients: TrialHttpClient, checkedAt: string): Promise<TrialReport> {
  const issues: Record<string, number> = {};
  const responseDiagnostics: Record<string, number> = {};
  const errors: TrialReport['errors'] = {};
  let fatal = false;
  const error = (thrown: unknown, source: SourceName) => {
    const category = thrown instanceof TrialError ? thrown.category : 'invalid-response';
    const counts = errors[source] ??= {};
    counts[category] = (counts[category] ?? 0) + 1;
    if (['authentication', 'quota', 'missing-secret', 'invalid-response'].includes(category)) fatal = true;
    return category;
  };
  const buckets: Bucket[] = PROVIDERS.flatMap(provider => (['movie', 'series'] as const).map(kind => ({ provider: provider.id, kind, cursor: null, seen: new Set<string>(), done: false, records: [] })));
  const chooseSample = (records: TrialRecord[]) => {
    const relax = (['movie', 'series'] as const).some(kind => records.filter(x => x.title.kind === kind).length < 50 && buckets.filter(x => x.kind === kind).every(x => x.done));
    return select(records, relax);
  };
  const fetchPage = async (bucket: Bucket) => {
    const params = new URLSearchParams({ country: 'us', catalogs: `${bucket.provider}.subscription`, show_type: bucket.kind, series_granularity: 'show', output_language: 'en' });
    if (bucket.cursor) params.set('cursor', bucket.cursor);
    try {
      const response = record(await clients.request('availability', `/shows/search/filters?${params}`));
      if (!Array.isArray(response.shows) || typeof response.hasMore !== 'boolean' || response.shows.length > 20) throw new TrialError('availability', 'invalid-response');
      for (const raw of response.shows) {
        const normalized = normalizeShow(raw, checkedAt);
        if (!normalized || normalized.title.kind !== bucket.kind) { increment(issues, 'invalid-show'); continue; }
        if (!normalized.offers.length) { increment(issues, 'no-subscription-offer'); continue; }
        bucket.records.push(normalized);
      }
      const next = textValue(response.nextCursor);
      if (!response.hasMore) bucket.done = true;
      else if (!next) { increment(issues, 'missing-cursor'); bucket.done = true; }
      else if (bucket.seen.has(next)) { increment(issues, 'repeated-cursor'); bucket.done = true; }
      else { bucket.seen.add(next); bucket.cursor = next; }
    } catch (thrown) {
      const category = error(thrown, 'availability'); bucket.done = true;
      if (category === 'invalid-response') clients.stopped.availability = category;
    }
  };

  let authenticated = false;
  try { await clients.authenticateTvdb(); authenticated = true; } catch (thrown) { error(thrown, 'tvdb'); }
  if (authenticated) {
    // First sample every provider and media kind before selecting the bounded trial.
    for (const bucket of buckets) { if (clients.stopped.availability) break; await fetchPage(bucket); }
    while (!clients.stopped.availability && chooseSample(mergeTitles(interleave(buckets))).length < 100 && buckets.some(x => !x.done)) {
      for (const bucket of buckets) {
        if (!bucket.done) await fetchPage(bucket);
        if (clients.stopped.availability || chooseSample(mergeTitles(interleave(buckets))).length === 100) break;
      }
    }
  }
  const candidates = interleave(buckets);
  const merged = mergeTitles(candidates);
  const selected = chooseSample(merged);
  for (const item of selected) {
    const title = item.title;
    if (!title.sourceIds.imdb) { title.matchStatus = 'missing-id'; continue; }
    if (clients.stopped.tvdb) { title.matchStatus = 'error'; continue; }
    let stage: 'remote-search' | 'movie-extended' | 'series-extended' = 'remote-search';
    let dataShape = 'unavailable';
    const shape = (value: unknown) => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    try {
      const searchResponse = record(await clients.request('tvdb', `/search/remoteid/${encodeURIComponent(title.sourceIds.imdb)}`));
      dataShape = shape(searchResponse.data);
      if (!Array.isArray(searchResponse.data)) throw new TrialError('tvdb', 'invalid-response');
      const match = selectTvdbMatch(searchResponse, title.kind);
      title.matchStatus = match.status;
      if (match.id === null) continue;
      const plural = title.kind === 'movie' ? 'movies' : 'series';
      stage = title.kind === 'movie' ? 'movie-extended' : 'series-extended';
      dataShape = 'unavailable';
      const raw = await clients.request('tvdb', `/${plural}/${match.id}/extended?meta=translations&short=true`);
      dataShape = shape(record(raw).data);
      const extended = record(record(raw).data);
      if (typeof extended.id !== 'number' || !Number.isSafeInteger(extended.id) || extended.id <= 0) throw new TrialError('tvdb', 'invalid-response');
      const metadata = normalizeTvdb(raw, title.sourceIds.imdb, title.kind);
      if (!metadata || metadata.id !== match.id) { title.matchStatus = 'id-conflict'; continue; }
      title.sourceIds.tvdb = metadata.id;
      if (metadata.name) { title.name = metadata.name; title.provenance.name = 'tvdb'; }
      if (metadata.year !== null) { title.year = metadata.year; title.provenance.year = 'tvdb'; }
      if (metadata.genres.length) { title.genres = metadata.genres; title.provenance.genres = 'tvdb'; }
      title.summary = metadata.summary; title.provenance.summary = metadata.summary ? 'tvdb' : null;
      title.ratings = metadata.ratings; title.provenance.ratings = 'tvdb';
    } catch (thrown) {
      const category = error(thrown, 'tvdb');
      title.matchStatus = category === 'not-found' ? 'unmatched' : 'error';
      // A bad title response must not prevent assessment of unrelated records.
      // Auth/quota/budget guards remain in the HTTP client. Only fixed enums are reported.
      increment(responseDiagnostics, `${stage}:${category}:${dataShape}`);
    }
  }
  const report: TrialReport = {
    version: 1, generatedAt: checkedAt, target: 100, selected: selected.length,
    completion: fatal ? 'failed' : selected.length === 100 && !Object.keys(errors).length && !Object.keys(issues).length ? 'complete' : 'partial',
    kinds: { movie: 0, series: 0 }, providers: Object.fromEntries(PROVIDERS.map(x => [x.id, 0])),
    requests: { ...clients.requests }, duplicates: candidates.length - merged.length, multipleProviders: 0,
    missing: { name: 0, year: 0, summary: 0, genres: 0, usRating: 0 }, matchStates: {}, ratingStates: {}, ratingLabels: {},
    links: { accepted: 0, rejected: 0, needsDeviceVerification: 0 }, horrorGenre: 0,
    unknownContent: { scary: selected.length, seasonal: selected.length, violence: selected.length, sexual: selected.length, language: selected.length },
    discoveryIssues: issues, responseDiagnostics, errors,
    estimatedTrialsPer1000Requests: clients.requests.availability ? Math.floor(1000 / clients.requests.availability) : null,
  };
  for (const { title, offers } of selected) {
    report.kinds[title.kind]++;
    for (const provider of new Set(offers.map(x => x.providerId))) report.providers[provider]++;
    if (new Set(offers.map(x => x.providerId)).size > 1) report.multipleProviders++;
    if (!title.name) report.missing.name++;
    if (title.year === null) report.missing.year++;
    if (!title.summary) report.missing.summary++;
    if (!title.genres.length) report.missing.genres++;
    const ratingsEvaluated = title.provenance.ratings === 'tvdb';
    if (ratingsEvaluated && title.ratings.state === 'missing') report.missing.usRating++;
    if (title.genres.some(x => x.toLowerCase() === 'horror')) report.horrorGenre++;
    increment(report.matchStates, title.matchStatus); increment(report.ratingStates, ratingsEvaluated ? title.ratings.state : 'not-evaluated');
    for (const label of title.ratings.labels) increment(report.ratingLabels, knownLabels.has(label) ? label : 'unrecognized-label');
    for (const offer of offers) { report.links[offer.linkAccepted ? 'accepted' : 'rejected']++; report.links.needsDeviceVerification++; }
  }
  return report;
}

export function formatReport(report: TrialReport): string {
  const rows = (counts: Record<string, number>) => Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`).join('\n') || '| none | 0 |';
  return `# Viewport catalog trial\n\nStatus: **${report.completion}**. Selected **${report.selected}/${report.target}** titles (${report.kinds.movie} movies, ${report.kinds.series} series).\n\nThe live catalog is unchanged. No source title data or images are published. Accepted links are candidates requiring device verification.\n\n## API requests\n\n| Source | Requests | Hard cap |\n| --- | ---: | ---: |\n| Movie of the Night | ${report.requests.availability} | 25 |\n| TheTVDB | ${report.requests.tvdb} | 260 |\n\nEstimated trials within a fresh 1,000-request availability allowance: ${report.estimatedTrialsPer1000Requests ?? 'not measured'}. This is for this trial size, not a full catalog refresh; retries and earlier usage consume quota.\n\n## Provider coverage\n\n| Provider | Titles |\n| --- | ---: |\n${rows(report.providers)}\n\n## Identifier matching\n\n| Result | Titles |\n| --- | ---: |\n${rows(report.matchStates)}\n\n## US maturity coverage\n\nNot-evaluated means no trusted TheTVDB record was assessed; it is not a missing certification. Missing US ratings count only assessed records.\n\n| State | Titles |\n| --- | ---: |\n${rows(report.ratingStates)}\n\n| Known label | Titles |\n| --- | ---: |\n${rows(report.ratingLabels)}\n\n## Missing metadata\n\nSummary counts include records that could not be enriched.\n\n| Field | Titles |\n| --- | ---: |\n${rows(report.missing)}\n\n## Other diagnostics\n\nDuplicate source records: ${report.duplicates}. Multiple-provider titles: ${report.multipleProviders}. Horror-genre titles: ${report.horrorGenre}.\n\nCandidate links: ${report.links.accepted} accepted by existing URL rules, ${report.links.rejected} rejected; all ${report.links.needsDeviceVerification} require physical-device testing.\n\nScary, seasonal, violence, sexual-content and language classification: unknown for all ${report.selected} titles. Lack of a tag is not a safety determination. Artwork: original placeholders only.\n\nDiscovery issues: ${JSON.stringify(report.discoveryIssues)}. API errors: ${JSON.stringify(report.errors)}.\n\nResponse diagnostics (endpoint family:error category:data shape only): ${JSON.stringify(report.responseDiagnostics)}.\n`;
}
