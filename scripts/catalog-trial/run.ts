import { appendFile } from 'node:fs/promises';
import { createClients, TrialError } from './client.ts';
import { evaluateCatalog, formatReport } from './evaluate.ts';

try {
  const clients = createClients({ tvdb: process.env.TVDB_API_KEY ?? '', availability: process.env.STREAMING_AVAILABILITY_API_KEY ?? '' });
  const report = await evaluateCatalog(clients, new Date().toISOString(), { wikidataFetcher: fetch });
  const summary = formatReport(report);
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  if (report.completion === 'failed') process.exitCode = 1;
} catch (error) {
  const message = error instanceof TrialError ? error.message : 'trial: internal-error';
  process.stderr.write(`Catalog trial failed: ${message}. No catalog was published.\n`);
  process.exitCode = 1;
}
