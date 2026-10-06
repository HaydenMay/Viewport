import { record, textValue } from './model.ts';

export type SourceName = 'availability' | 'tvdb';
export type ErrorCategory = 'missing-secret' | 'destination' | 'redirect' | 'authentication' | 'quota' | 'budget' | 'network' | 'http' | 'not-found' | 'invalid-response';
export class TrialError extends Error {
  readonly source: SourceName;
  readonly category: ErrorCategory;
  constructor(source: SourceName, category: ErrorCategory) {
    super(`${source}: ${category}`);
    this.name = 'TrialError'; this.source = source; this.category = category;
  }
}

const bases = { availability: 'https://api.movieofthenight.com/v4', tvdb: 'https://api4.thetvdb.com/v4' };
const profiles = { trial: { availability: 25, tvdb: 260 }, preview: { availability: 75, tvdb: 700 } };
export type CatalogProfile = keyof typeof profiles;
export class TrialHttpClient {
  readonly caps: { availability: number; tvdb: number };
  readonly requests = { availability: 0, tvdb: 0 };
  readonly stopped: Partial<Record<SourceName, ErrorCategory>> = {};
  private keys: { tvdb: string; availability: string };
  private fetcher: typeof fetch;
  private token: string | null = null;

  constructor(keys: { tvdb: string; availability: string }, fetcher: typeof fetch, profile: CatalogProfile = 'trial') {
    this.caps = { ...profiles[profile] };
    for (const source of ['availability', 'tvdb'] as const) if (!keys[source]?.trim()) throw new TrialError(source, 'missing-secret');
    this.keys = keys; this.fetcher = fetcher;
  }

  async authenticateTvdb(): Promise<void> {
    if (this.token) return;
    const response = await this.send('tvdb', '/login', { method: 'POST', body: JSON.stringify({ apikey: this.keys.tvdb }) });
    const token = textValue(record(record(response).data).token);
    if (!token) { this.stopped.tvdb = 'invalid-response'; throw new TrialError('tvdb', 'invalid-response'); }
    this.token = token;
  }

  async request(source: SourceName, path: string, init: RequestInit = {}): Promise<unknown> {
    this.destination(source, path); // Validate before even the authentication request.
    if (source === 'tvdb') await this.authenticateTvdb();
    return this.send(source, path, init);
  }

  private destination(source: SourceName, path: string): string {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new TrialError(source, 'destination');
    const url = new URL(bases[source] + path);
    if (url.origin !== new URL(bases[source]).origin || !url.pathname.startsWith('/v4/')) throw new TrialError(source, 'destination');
    return url.href;
  }

  private async send(source: SourceName, path: string, init: RequestInit): Promise<unknown> {
    const url = this.destination(source, path);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (this.stopped[source]) throw new TrialError(source, this.stopped[source]!);
      if (this.requests[source] >= this.caps[source]) { this.stopped[source] = 'budget'; throw new TrialError(source, 'budget'); }
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      if (source === 'availability') headers.set('X-API-Key', this.keys.availability);
      else if (this.token) headers.set('Authorization', `Bearer ${this.token}`);
      if (init.body) headers.set('Content-Type', 'application/json');
      this.requests[source]++;
      let response: Response;
      try {
        response = await this.fetcher(url, { ...init, headers, redirect: 'error', signal: AbortSignal.timeout(20_000) });
      } catch {
        if (attempt === 0) { await new Promise(resolve => setTimeout(resolve, 250)); continue; }
        throw new TrialError(source, 'network');
      }
      if (response.status === 401 || response.status === 403 || response.status === 429) {
        const category = response.status === 429 ? 'quota' : 'authentication';
        this.stopped[source] = category; throw new TrialError(source, category);
      }
      if (response.status >= 300 && response.status < 400) throw new TrialError(source, 'redirect');
      if (response.status === 404) throw new TrialError(source, 'not-found');
      if (response.status >= 500 && attempt === 0) { await new Promise(resolve => setTimeout(resolve, 250)); continue; }
      if (!response.ok) throw new TrialError(source, 'http');
      try { return await response.json(); } catch { throw new TrialError(source, 'invalid-response'); }
    }
    throw new TrialError(source, 'http');
  }
}

export function createClients(keys: { tvdb: string; availability: string }, fetcher: typeof fetch = fetch, profile: CatalogProfile = 'trial'): TrialHttpClient {
  return new TrialHttpClient(keys, fetcher, profile);
}
