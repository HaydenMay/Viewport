import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireLocalEnvironment, writeLocalSnapshot } from '../scripts/catalog-trial/local-snapshot.ts';
import { TITLES } from '../src/catalog.ts';

test('local export refuses CI before ingestion', () => {
  assert.throws(() => requireLocalEnvironment({CI:'true'}), /disabled in CI/);
  assert.throws(() => requireLocalEnvironment({GITHUB_ACTIONS:'true'}), /disabled in CI/);
  requireLocalEnvironment({});
});
test('local snapshot is private, atomic, and preserves last good data on validation failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'viewport-'));
  const path = join(directory, 'catalog.json');
  const snapshot = {version:1 as const,generatedAt:new Date().toISOString(),titles:[TITLES[0]],offers:[],links:[]};
  try {
    await writeLocalSnapshot(path, snapshot);
    const contents = await readFile(path,'utf8');
    assert.equal(JSON.parse(contents).titles[0].id, TITLES[0].id);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    await assert.rejects(writeLocalSnapshot(path,{...snapshot,titles:[]}));
    assert.equal(await readFile(path,'utf8'), contents);
    assert.deepEqual(await readdir(directory), ['catalog.json']);
  } finally { await rm(directory,{recursive:true,force:true}); }
});
