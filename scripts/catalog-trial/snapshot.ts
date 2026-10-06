import type { Title } from '../../src/domain.ts';
import type { CatalogSnapshot } from '../../src/snapshot.ts';
import { PrototypeLauncher } from '../../src/providers.ts';
import { classifyRatings, mergeTitles } from './model.ts';
import type { TrialRecord } from './model.ts';

export interface WikiCandidate { rating: string; itemId: string }
export function buildSnapshot(records: TrialRecord[], generatedAt: string, candidates: Map<string, WikiCandidate>): CatalogSnapshot {
  const snapshot: CatalogSnapshot = { version: 1, generatedAt, titles: [], offers: [], links: [] };
  for (const { title, offers } of mergeTitles(records)) {
    if (!title.name) continue;
    let ratings = title.ratings;
    let source: 'tvdb' | 'wikidata' | null = title.provenance.ratings;
    const wiki = candidates.get(title.id);
    const wikiRating = wiki && title.kind === 'movie' ? classifyRatings([{country:'usa',name:wiki.rating}], 'movie') : null;
    if (wikiRating?.state === 'rated') {
      if (ratings.state === 'missing') { ratings = wikiRating; source = 'wikidata'; }
      else if (ratings.state === 'rated' && ratings.labels[0] !== wikiRating.labels[0]) {
        ratings = { state: 'conflict', labels: [], ageLevel: null };
        source = null;
      }
    }
    const entry: Title = {
      id: title.id, name: title.name, year: title.year, kind: title.kind === 'movie' ? 'Movie' : 'Series',
      rating: ratings.state === 'rated' ? ratings.labels[0] : 'Rating unavailable',
      ageLevel: ratings.state === 'rated' ? ratings.ageLevel : null,
      genres: title.genres, summary: title.summary ?? 'Description unavailable.', duration: title.kind === 'series' ? 'Series' : 'Runtime unavailable',
      providerIds: [...new Set(offers.map(x => x.providerId))],
      topics: title.genres.some(x => x.toLowerCase() === 'horror') ? ['horror'] : [], seasonal: [],
      contentCoverage: 'genre-only', artworkRisk: 'unknown', art: '', palette: ['#244255', '#799693'],
      metadata: { imdbId: title.sourceIds.imdb, tvdbId: title.sourceIds.tvdb, ratingState: ratings.state, ratingSource: source,
        wikidataId: source === 'wikidata' ? wiki!.itemId : null, checkedAt: generatedAt },
    };
    snapshot.titles.push(entry);
    for (const offer of offers) {
      if (!snapshot.offers.some(x => x.titleId === title.id && x.providerId === offer.providerId)) snapshot.offers.push({titleId:title.id,providerId:offer.providerId,region:'US',access:'subscription',provenance:'movie-of-the-night'});
      if (!offer.url || !offer.linkAccepted || snapshot.links.some(x => x.titleId === title.id && x.providerId === offer.providerId)) continue;
      const link = { titleId: title.id, providerId: offer.providerId, url: offer.url, checkedAt: offer.checkedAt, evidence: 'availability-api' as const };
      if (new PrototypeLauncher([link]).resolve(snapshot.offers.find(x => x.titleId === title.id && x.providerId === offer.providerId)!).exactTitleResolved) snapshot.links.push(link);
    }
  }
  return snapshot;
}
