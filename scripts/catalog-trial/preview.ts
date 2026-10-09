import { appendFile } from 'node:fs/promises';
import { createClients, TrialError } from './client.ts';
import { evaluateCatalog, formatReport } from './evaluate.ts';
import { buildSnapshot } from './snapshot.ts';
import type { WikiCandidate } from './snapshot.ts';
import type { TrialRecord } from './model.ts';
import { SnapshotSource } from '../../src/snapshot.ts';
import { loadLaunchableCatalog } from '../../src/discovery.ts';
import { PrototypeLauncher } from '../../src/providers.ts';
import { filterTitles } from '../../src/filter.ts';
import { defaultPreferences } from '../../src/preferences.ts';
import { fileURLToPath } from 'node:url';
import { requireLocalEnvironment, writeLocalSnapshot } from './local-snapshot.ts';

// CI remains aggregate-only. Local export is explicitly requested and ignored by git.
try {
  const local = process.argv.includes('--local');
  if (local) requireLocalEnvironment(process.env);
  const clients = createClients({tvdb: process.env.TVDB_API_KEY ?? '', availability: process.env.STREAMING_AVAILABILITY_API_KEY ?? ''}, fetch, 'preview');
  const candidates = new Map<string, WikiCandidate>();
  let records: TrialRecord[] = [];
  const stamp = new Date().toISOString();
  const report = await evaluateCatalog(clients, stamp, {
    target: 300, wikidataFetcher: fetch,
    onRecords: selected => { records = selected; },
    onWikidataCandidate: (id, rating, itemId) => candidates.set(id, {rating,itemId}),
  });
  let summary = formatReport(report).replace('# Viewport catalog trial', '# Viewport 300-title catalog preview');
  if (report.completion !== 'failed' && records.length) {
    const snapshot = buildSnapshot(records, stamp, candidates);
    const source = new SnapshotSource(snapshot);
    const titles = await loadLaunchableCatalog(source, source, new PrototypeLauncher(snapshot.links));
    const prefs = defaultPreferences();
    const counts = {
      normalized: snapshot.titles.length, withAcceptedTitleLinks: titles.length,
      knownRatings: snapshot.titles.filter(x => x.ageLevel !== null).length,
      unknownRatings: snapshot.titles.filter(x => x.ageLevel === null).length,
      defaultDiscovery: filterTitles(titles,prefs).length,
      upToTeen: filterTitles(titles,{...prefs,maxAgeLevel:2}).length,
      upToPG: filterTitles(titles,{...prefs,maxAgeLevel:1}).length,
      noMaturityLimit: filterTitles(titles,{...prefs,maxAgeLevel:null}).length,
    };
    if (local) await writeLocalSnapshot(fileURLToPath(new URL('../../src/generated/catalog.json', import.meta.url)), snapshot);
    summary += `\n## App-ready snapshot preview\n\n${JSON.stringify(counts)}\n\n${local ? 'Local snapshot saved to src/generated/catalog.json. Run npm run dev:catalog. This file is ignored by git.' : 'Normalized only in memory.'} No source records, provider URL database or images are uploaded or published. Unknown ratings are excluded under every maturity limit. Candidate links still need device verification.\n`;
  }
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (report.completion === 'failed') process.exitCode = 1;
} catch (error) {
  process.stderr.write(`Catalog preview failed: ${error instanceof TrialError ? error.message : 'preview: internal-error'}. No catalog was published.\n`);
  process.exitCode = 1;
}
