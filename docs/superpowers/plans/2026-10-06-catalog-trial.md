# Viewport Catalog Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Plan and inline execution approved by the user on 2026-10-06.

**Goal:** Evaluate up to 100 real titles from Movie of the Night and TheTVDB, with a sanitized aggregate report and measured request usage.

**Architecture:** A standalone CI-only importer discovers US subscription titles, enriches them through matching TheTVDB external IDs, and evaluates normalized records. It uses a manually dispatched workflow independent of Pages. API clients, normalization and reporting are separate; no product interfaces change.

**Tech Stack:** Existing Node 22.18+, strict TypeScript, native fetch, node:test, GitHub Actions. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-06-catalog-trial-design.md` (approved in conversation on 2026-10-06).

## Global Constraints

- Use `TVDB_API_KEY` and `STREAMING_AVAILABILITY_API_KEY` only in the ingestion job; never browser/Vite variables.
- Only Netflix, Disney+, Hulu, Prime Video, Paramount+ and Peacock; country `us`, English metadata, included subscription offers only.
- Aim for 50 movies and 50 series, never more than 100 selected titles.
- Hard caps: 25 Movie of the Night requests and 260 TheTVDB requests, including auth and retries.
- No third-party artwork, TMDB API, scraping, paid subscription, production backend, accounts, AI classification or native development.
- Preserve all existing `src` behavior, fixture links/navigation, saved preferences and `.github/workflows/pages.yml`.
- Manual dispatch only. Never publish a source/title database or raw responses in public artifacts, git or Pages in this trial.
- Missing values remain null/unknown. Audience scores never become age ratings. Native launching remains unverified for every newly sourced URL.

## Review Focus

- Provider-scoped search can return unrelated offers: remove unsupported providers and non-US offers before reporting coverage.
- A title may occur in several pages/providers: merge offers without double-counting the title or losing provider coverage.
- An external-ID search can return multiple entity types: reject ambiguous/mismatched media instead of choosing the first hit.
- A quota/auth error may contain credentials or source text: logs and reports use fixed error categories, not response bodies.
- A server may repeat a cursor or omit it despite `hasMore`: stop deterministically and report incomplete sampling rather than looping.

---

## File map

| File | Responsibility |
| --- | --- |
| `scripts/catalog-trial/model.ts` | Versioned trial-only records, subscription projection, ID deduplication, rating classification, launch candidate analysis |
| `scripts/catalog-trial/client.ts` | Budgeted HTTP, direct-portal authentication, sanitized failures, bounded requests |
| `scripts/catalog-trial/evaluate.ts` | Bounded provider sampling, TheTVDB enrichment, aggregate report generation |
| `scripts/catalog-trial/run.ts` | Validate environment, execute trial, print only aggregate output and job summary |
| `tests/catalog-trial.test.ts` | Pure normalization and matching tests using synthetic records |
| `tests/catalog-trial-client.test.ts` | Mocked HTTP tests for error handling, budgets and request safety |
| `tests/catalog-trial-evaluate.test.ts` | End-to-end evaluation against mocked API responses |
| `.github/workflows/catalog-trial.yml` | Manual CI entry point using repository secrets; no Pages dependency |
| `docs/catalog-trial.md` | Operation, output interpretation and limitations |
| `docs/data-sources.md`, `README.md` | Replace the proposed TMDB dependency with the approved trial architecture |
| `.gitignore`, `tsconfig.json`, `package.json` | Ignore local trial output, typecheck importer and add `catalog:trial` command |

### Task 1: Normalize trial records and evaluate metadata

**Files:** Create `scripts/catalog-trial/model.ts`, `tests/catalog-trial.test.ts`; include `scripts/catalog-trial` in `tsconfig.json`.

**Interfaces:**
- `TrialTitle`: trial-owned stable ID, movie/series kind, source IDs, nullable year/summary/name, genres, metadata provenance and match status.
- `TrialOffer`: title ID, Big 6 provider ID, US subscription access, source URL, checked timestamp and verification-needed status.
- `normalizeShow(input: unknown, checkedAt: string): { title: TrialTitle; offers: TrialOffer[] } | null`.
- `mergeTitles(records: Array<{ title: TrialTitle; offers: TrialOffer[] }>): Array<{ title: TrialTitle; offers: TrialOffer[] }>`.
- `selectTvdbMatch(input: unknown, kind: 'movie' | 'series'): { status: 'matched' | 'unmatched' | 'ambiguous'; id: number | null }`.
- `normalizeTvdb(input: unknown, imdbId: string, kind: 'movie' | 'series'): TvdbMetadata | null`, verifying the expected remote ID and entity identity before enrichment.
- `classifyRatings(input: unknown, kind: 'movie' | 'series'): { labels: string[]; state: 'rated' | 'unrated' | 'missing' | 'unrecognized' | 'conflict'; ageLevel: 0 | 1 | 2 | 3 | null }`.

- [x] **Write failing tests** asserting: rent/buy/addon/free offers excluded; unsupported services and non-US offers excluded; one title offered twice merges provider coverage; movie/series IDs do not collide; absent year/overview remains null; same-kind multiple TheTVDB matches are ambiguous; wrong remote ID rejects enrichment; non-US certification does not become US maturity; `PG-13` and `TV-14` map to existing level 2; missing, NR and unknown labels remain distinct; conflicting labels are reported; audience `rating: 87` produces no maturity rating; unsafe/off-provider links are rejected; no image or backdrop fields are retained.
- [x] **Run RED:** `node --test tests/catalog-trial.test.ts`; expect missing implementation failures, then real assertion failures if stubs are used.
- [x] **Implement:** Use defensive record parsing, exact subscription/service checks, deduplication by media type/source ID, expected-ID matching, country normalization for `US`/`USA`, explicit US movie/TV label maps preserving existing age levels, and provider URL allowlists imported read-only from the current registry. Retain all source labels rather than erasing rating conflicts. Do not claim native success.
- [x] **Run GREEN:** `node --test tests/catalog-trial.test.ts && npm run typecheck`; expect all new tests pass and no TypeScript errors.
- [x] **Commit:** `git add scripts/catalog-trial/model.ts tests/catalog-trial.test.ts tsconfig.json && git commit -m 'Add catalog trial normalization and rating diagnostics'`.

### Task 2: Add safe budgeted API clients

**Files:** Create `scripts/catalog-trial/client.ts`, `tests/catalog-trial-client.test.ts`.

**Interfaces:**
- `SourceName = 'availability' | 'tvdb'`.
- `TrialHttpClient` accepts native-fetch-compatible dependency injection and secret configuration; exposes `requests` counters and `request(source: SourceName, path: string, init?: RequestInit): Promise<unknown>`.
- `TrialError` exposes a fixed safe category and source; does not retain/print raw response bodies, headers or thrown network messages.
- `createClients(keys: { tvdb: string; availability: string }, fetcher?: typeof fetch)` creates clients for `https://api.movieofthenight.com/v4` and `https://api4.thetvdb.com/v4`.

