import { PROVIDERS } from '../../src/providers.ts';
import type { AgeLevel, ProviderId } from '../../src/domain.ts';

export type Kind = 'movie' | 'series';
export type RatingState = 'rated' | 'unrated' | 'missing' | 'unrecognized' | 'conflict';
export interface Ratings { labels: string[]; state: RatingState; ageLevel: AgeLevel | null }
export interface TrialTitle {
  id: string; kind: Kind; name: string | null; year: number | null; summary: string | null;
  genres: string[];
  sourceIds: { availability: string; imdb: string | null; tvdb: number | null };
  provenance: { name: 'availability' | 'tvdb' | null; year: 'availability' | 'tvdb' | null; genres: 'availability' | 'tvdb' | null; summary: 'tvdb' | null; ratings: 'tvdb' | null };
  ratings: Ratings;
  matchStatus: 'pending' | 'matched' | 'unresolved' | 'unmatched' | 'ambiguous' | 'missing-id' | 'id-conflict' | 'error';
}
export interface TrialOffer {
  titleId: string; providerId: ProviderId; region: 'US'; access: 'subscription';
  source: 'movie-of-the-night'; url: string | null; checkedAt: string;
  linkAccepted: boolean; requiresDeviceVerification: true;
}
export interface TrialRecord { title: TrialTitle; offers: TrialOffer[] }
export interface TvdbMetadata { id: number; name: string | null; year: number | null; summary: string | null; genres: string[]; ratings: Ratings }

export const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const textValue = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const yearValue = (value: unknown): number | null => {
  const n = typeof value === 'number' || (typeof value === 'string' && /^\d{4}$/.test(value)) ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 1000 && n <= 2100 ? n : null;
};
const genres = (value: unknown) => [...new Set(list(value).map(x => textValue(record(x).name)).filter((x): x is string => x !== null))];

export function classifyRatings(input: unknown, kind: Kind): Ratings {
  const labels = [...new Set(list(input).filter(x => ['us', 'usa'].includes(String(record(x).country).trim().toLowerCase())).map(x => textValue(record(x).name)?.toUpperCase()).filter((x): x is string => !!x))];
  const levels: Record<string, AgeLevel> = kind === 'movie' ? { G: 0, PG: 1, 'PG-13': 2, R: 3, 'NC-17': 3 } : { 'TV-Y': 0, 'TV-G': 0, 'TV-Y7': 1, 'TV-Y7-FV': 1, 'TV-PG': 1, 'TV-14': 2, 'TV-MA': 3 };
  if (!labels.length) return { labels, state: 'missing', ageLevel: null };
  if (labels.length > 1) return { labels, state: 'conflict', ageLevel: null };
  const label = labels[0];
  if (['NR', 'UNRATED', 'NOT RATED'].includes(label)) return { labels, state: 'unrated', ageLevel: null };
  const ageLevel = levels[label] ?? null;
  return { labels, state: ageLevel === null ? 'unrecognized' : 'rated', ageLevel };
}

function candidateUrl(value: unknown, providerId: ProviderId): string | null {
  const provider = PROVIDERS.find(x => x.id === providerId)!;
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && !url.username && !url.password && url.origin === new URL(provider.homepage).origin && provider.titlePath.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

export function normalizeShow(input: unknown, checkedAt: string): TrialRecord | null {
  const raw = record(input);
  const sourceId = textValue(raw.id);
  if (!sourceId || !/^[a-zA-Z0-9_-]{1,100}$/.test(sourceId) || !['movie', 'series'].includes(String(raw.showType))) return null;
  const kind = raw.showType as Kind;
  const imdb = textValue(raw.imdbId);
  const id = `motn:${kind}:${sourceId}`;
  const name = textValue(raw.title);
  const year = yearValue(kind === 'movie' ? raw.releaseYear : raw.firstAirYear);
  const genreNames = genres(raw.genres);
  const title: TrialTitle = {
    id, kind, name, year, summary: null, genres: genreNames,
    sourceIds: { availability: sourceId, imdb: imdb && /^tt\d+$/.test(imdb) ? imdb : null, tvdb: null },
    provenance: { name: name ? 'availability' : null, year: year === null ? null : 'availability', genres: genreNames.length ? 'availability' : null, summary: null, ratings: null },
    ratings: classifyRatings([], kind), matchStatus: 'pending',
  };
  const offers: TrialOffer[] = [];
  for (const item of list(record(raw.streamingOptions).us)) {
    const option = record(item);
    const providerId = record(option.service).id;
    if (option.type !== 'subscription' || option.addon || !PROVIDERS.some(x => x.id === providerId)) continue;
    const url = candidateUrl(option.link, providerId as ProviderId);
    offers.push({ titleId: id, providerId: providerId as ProviderId, region: 'US', access: 'subscription', source: 'movie-of-the-night', url, checkedAt, linkAccepted: url !== null, requiresDeviceVerification: true });
  }
  return { title, offers };
}

export function mergeTitles(records: TrialRecord[]): TrialRecord[] {
  const merged = new Map<string, TrialRecord>();
  for (const item of records) {
    let target = merged.get(item.title.id);
    if (!target) { target = structuredClone(item); target.offers = []; merged.set(item.title.id, target); }
    for (const offer of item.offers) if (!target.offers.some(x => x.providerId === offer.providerId && x.url === offer.url)) target.offers.push({ ...offer });
  }
  return [...merged.values()];
}

export function selectTvdbMatch(input: unknown, kind: Kind): { status: 'matched' | 'unmatched' | 'ambiguous'; id: number | null } {
  const ids = [...new Set(list(record(input).data).map(x => record(record(x)[kind]).id).filter((x): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x > 0))];
  return ids.length === 1 ? { status: 'matched', id: ids[0] } : { status: ids.length ? 'ambiguous' : 'unmatched', id: null };
}

export function normalizeTvdb(input: unknown, imdbId: string, kind: Kind): TvdbMetadata | null {
  const raw = record(record(input).data);
  if (typeof raw.id !== 'number' || !Number.isSafeInteger(raw.id) || raw.id <= 0 || !list(raw.remoteIds).some(x => record(x).id === imdbId && String(record(x).sourceName).toLowerCase() === 'imdb')) return null;
  const translation = list(record(raw.translations).overviewTranslations).map(record).find(x => ['eng', 'en'].includes(String(x.language).toLowerCase()));
  return { id: raw.id, name: textValue(raw.name), year: yearValue(raw.year), summary: textValue(translation?.overview), genres: genres(raw.genres), ratings: classifyRatings(raw.contentRatings, kind) };
}
