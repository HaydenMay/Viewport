import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClients } from '../scripts/catalog-trial/client.ts';
import { evaluateCatalog, formatReport } from '../scripts/catalog-trial/evaluate.ts';

const keys = { tvdb: 'private-tvdb', availability: 'private-availability' };
const stamp = '2026-10-06T16:00:00Z';
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const sourceShow = (id: number, kind: string, provider = 'netflix', imdb = true) => ({ id: String(id), showType: kind, title: 'Never publish this title', imdbId: imdb ? `tt${1000000 + id}` : null, releaseYear: 2020, firstAirYear: 2020, genres: [{ id: 'horror', name: 'Horror' }], overview: 'Never publish this description', streamingOptions: { us: [{ service: { id: provider }, type: 'subscription', link: provider === 'netflix' ? `https://www.netflix.com/title/${id}/` : 'https://www.hulu.com/movie/synthetic' }] } });

test('the real evaluator selects 100 titles, balances movie/series and aggregates without data disclosure', async () => {
  const urls: URL[] = [];
  const providerIds = ['netflix', 'disney', 'hulu', 'prime', 'paramount', 'peacock'];
  const client = createClients(keys, async input => {
    const u = new URL(String(input)); urls.push(u);
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'private-bearer' } });
    if (u.hostname === 'api.movieofthenight.com') {
      assert.equal(u.searchParams.get('country'), 'us');
      assert.equal(u.searchParams.get('series_granularity'), 'show');
      assert.equal(u.searchParams.get('output_language'), 'en');
      assert.ok(!u.searchParams.has('genres'));
      const catalog = u.searchParams.get('catalogs')!;
      assert.ok(catalog.endsWith('.subscription'));
      const provider = catalog.split('.')[0];
      const offset = providerIds.indexOf(provider) * 1000 + (u.searchParams.get('show_type') === 'series' ? 100 : 0);
      return json({ shows: Array.from({ length: 20 }, (_, i) => sourceShow(offset + i + 1, u.searchParams.get('show_type')!, provider)), hasMore: false });
    }
    if (u.pathname.includes('/search/remoteid/')) {
      const id = Number(u.pathname.split('tt')[1]) - 1000000;
      return json({ data: [{ [id % 1000 >= 100 ? 'series' : 'movie']: { id } }] });
    }
    const id = Number(u.pathname.split('/')[3]);
    assert.equal(u.searchParams.get('meta'), 'translations');
    assert.equal(u.searchParams.get('short'), 'true');
    return json({ data: { id, name: 'Never publish TVDB name', year: '2020', remoteIds: [{ id: `tt${1000000 + id}`, sourceName: 'IMDB' }], genres: [{ name: 'Horror' }], translations: { overviewTranslations: [{ language: 'eng', overview: 'Never publish TVDB overview' }] }, contentRatings: [{ country: 'usa', name: id % 1000 >= 100 ? 'TV-14' : 'PG-13' }] } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.selected, 100);
  assert.deepEqual(report.kinds, { movie: 50, series: 50 });
  assert.equal(report.matchStates.matched, 100);
  assert.equal(report.missing.summary, 0);
  assert.equal(report.horrorGenre, 100);
  assert.equal(report.unknownContent.seasonal, 100);
  assert.equal(report.completion, 'complete');
  assert.deepEqual(report.requests, { availability: 12, tvdb: 201 });
  assert.ok(providerIds.every(id => report.providers[id] > 0));
  const output = formatReport(report);
  for (const privateString of ['Never publish', 'private-', 'https://www.netflix.com/title/']) assert.ok(!output.includes(privateString));
  assert.ok(urls.every(u => !u.href.includes('private-')));
});

test('pagination fills deduplicated samples and stops a repeated cursor without looping', async () => {
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'private-bearer' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ data: [] });
    if (u.searchParams.get('catalogs') !== 'netflix.subscription' || u.searchParams.get('show_type') !== 'movie') return json({ shows: [], hasMore: false });
    return u.searchParams.has('cursor') ? json({ shows: [sourceShow(1, 'movie'), sourceShow(2, 'movie')], hasMore: true, nextCursor: 'same-cursor' }) : json({ shows: [sourceShow(1, 'movie')], hasMore: true, nextCursor: 'same-cursor' });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.selected, 2);
  assert.equal(report.duplicates, 1);
  assert.equal(report.discoveryIssues['repeated-cursor'], 1);
  assert.equal(report.requests.availability, 13);
  assert.equal(report.completion, 'partial');
});