- [x] **Write failing tests** asserting: empty keys cause zero requests; availability uses `X-API-Key` with the direct-portal endpoint, not RapidAPI; TVDB authenticates through POST `/login` using `apikey` and sends returned bearer token; the 26th availability attempt and 261st TVDB attempt are prevented; attempts/retries count against caps; redirects to another origin do not forward keys; 401/403 and 429 do not retry; transient 5xx/network errors retry at most once; timeout/malformed JSON/body errors are sanitized; error output cannot contain fixture secrets; 404 lookup returns a reportable missing-record condition.
- [x] **Run RED:** `node --test tests/catalog-trial-client.test.ts`; expect missing implementation failures.
- [x] **Implement:** Restrict destinations to known API origins, reject redirects, use a finite timeout, count before sending each request, retry at most once with a bounded delay for transient failures only, and treat auth/quota failures as terminal. Never print upstream payloads. Login once per trial.
- [x] **Run GREEN:** `node --test tests/catalog-trial-client.test.ts && npm run typecheck`; expect passing tests and no type errors.
- [x] **Commit:** `git add scripts/catalog-trial/client.ts tests/catalog-trial-client.test.ts && git commit -m 'Add bounded authenticated catalog trial clients'`.

### Task 3: Run a deterministic 100-title evaluation and aggregate report

**Files:** Create `scripts/catalog-trial/evaluate.ts`, `scripts/catalog-trial/run.ts`, `tests/catalog-trial-evaluate.test.ts`; modify `.gitignore`, `package.json`.

**Interfaces:**
- Consumes Task 1 normalizers and Task 2 clients, with `PROVIDERS` only for candidate URL diagnostics.
- `evaluateCatalog(clients: ReturnType<typeof createClients>, checkedAt: string): Promise<TrialReport>`.
- `TrialReport`: version, completion/error categories, provider and movie/series counts, request counters, duplicate/multiple-provider counts, missing-field totals, match states, rating labels/states, candidate-link acceptance totals and unknown-content totals. No title names, summaries, raw source URLs or secret values.
- `formatReport(report: TrialReport): string` emits an aggregate Markdown summary suitable for public job logs.
- CLI validates keys first, produces summary even on partial failures, and exits nonzero for fatal configuration/auth/schema failures. Incomplete sample due to budgets is explicit, not mislabeled success.

