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
  assert.equal(report.ratingStates['not-evaluated'], 2);
  assert.equal(report.missing.usRating, 0);
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
  assert.equal(report.errors.tvdb?.['invalid-response'], 100);
  assert.equal(report.matchStates.unmatched ?? 0, 0);
  assert.equal(report.matchStates.error, 100);
  assert.equal(report.requests.tvdb, 101);
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


test('one unexpected search envelope does not prevent evaluating later ratings and emits only safe diagnostics', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie'), sourceShow(2, 'movie')] : [], hasMore: false });
    if (u.pathname.includes('/search/remoteid/')) return u.pathname.endsWith('tt1000001') ? json({ status: 'secret-string', data: null, privateField: keys.tvdb }) : json({ data: [{ movie: { id: 2 } }] });
    return json({ data: { id: 2, remoteIds: [{ id: 'tt1000002', sourceName: 'IMDB' }], contentRatings: [] } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.completion, 'failed');
  assert.equal(report.matchStates.error, 1);
  assert.equal(report.matchStates.matched, 1);
  assert.equal(report.ratingStates['not-evaluated'], 1);
  assert.equal(report.ratingStates.missing, 1);
  assert.equal(report.missing.usRating, 1);
  assert.deepEqual(report.responseDiagnostics, { 'remote-search:invalid-response:null': 1 });
  assert.equal(report.requests.tvdb, 5);
  const output = formatReport(report);
  assert.ok(output.includes('remote-search:invalid-response:null'));
  for (const secret of ['secret-string', 'privateField', keys.tvdb, 'tt1000001']) assert.ok(!output.includes(secret));
});

test('null remote results remain unresolved and yield a partial evaluation, not a schema failure', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie'), sourceShow(2, 'movie')] : [], hasMore: false });
    return u.pathname.endsWith('tt1000001') ? json({ status: 'success', data: null }) : json({ data: null });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.completion, 'partial');
  assert.equal(report.matchStates.unresolved, 2);
  assert.equal(report.matchStates.unmatched ?? 0, 0);
  assert.equal(report.matchStates.error ?? 0, 0);
  assert.deepEqual(report.errors, {});
  assert.equal(report.ratingStates['not-evaluated'], 2);
  assert.equal(report.missing.usRating, 0);
  assert.deepEqual(report.responseDiagnostics, { 'remote-search:empty-result:null': 2 });
  assert.equal(report.requests.tvdb, 3);
});

test('explicit failure envelopes stay errors even when their search data is null or an array', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie'), sourceShow(2, 'movie')] : [], hasMore: false });
    return json({ status: 'failure', data: u.pathname.endsWith('tt1000001') ? null : [] });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.completion, 'failed');
  assert.equal(report.matchStates.error, 2);
  assert.equal(report.matchStates.unresolved ?? 0, 0);
});

test('rating audit separates media types and limits trusted full-response checks to three per kind', async () => {
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') {
      const kind = u.searchParams.get('show_type')!;
      return json({ shows: u.searchParams.get('catalogs') === 'netflix.subscription' ? Array.from({ length: 5 }, (_, i) => sourceShow(i + (kind === 'movie' ? 1 : 101), kind)) : [], hasMore: false });
    }
    if (u.pathname.includes('/search/remoteid/')) {
      const id = Number(u.pathname.split('tt')[1]) - 1000000;
      return json({ data: [{ [id > 100 ? 'series' : 'movie']: { id } }] });
    }
    const id = Number(u.pathname.split('/')[3]);
    return json({ data: { id, remoteIds: [{ id: `tt${1000000 + id}`, sourceName: 'IMDB' }], contentRatings: u.searchParams.get('short') === 'false' ? [{ country: 'usa', name: id > 100 ? 'TV-14' : 'PG-13' }] : [] } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.deepEqual(report.ratingAudit.fieldShapes, { 'array-empty': 10 });
  assert.deepEqual(report.ratingAudit.byKind, { movie: { missing: 5 }, series: { missing: 5 } });
  assert.deepEqual(report.ratingAudit.fullChecks, { attempted: 6, movie: 3, series: 3, improved: 6, unchanged: 0, failed: 0 });
  // Investigation must not silently replace ratings with a small diagnostic sample.
  assert.equal(report.ratingStates.missing, 10);
  assert.equal(report.requests.tvdb, 27);
});

test('full-response audit rejects a different title without changing the trusted match', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? [sourceShow(1, 'movie')] : [], hasMore: false });
    if (u.pathname.includes('/search/remoteid/')) return json({ data: [{ movie: { id: 1 } }] });
    return json({ data: { id: u.searchParams.get('short') === 'false' ? 999 : 1, remoteIds: [{ id: 'tt1000001', sourceName: 'IMDB' }], contentRatings: [] } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.equal(report.matchStates.matched, 1);
  assert.equal(report.ratingAudit.fullChecks.failed, 1);
  assert.equal(report.ratingAudit.fullChecks.improved, 0);
  assert.equal(report.ratingAudit.fullErrors['id-conflict'], 1);
});

