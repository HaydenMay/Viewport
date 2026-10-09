import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CatalogSnapshot } from '../../src/snapshot.ts';
import { SnapshotSource } from '../../src/snapshot.ts';

export function requireLocalEnvironment(env: NodeJS.ProcessEnv): void {
  if (env.CI || env.GITHUB_ACTIONS) throw new Error('Local snapshot export is disabled in CI.');
}

export async function writeLocalSnapshot(path: string, snapshot: CatalogSnapshot): Promise<void> {
  new SnapshotSource(snapshot);
  await mkdir(dirname(path), {recursive:true});
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(snapshot), {mode:0o600});
    await rename(temporary, path);
  } finally { await rm(temporary, {force:true}); }
}