- [x] **Write failing integration tests** asserting: six-provider movie/series sampling requests subscription catalogs and `us`; 100-title selection cap and 50/50 target; deduplication permits filling the target from subsequent pages; no provider or maturity preference prefiltering; `hasMore` cursor advances; repeated/missing cursors stop; TVDB remote search skips absent IMDb IDs; enrichment cannot use mismatched IDs; missing optional fields permit a partial record; auth/quota errors stop further work on the failing source; report accurately counts actual calls and unmatched titles; report contains none of the synthetic title/description/URL/credential strings.
- [x] **Run RED:** `node --test tests/catalog-trial-evaluate.test.ts`; expect missing evaluator failures.
- [x] **Implement:** Sample a first movie and series page per provider, interleave candidates deterministically, then request bounded extra pages where needed. Merge offers before selecting up to 50 per media kind; only relax the balance when exhausted provider results make the target impossible. Enrich selected records sequentially with `/search/remoteid/{imdbId}` and media-specific extended requests using `meta=translations&short=true`; English overview comes from the English translation when available. Reject ambiguous results and remote-ID conflicts. Calculate aggregate diagnostics and represent all incomplete/error states honestly.
- [x] **Add CLI and scripts:** `catalog:trial` runs `node scripts/catalog-trial/run.ts`; importer output stays outside `public/` and `dist/`. Ignore `catalog-trial-output/`; do not persist raw data by default. Use `GITHUB_STEP_SUMMARY` only for the safe aggregate report.
- [x] **Run GREEN:** `node --test tests/catalog-trial*.test.ts && npm run typecheck`; expect passing tests. Run `npm run catalog:trial` with neither key set; expect a sanitized missing-secret error and no upstream request.
- [x] **Commit:** `git add scripts/catalog-trial tests/catalog-trial-evaluate.test.ts package.json .gitignore && git commit -m 'Add 100-title catalog trial evaluation and reporting'`.

### Task 4: Wire manual CI, document operation and verify preservation

**Files:** Create `.github/workflows/catalog-trial.yml`, `docs/catalog-trial.md`; update `README.md`, `docs/data-sources.md`, the plan/spec status and `docs/verification.md`.

**Interfaces:** Consumes `npm run catalog:trial` and `formatReport`; provides a manual Actions run with an aggregate job summary. No changes to `.github/workflows/pages.yml` or application `src` files.

- [x] **Create workflow:** `workflow_dispatch` only, read-only repository permissions, one serialized trial concurrency group, finite job timeout, checkout/setup Node 22.18+ with locked dependency installation. Run existing `npm run verify` before exposing both secrets only to the trial step. No artifact containing title data and no auto-commit/publish/schedule. Do not add secrets to global build environment.
- [x] **Document:** Exact secret names, direct-portal key compatibility, manual Actions steps, both hard caps, output definitions, missing/unrated/unrecognized distinctions, provider subscription/add-on handling, no-poster policy, no API calls during browsing, current legal distribution uncertainty, and the fact that this run does not expand the live catalog. Replace proposed TMDB ingestion guidance while retaining relevant historical launch research.
- [x] **Verify:** `npm run verify` must pass all old and new tests, strict typecheck and Vite production build. `git diff --check` must pass. Compare all `src` files, fixture URLs and Pages workflow with the pre-trial base; there must be no runtime changes. Parse/check workflow YAML and inspect secret scope, permissions and dispatch trigger.
- [x] **Review:** Perform a fresh whole-change review against the five Review Focus items and the approved spec. Use a reviewer if permitted/available; otherwise explicitly record author self-review. Fix important defects with reproducing tests.
- [x] **Commit:** `git add .github/workflows/catalog-trial.yml docs README.md && git commit -m 'Add manual catalog trial workflow and operating guide'`.
- [ ] **Publish authorized changes:** Sync the feature to the connected GitHub repository using a non-forced, current-head update. Do not overwrite unrelated changes. The live app deploys the same runtime source. If Actions is unavailable, do not wait indefinitely.
- [ ] **Real-run handoff:** Dispatch the manual trial if the connected tool supports it within existing authorization; otherwise provide the user the Actions link and exact Run workflow instruction. Do not request or retrieve secret values. Fetch the aggregate report when a run exists. If it cannot be run in this session, state clearly that real credentials/coverage are unverified rather than claiming completion of the data evaluation.

## Completion report

State separately: implementation/test/build status; whether a real API trial ran; actual title counts and requests if available; live catalog remains 24 fixtures; metadata weaknesses revealed; and the next decision about a larger catalog. Stop after this evaluation milestone. No catalog overhaul or new feature begins automatically.