test('missing pagination cursors and malformed show envelopes are reported', async () => {
  let pages = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ data: [] });
    return ++pages === 1 ? json({ shows: [sourceShow(1, 'movie', 'netflix', false)], hasMore: true }) : json({ unexpected: [] });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.matchStates['missing-id'], 1);
  assert.equal(report.discoveryIssues['missing-cursor'], 1);
  assert.ok(report.errors.availability?.['invalid-response']);
  assert.equal(report.requests.tvdb, 1);
  assert.equal(report.completion, 'failed');
});

test('enrichment rejects conflicting identifiers and does not fabricate certifications', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie'), sourceShow(2, 'movie')] : [], hasMore: false });
    if (u.pathname.includes('/search/remoteid/')) return json({ data: [{ movie: { id: 10 } }] });
    return json({ data: { id: 10, remoteIds: [{ id: 'tt9999999', sourceName: 'IMDB' }], contentRatings: [{ country: 'usa', name: 'R' }] } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.matchStates['id-conflict'], 2);
  assert.equal(report.ratingStates.missing, 2);
  assert.equal(report.missing.summary, 2);
});

test('authentication failure prevents spending availability quota and still yields an honest report', async () => {
  const client = createClients(keys, async () => json({ message: keys.tvdb }, 401));
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.selected, 0);
  assert.equal(report.completion, 'failed');
  assert.deepEqual(report.requests, { availability: 0, tvdb: 1 });
  assert.equal(report.errors.tvdb?.authentication, 1);
  assert.ok(!formatReport(report).includes(keys.tvdb));
});

test('malformed TVDB search responses fail rather than claiming an unmatched complete trial', async () => {
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ unexpected: [] });
    const kind = u.searchParams.get('show_type')!;
    const provider = u.searchParams.get('catalogs')!.split('.')[0];
    const index = ['netflix','disney','hulu','prime','paramount','peacock'].indexOf(provider);
    return json({ shows: Array.from({ length: 20 }, (_, i) => sourceShow(index * 1000 + (kind === 'series' ? 100 : 0) + i + 1, kind, provider)), hasMore: false });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.selected, 100);
  assert.equal(report.completion, 'failed');
  assert.equal(report.errors.tvdb?.['invalid-response'], 1);
  assert.equal(report.matchStates.unmatched ?? 0, 0);
  assert.equal(report.matchStates.error, 100);
  assert.equal(report.requests.tvdb, 2);
});

test('exhausted movie results allow 100 series without consuming additional pagination quota', async () => {
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ data: [] });
    if (u.searchParams.get('show_type') === 'movie') return json({ shows: [], hasMore: false });
    const provider = u.searchParams.get('catalogs')!.split('.')[0];
    const index = ['netflix','disney','hulu','prime','paramount','peacock'].indexOf(provider);
    return json({ shows: Array.from({ length: 20 }, (_, i) => sourceShow(index * 1000 + i + 1, 'series', provider, false)), hasMore: true, nextCursor: 'more' });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.selected, 100);
  assert.deepEqual(report.kinds, { movie: 0, series: 100 });
  assert.equal(report.requests.availability, 12);
});

test('exhausted series results symmetrically allow 100 movies from already collected pages', async () => {
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ data: [] });
    if (u.searchParams.get('show_type') === 'series') return json({ shows: [], hasMore: false });
    const provider = u.searchParams.get('catalogs')!.split('.')[0];
    const index = ['netflix','disney','hulu','prime','paramount','peacock'].indexOf(provider);
    return json({ shows: Array.from({ length: 20 }, (_, i) => sourceShow(index * 1000 + i + 1, 'movie', provider, false)), hasMore: true, nextCursor: 'more' });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.deepEqual(report.kinds, { movie: 100, series: 0 });
  assert.equal(report.requests.availability, 12);
});

test('malformed extended metadata is a schema failure rather than an identifier conflict', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie')] : [], hasMore: false });
    if (u.pathname.includes('/search/remoteid/')) return json({ data: [{ movie: { id: 10 } }] });
    return json({ unexpected: [] });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.completion, 'failed');
  assert.equal(report.matchStates.error, 1);
  assert.equal(report.matchStates['id-conflict'] ?? 0, 0);
  assert.equal(report.errors.tvdb?.['invalid-response'], 1);
});
