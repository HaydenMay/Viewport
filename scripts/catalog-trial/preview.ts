import { appendFile, readFile, mkdir, writeFile } from 'node:fs/promises';
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
import { encryptSnapshot } from './encrypted-snapshot.ts';

// CI remains aggregate-only. Local export is explicitly requested and ignored by git.
try {
  const local = process.argv.includes('--local');
  const encrypted = process.argv.includes('--encrypted');
  if(local && encrypted) throw new Error('Choose one export mode');
  if (local) requireLocalEnvironment(process.env);
  const publicKey = encrypted ? await readFile(new URL('../../config/private-preview-public.pem',import.meta.url),'utf8') : null;
  const clients = createClients({tvdb: process.env.TVDB_API_KEY ?? '', availability: process.env.STREAMING_AVAILABILITY_API_KEY ?? ''}, fetch, 'preview');
  const candidates = new Map<string, WikiCandidate>();
  let records: TrialRecord[] = [];
  const stamp = new Date().toISOString();
  const report = await evaluateCatalog(clients, stamp, {
    target: 600, varied: true, englishOnly: true, wikidataFetcher: fetch,
    onRecords: selected => { records = selected; },
    onWikidataCandidate: (id, rating, itemId) => candidates.set(id, {rating,itemId}),
  });
  let summary = formatReport(report).replace('# Viewport catalog trial', '# Viewport 600-title varied catalog preview');
  if (report.completion !== 'failed' && records.length) {
    const snapshot = buildSnapshot(records, stamp, candidates, true);
    summary += '\nLanguage policy: English original language, confirmed by the documented availability-query filter; this does not certify provider audio tracks. Unknown-language records are excluded.\n';
    const source = new SnapshotSource(snapshot);
    const titles = await loadLaunchableCatalog(source, source, new PrototypeLauncher(snapshot.links));
    const prefs = defaultPreferences();
    const counts = {
      normalized: snapshot.titles.length,
      titleInitials: snapshot.titles.reduce<Record<string,number>>((counts,title)=>{const initial=title.name[0]?.toUpperCase()??'?';counts[initial]=(counts[initial]??0)+1;return counts;},{}), withAcceptedTitleLinks: titles.length,
      knownRatings: snapshot.titles.filter(x => x.ageLevel !== null).length,
      unknownRatings: snapshot.titles.filter(x => x.ageLevel === null).length,
      defaultDiscovery: filterTitles(titles,prefs).length,
      upToTeen: filterTitles(titles,{...prefs,maxAgeLevel:2}).length,
      upToPG: filterTitles(titles,{...prefs,maxAgeLevel:1}).length,
      noMaturityLimit: filterTitles(titles,{...prefs,maxAgeLevel:null}).length,
    };
    if (local) await writeLocalSnapshot(fileURLToPath(new URL('../../src/generated/catalog.json', import.meta.url)), snapshot);
    if(publicKey) {
      const envelope=encryptSnapshot(snapshot,publicKey);
      await mkdir('catalog-trial-output',{recursive:true});
      await writeFile('catalog-trial-output/catalog.encrypted.json',JSON.stringify(envelope),{mode:0o600});
      summary += '\nPrivate transfer: an encrypted snapshot was generated. No plaintext title records are written to disk or uploaded. Only the private preview operator holds the decryption key.\n';
    }
    summary += `\n## App-ready snapshot preview\n\n${JSON.stringify(counts)}\n\n${local ? 'Local snapshot saved to src/generated/catalog.json. Run npm run dev:catalog. This file is ignored by git.' : 'Normalized only in memory.'} No source records, provider URL database or images are uploaded or published. Unknown ratings are excluded under every maturity limit. Candidate links still need device verification.\n`;
  }
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (report.completion === 'failed') process.exitCode = 1;
} catch (error) {
  process.stderr.write(`Catalog preview failed: ${error instanceof TrialError ? error.message : 'preview: internal-error'}. No catalog was published.\n`);
  process.exitCode = 1;
}
