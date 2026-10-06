import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWikidata } from '../scripts/catalog-trial/wikidata.ts';
import { normalizeShow, classifyRatings } from '../scripts/catalog-trial/model.ts';
const title = (id: number, kind = 'movie') => normalizeShow({ id: String(id), showType: kind, imdbId: `tt${1000000 + id}`, title: 'Private title', streamingOptions: {} }, '2026-10-06')!;
const literal = (value: string) => ({ type: 'literal', value });
const uri = (id: string) => ({ type: 'uri', value: `http://www.wikidata.org/entity/${id}` });
const row = (id: number, item: string, rating?: string, qualified = false) => ({ imdb: literal(`tt${1000000 + id}`), item: uri(item), ...(rating ? { rating: uri(rating), qualified: literal(String(qualified)), referenced: literal('true') } : {}) });
const json = (bindings: unknown[]) => new Response(JSON.stringify({ results: { bindings } }));

test('Wikidata batches movie IDs, keeps TV untested and reports fills without mutating catalog data', async () => {
  const items = Array.from({ length: 50 }, (_, i) => title(i + 1));
  items.push(title(101, 'series'));
  let requests = 0;
  const report = await evaluateWikidata(items, async (input, init) => {
    assert.equal(new URL(String(input)).origin, 'https://query.wikidata.org');
    assert.equal(init?.redirect, 'error');
    assert.ok(new Headers(init?.headers).get('User-Agent')?.includes('Viewport'));
    assert.ok(!new Headers(init?.headers).has('Authorization'));
    const query = new URLSearchParams(String(init?.body)).get('query')!;
    assert.ok(query.includes('P1657')); assert.ok(query.includes('DeprecatedRank'));
    assert.equal((query.match(/"tt\d+"/g) ?? []).length, 25);
    requests++;
    return json(Array.from({ length: 25 }, (_, i) => row(i + 1 + (requests - 1) * 25, `Q${i + 1 + (requests - 1) * 25}`, 'Q18665339')));
  });
  assert.equal(report.requests, 2);
  assert.equal(report.moviesTested, 50);
  assert.equal(report.seriesNotTested, 1);
  assert.equal(report.states.rated, 50);
  assert.equal(report.fillsMissing, 50);
  assert.equal(items[0].title.ratings.state, 'missing');
  assert.ok(!JSON.stringify(report).includes('Private title'));
  assert.ok(!JSON.stringify(report).includes('tt1000001'));
});

test('ambiguous, qualified, unknown and absent ratings do not become trusted candidates', async () => {
  const items = Array.from({ length: 6 }, (_, i) => title(i + 1));
  items[5].title.ratings = classifyRatings([{ country: 'usa', name: 'R' }], 'movie');
  const report = await evaluateWikidata(items, async () => json([
    row(1, 'Q1', 'Q18665334'), row(1, 'Q2', 'Q18665334'),
    row(2, 'Q3', 'Q18665339', true), row(3, 'Q4', 'Q999'),
    row(4, 'Q5'), row(6, 'Q6', 'Q18665339'),
  ]));
  assert.deepEqual(report.states, { ambiguous: 1, qualified: 1, unrecognized: 1, 'missing-rating': 1, 'no-match': 1, rated: 1 });
  assert.equal(report.fillsMissing, 0);
  assert.equal(report.disagreements, 1);
});

test('quota and malformed responses stop further Wikidata requests without leaking response text', async () => {
  for (const response of [new Response('secret response', { status: 429 }), new Response('{"unexpected":"secret response"}')]) {
    let calls = 0;
    const report = await evaluateWikidata(Array.from({ length: 50 }, (_, i) => title(i + 1)), async () => { calls++; return response; });
    assert.equal(calls, 1);
    assert.equal(report.status, 'failed');
    assert.equal(report.states.error, 50);
    assert.ok(!JSON.stringify(report).includes('secret response'));
  }
});


test('conflicting ratings on one item and out-of-batch bindings cannot fill missing ratings', async () => {
  const conflict = await evaluateWikidata([title(1)], async () => json([
    row(1, 'Q1', 'Q18665334'), row(1, 'Q1', 'Q18665344'),
  ]));
  assert.equal(conflict.states.conflict, 1);
  assert.equal(conflict.fillsMissing, 0);
  const invalid = await evaluateWikidata([title(1)], async () => json([
    row(1, 'Q1', 'Q18665334'), row(2, 'Q2', 'Q18665344'),
  ]));
  assert.equal(invalid.status, 'failed');
  assert.equal(invalid.fillsMissing, 0);
  assert.equal(invalid.errors['invalid-response'], 1);
});
