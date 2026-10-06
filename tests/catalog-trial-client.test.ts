import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClients, TrialError } from '../scripts/catalog-trial/client.ts';

const keys = { tvdb: 'synthetic-tvdb-secret', availability: 'synthetic-availability-secret' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

test('missing secrets fail before any upstream request', () => {
  let called = false;
  assert.throws(() => createClients({ ...keys, tvdb: '' }, async () => { called = true; return json({}); }), /missing-secret/);
  assert.equal(called, false);
});
test('clients use direct-portal auth and authenticate TVDB only once', async () => {
  const seen: Array<{ url: string; init: RequestInit | undefined }> = [];
  const client = createClients(keys, async (input, init) => { seen.push({ url: String(input), init }); return String(input).endsWith('/login') ? json({ data: { token: 'synthetic-token' } }) : json({ data: [] }); });
  await client.request('availability', '/shows/search/filters?country=us');
  await client.request('tvdb', '/search/remoteid/tt1234567');
  await client.request('tvdb', '/movies/10/extended');
  assert.equal(seen[0].url, 'https://api.movieofthenight.com/v4/shows/search/filters?country=us');
  assert.equal(new Headers(seen[0].init?.headers).get('X-API-Key'), keys.availability);
  assert.equal(seen[1].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(seen[1].init?.body)), { apikey: keys.tvdb });
  assert.equal(new Headers(seen[2].init?.headers).get('Authorization'), 'Bearer synthetic-token');
  assert.deepEqual(client.requests, { availability: 1, tvdb: 3 });
});
test('request caps prevent the next network call, including TVDB login usage', async () => {
  let calls = 0;
  const client = createClients(keys, async input => { calls++; return String(input).endsWith('/login') ? json({ data: { token: 'synthetic-token' } }) : json({ data: [] }); });
  for (let i = 0; i < 25; i++) await client.request('availability', '/shows/top');
  await assert.rejects(client.request('availability', '/shows/top'), /budget/);
  assert.equal(calls, 25);
  for (let i = 0; i < 259; i++) await client.request('tvdb', '/movies/10/extended');
  await assert.rejects(client.request('tvdb', '/movies/10/extended'), /budget/);
  assert.deepEqual(client.requests, { availability: 25, tvdb: 260 });
  assert.equal(calls, 285);
});
test('invalid API destinations and redirects cannot send credentials elsewhere', async () => {
  let calls = 0;
  const client = createClients(keys, async (_input, init) => { calls++; assert.equal(init?.redirect, 'error'); return new Response(null, { status: 302, headers: { location: 'https://evil.invalid/' } }); });
  await assert.rejects(client.request('availability', '//evil.invalid/'), /destination/);
  assert.equal(calls, 0);
  await assert.rejects(client.request('availability', '/shows/top'), /redirect/);
  assert.equal(calls, 1);
});
test('auth and quota errors stop that source without retries or raw error output', async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const client = createClients(keys, async () => { calls++; return json({ message: `${keys.availability} private response` }, status); });
    await assert.rejects(client.request('availability', '/shows/top'), e => e instanceof TrialError && !String(e).includes(keys.availability));
    await assert.rejects(client.request('availability', '/shows/top'), TrialError);
    assert.equal(calls, 1);
  }
});
test('transient failures retry once and both attempts count against the budget', async () => {
  let calls = 0;
  const client = createClients(keys, async () => ++calls === 1 ? json({}, 503) : json({ shows: [] }));
  assert.deepEqual(await client.request('availability', '/shows/top'), { shows: [] });
  assert.equal(client.requests.availability, 2);
  const broken = createClients(keys, async () => { throw new Error(keys.tvdb); });
  await assert.rejects(broken.request('availability', '/shows/top'), e => e instanceof TrialError && !String(e).includes(keys.tvdb));
  assert.equal(broken.requests.availability, 2);
});
test('missing records and invalid JSON are safe, reportable errors', async () => {
  const missing = createClients(keys, async () => json({ secret: keys.tvdb }, 404));
  await assert.rejects(missing.request('availability', '/shows/tt1234567'), /not-found/);
  const invalid = createClients(keys, async () => new Response(keys.availability));
  await assert.rejects(invalid.request('availability', '/shows/top'), /invalid-response/);
  assert.equal(invalid.requests.availability, 1);
});