test('rating audit distinguishes empty, absent, foreign, missing-country and wrong-media data safely', async () => {
  let page = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'token' } });
    if (u.hostname === 'api.movieofthenight.com') return json({ shows: ++page === 1 ? Array.from({ length: 6 }, (_, i) => sourceShow(i + 1, 'movie')) : [], hasMore: false });
    if (u.pathname.includes('/search/remoteid/')) return json({ data: [{ movie: { id: Number(u.pathname.split('tt')[1]) - 1000000 } }] });
    const id = Number(u.pathname.split('/')[3]);
    const ratings = [[], [{ country: 'gbr', name: 'secret-label' }], [{ id: 3, name: 'R' }], [{ country: 'usa', name: 'TV-14' }], null];
    return json({ data: { id, remoteIds: [{ id: `tt${1000000 + id}`, sourceName: 'IMDB' }], ...(id === 6 ? {} : { contentRatings: ratings[id - 1] }) } });
  });
  const report = await evaluateCatalog(client, stamp);
  assert.deepEqual(report.ratingAudit.fieldShapes, { 'array-empty': 1, 'array-populated': 3, null: 1, absent: 1 });
  assert.deepEqual(report.ratingAudit.entryShapes, { 'country-other': 1, 'country-missing': 1, 'us:unrecognized': 1, 'us:other-media-label': 1 });
  assert.deepEqual(report.ratingAudit.byKind.movie, { missing: 5, unrecognized: 1 });
  assert.equal(report.ratingAudit.fullChecks.unchanged, 3);
  assert.ok(!formatReport(report).includes('secret-label'));
});

test('catalog preview selects a bounded 300-title sample through the existing pipeline', async () => {
  let nextId = 1;
  let captured = 0;
  const client = createClients(keys, async input => {
    const u = new URL(String(input));
    if (u.pathname.endsWith('/login')) return json({ data: { token: 'private-bearer' } });
    if (u.hostname === 'api4.thetvdb.com') return json({ data: [] });
    const shows = Array.from({ length: 20 }, () => sourceShow(nextId++, u.searchParams.get('show_type')!, u.searchParams.get('catalogs')!.split('.')[0]));
    return json({ shows, hasMore: true, nextCursor: String(nextId) });
  }, 'preview');
  const report = await evaluateCatalog(client, stamp, { target: 300, onRecords: records => { captured = records.length; } });
  assert.equal(report.selected, 300);
  assert.equal(captured, 300);
  assert.deepEqual(report.kinds, { movie: 150, series: 150 });
  assert.ok(report.requests.availability <= 75);
  assert.ok(report.requests.tvdb <= 700);
  assert.ok(!formatReport(report).includes('Never publish'));
});

test('English catalog queries filter original language on every provider page and retain query evidence',async()=>{
 const queries:URL[]=[];let records:import('../scripts/catalog-trial/model.ts').TrialRecord[]=[];
 const client=createClients(keys,async input=>{
  const u=new URL(String(input));if(u.pathname.endsWith('/login'))return json({data:{token:'private-bearer'}});
  queries.push(u);const id=queries.length;
  return json({shows:[sourceShow(id,u.searchParams.get('show_type')!,'netflix',false)],hasMore:false});
 });
 await evaluateCatalog(client,stamp,{englishOnly:true,onRecords:value=>records=value});
 assert.equal(queries.length,12);assert.ok(queries.every(u=>u.searchParams.get('show_original_language')==='en'&&u.searchParams.get('output_language')==='en'));
 assert.equal(records.length,12);assert.ok(records.every(r=>r.title.originalLanguage==='en'&&r.title.languageEvidence==='availability-query'));
});

test('varied preview uses three independent orderings for every Big 6 provider and media kind', async()=>{
 const queries:URL[]=[];
 const client=createClients(keys,async input=>{
  const u=new URL(String(input));
  if(u.pathname.endsWith('/login'))return json({data:{token:'private-bearer'}});
  if(u.hostname==='api4.thetvdb.com')return json({data:[]});
  queries.push(u);
  const index=queries.length;
  return json({shows:Array.from({length:20},(_,i)=>sourceShow(index*100+i,u.searchParams.get('show_type')!,u.searchParams.get('catalogs')!.split('.')[0],true)),hasMore:false});
 },'preview');
 const report=await evaluateCatalog(client,stamp,{target:600,englishOnly:true,varied:true,wikidataFetcher:async()=>json({results:{bindings:[]}})});
 assert.equal(report.selected,600);
 assert.equal(report.wikidata?.requests,12);
 assert.deepEqual(report.kinds,{movie:300,series:300});
 assert.equal(queries.length,36);
 for(const provider of ['netflix','disney','hulu','prime','paramount','peacock'])for(const kind of ['movie','series']){
  const orders=queries.filter(u=>u.searchParams.get('catalogs')===provider+'.subscription'&&u.searchParams.get('show_type')===kind).map(u=>u.searchParams.get('order_by'));
  assert.deepEqual(orders,['popularity_alltime','rating','release_date']);
 }
 assert.ok(queries.every(u=>u.searchParams.get('order_direction')==='desc'&&u.searchParams.get('show_original_language')==='en'));
});
