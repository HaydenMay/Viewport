import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeShow, mergeTitles, selectTvdbMatch, normalizeTvdb, classifyRatings } from '../scripts/catalog-trial/model.ts';

const checkedAt = '2026-10-06T16:00:00Z';
const offer = (id: string, type = 'subscription', link = 'https://www.netflix.com/title/123/') => ({ service: { id }, type, link });
const show = (extra = {}) => ({ id: '100', showType: 'movie', title: 'Synthetic movie', imdbId: 'tt1234567', releaseYear: 2020, genres: [{ id: 'horror', name: 'Horror' }], streamingOptions: { us: [offer('netflix')] }, ...extra });

test('only Big 6 US included subscriptions contribute provider coverage', () => {
  const result = normalizeShow(show({ streamingOptions: { us: [offer('netflix'), offer('prime', 'rent'), offer('hulu', 'addon'), offer('peacock', 'free'), offer('disney', 'buy'), offer('hbo'), offer('paramount', 'subscription', 'https://www.paramountplus.com/shows/synthetic/')], gb: [offer('disney')] } }), checkedAt)!;
  assert.deepEqual(result.offers.map(x => x.providerId), ['netflix', 'paramount']);
  assert.equal(result.offers[0].region, 'US');
  assert.equal(result.offers[0].requiresDeviceVerification, true);
});
test('duplicate title pages merge provider offers while retaining media type identity', () => {
  const a = normalizeShow(show(), checkedAt)!;
  const b = normalizeShow(show({ streamingOptions: { us: [offer('hulu', 'subscription', 'https://www.hulu.com/movie/synthetic')] } }), checkedAt)!;
  const c = normalizeShow(show({ showType: 'series' }), checkedAt)!;
  const merged = mergeTitles([a, b, a, c]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0].offers.map(x => x.providerId), ['netflix', 'hulu']);
  assert.equal(a.offers.length, 1);
});
test('missing metadata remains unknown and third-party artwork is never retained', () => {
  const result = normalizeShow(show({ title: null, releaseYear: null, overview: 'Not the chosen description source', rating: 87, imageSet: { poster: 'https://thirdparty.invalid/poster.jpg' } }), checkedAt)!;
  assert.equal(result.title.name, null);
  assert.equal(result.title.year, null);
  assert.equal(result.title.summary, null);
  assert.equal(result.title.ratings.state, 'missing');
  assert.ok(!JSON.stringify(result).includes('poster.jpg'));
  assert.equal(normalizeShow({ id: '100', showType: 'episode' }, checkedAt), null);
});
test('source URLs are candidates only and unsafe or off-provider destinations are rejected', () => {
  for (const url of ['javascript:alert(1)', 'https://evil.invalid/title/123', 'https://user:pass@www.netflix.com/title/123', 'https://www.netflix.com/']) {
    const result = normalizeShow(show({ streamingOptions: { us: [offer('netflix', 'subscription', url)] } }), checkedAt)!;
    assert.equal(result.offers[0].linkAccepted, false);
    assert.equal(result.offers[0].url, null);
  }
  assert.equal(normalizeShow(show(), checkedAt)!.offers[0].linkAccepted, true);
});
test('remote ID matching distinguishes entity types and rejects ambiguous same-type records', () => {
  assert.deepEqual(selectTvdbMatch({ data: [{ movie: { id: 10 } }, { series: { id: 20 } }] }, 'movie'), { status: 'matched', id: 10 });
  assert.deepEqual(selectTvdbMatch({ data: [{ series: { id: 20 } }] }, 'movie'), { status: 'unmatched', id: null });
  assert.deepEqual(selectTvdbMatch({ data: [{ movie: { id: 10 } }, { movie: { id: 11 } }] }, 'movie'), { status: 'ambiguous', id: null });
});
test('enrichment requires the expected IMDb ID and uses an English translation', () => {
  const data = { id: 10, name: 'Synthetic', year: '2020', remoteIds: [{ id: 'tt1234567', sourceName: 'IMDB' }], genres: [{ name: 'Horror' }], translations: { overviewTranslations: [{ language: 'fra', overview: 'French' }, { language: 'eng', overview: 'English overview' }] }, contentRatings: [{ country: 'usa', name: 'PG-13' }] };
  assert.equal(normalizeTvdb({ data }, 'tt9999999', 'movie'), null);
  const result = normalizeTvdb({ data }, 'tt1234567', 'movie')!;
  assert.equal(result.summary, 'English overview');
  assert.equal(result.year, 2020);
  assert.equal(result.ratings.ageLevel, 2);
  assert.deepEqual(result.genres, ['Horror']);
});
test('maturity uses country and media-specific certifications, never review scores', () => {
  assert.equal(classifyRatings([{ country: 'US', name: 'PG-13' }], 'movie').ageLevel, 2);
  assert.equal(classifyRatings([{ country: 'USA', name: 'TV-14' }], 'series').ageLevel, 2);
  assert.equal(classifyRatings([{ country: 'gb', name: '15' }], 'movie').state, 'missing');
  assert.equal(classifyRatings([{ country: 'US', name: 'TV-14' }], 'movie').state, 'unrecognized');
  assert.equal(classifyRatings([{ country: 'US', name: '87' }], 'movie').ageLevel, null);
});
test('missing, unrated, unrecognized and conflicting maturity labels stay distinct', () => {
  assert.equal(classifyRatings([], 'movie').state, 'missing');
  assert.equal(classifyRatings([{ country: 'US', name: 'NR' }], 'movie').state, 'unrated');
  assert.equal(classifyRatings([{ country: 'US', name: 'Unknown rating' }], 'movie').state, 'unrecognized');
  const conflict = classifyRatings([{ country: 'US', name: 'PG' }, { country: 'US', name: 'R' }], 'movie');
  assert.deepEqual(conflict.labels, ['PG', 'R']);
  assert.equal(conflict.state, 'conflict');
  assert.equal(conflict.ageLevel, null);
});
