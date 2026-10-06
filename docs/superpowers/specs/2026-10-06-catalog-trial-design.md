# Viewport: 100-title catalog evaluation

Status: design approved on 2026-10-06; importer implementation follows the approved plan. Real API execution and public catalog publication remain separate stages.

## Goal and agreed decisions

Evaluate whether TheTVDB metadata plus Movie of the Night US subscription availability can supply a useful, inexpensive Viewport catalog. Produce evidence from up to 100 real movies/shows before replacing the 24-entry fixture or expanding to 300–1,000 titles.

The user has registered Viewport with TheTVDB and added repository secrets named `TVDB_API_KEY` and `STREAMING_AVAILABILITY_API_KEY`. The screenshot confirms two secrets exist but truncates the latter name; the workflow must validate presence without displaying either value. API approval, key validity, response completeness and total request usage have not yet been tested.

Only Netflix, Disney+, Hulu, Prime Video, Paramount+ and Peacock are in scope. Existing native results for the first three plus Paramount+ and web results for Prime/Peacock remain the ground truth. Preserve existing checked links and navigation verbatim. Use original neutral artwork. No TMDB API, provider scraping, paid API subscriptions, accounts, production backend, AI classification or native development.

## Existing implementation inspected

- `src/catalog.ts` contains 24 fixtures; metadata and simulated availability implement separate domain contracts.
- `src/providers.ts` and `src/title-links.ts` own URL validation, launch evidence and verified fixture destinations. `src/discovery.ts` admits only offers with resolved exact-title URLs.
- `src/filter.ts` implements maturity/content/provider filtering. Preserve it during this evaluation.
- `.github/workflows/pages.yml` deploys the current app; it must not depend on data-source availability or spend ingestion requests.
- `src/preferences.ts` currently enables all six services by default, contrary to the user's desired four native providers on / Prime and Peacock off. Record this discrepancy for the later app integration; do not migrate saved preferences in the evaluation.
- Existing data-source documentation describes a future TMDB import. This design supersedes that proposed dependency; the implementation should update the data-source document accordingly.

## Approach

Add a standalone Node/TypeScript evaluation script and a manually dispatched Actions workflow. Keep upstream access entirely in CI. The generated evaluation is separate from the browser app and Pages deployment.

Alternative: query APIs during every browser search. Rejected for this trial because it exposes credentials without a backend and consumes requests per user. Alternative: immediately import 1,000 titles and replace the fixture. Deferred until metadata coverage, identifier matching and request costs are measured.

### Discovery and availability

1. Query Movie of the Night catalog search with country `us`, English output, show-level series granularity and explicit subscription catalogs for the six providers.
2. Sample movies and series across providers using bounded pagination and a deterministic deduplication/selection rule. Retain horror and adult titles for filter evaluation; do not prefilter by household preferences. Aim for 50 movies and 50 series; report actual counts if fewer are obtainable within the request cap.
3. Retain only US subscription offers on the six services. Exclude rentals, purchases, free-only offers and channel/add-on offers. The returned availability may include other providers even when discovery was scoped; discard those offers.
4. Store stable source IDs, IMDb IDs where supplied, media type, provider identity, source, checked timestamp and source-supplied title URL. Deduplicate by media type and stable source ID; merge legitimate multiple-provider offers.
5. Missing/invalid identifiers, URLs and unavailable provider offers are explicit report categories rather than invented values. Do not scrape title pages to repair them.

### TheTVDB enrichment

Authenticate with the project key, resolve through an available external ID (prefer IMDb), and fetch the matching movie/series metadata. Accept a match only when identifier and media type establish the correct entity. Report ambiguous/unmatched entities; do not silently choose the first title-search result.

Retain names, year, overview, genres, source IDs and US content ratings where returned. Select US ratings, keeping all relevant source labels when multiple certifications exist. Distinguish missing US certification, explicitly unrated and an unrecognized rating label. Neither missing ratings nor an audience score implies family safety.

Use TheTVDB as the source of descriptions and maturity metadata for this evaluation. No artwork URLs are downloaded or rendered. Movie of the Night's audience `rating` must never become an age restriction.

### Normalized evaluation format

Use an importer-owned versioned schema with title records, separate offer records and provenance per sourced field. Fields may be null when unavailable; do not force missing source values into the existing UI's required strings/numbers during this trial. Include generation time, region, source IDs and request accounting.

Titles and offers remain separate from launch policies. Upstream links are candidate destinations, not evidence of native handoff. Analyze them against the existing provider allowlists and report accepted/rejected path shapes. Do not widen those allowlists automatically or replace fixture links. New links retain a physical-device-verification requirement regardless of provider-level user reports.

### Content limitations

Report Horror genre coverage, unknown seasonal/scary/violence/language/sexual classifications and rating conflicts. Lack of a tag means unknown, not confirmed safe. No AI or large manual classification effort is included. Original neutral artwork can be classified as safe artwork without making a safety claim about the underlying title.

Explicit-search preference bypass, ranked local search, pagination and larger-catalog UI integration belong to the later catalog milestone. This evaluation must not change today's filter behavior. The later design must address the user's requirement that deliberate searches return content-hidden matches with a preference warning; maturity restrictions remain an unresolved parental-model question.

## Workflow, security and request budget

- Manual dispatch only; no recurring refresh or ingestion on Pages builds in this trial.
- Use the two repository secrets as job environment variables, never Vite/browser variables. Do not print headers, tokens, auth response bodies or secret-bearing URLs.
- Missing secrets fail before upstream calls. Failed auth and quota exhaustion fail with sanitized messages. Bounded retries obey the same caps; no retries for invalid credentials or exhausted quota.
- Proposed hard caps per evaluation: 25 Movie of the Night requests and 260 TheTVDB requests, including auth, enrichment and retries. These are protective limits, not measured costs or guarantees of reaching 100 titles.
- Do not use an SDK's unbounded auto-pagination. Count each page request and stop at the cap or selected-title target. Record partial completion explicitly.
- Keep existing Pages workflow independent. A failed evaluation must leave the live app and fixture intact.

## Outputs and rights boundary

Produce an aggregate report covering source/auth status, selected movie/series count, provider coverage, multiple-provider titles, deduplications, matched identifiers, missing fields, rating labels/conflicts, invalid links, actual request totals and estimated refresh frequency supported by the monthly free allowance.

Keep source metadata, descriptions, offers and generated evaluation snapshots out of the public repository, Pages output and public workflow artifacts until project-specific distribution terms are resolved. For the initial CI run, publish only sanitized aggregate counts and engineering findings; do not upload raw API responses or a title database as an Actions artifact. A local evaluation may write ignored generated files for private inspection.

Movie of the Night documents local database creation and search-engine use, which support the technical design. Its competing-product/data-distribution restrictions still require reconciliation with this public static app. TheTVDB documents local caching but grants API access for the registered product and restricts data distribution. API registration does not grant poster display rights. Confirm the applicable project terms before the later public catalog release; this trial does not claim those questions solved.

## Verification and acceptance

Importer tests use small synthetic fixtures and mocked requests, never secrets or copied source datasets. Cover US subscription selection, out-of-scope providers, rentals/add-ons, deduplication/multi-provider availability, ambiguous identifiers, media type mismatch, missing and unrecognized certifications, movie versus TV labels, malformed URLs, pagination termination, request caps, sanitized errors and absence of third-party poster output.

Run existing tests and production build. Verify the trial makes no change to working launch URLs, UI, preference persistence, Pages configuration or fixture admission. Inspect the first real aggregate report before deciding whether to expand or integrate. No physical-device launch success is claimed from API responses.

Success is a truthful report for up to 100 titles, with request totals and metadata gaps sufficient to decide on the larger ingestion milestone. If authentication, quota or coverage prevents completion, report exactly that and leave production unaffected.

## Primary references

- [TheTVDB pricing and attribution](https://www.thetvdb.com/api-information)
- [TheTVDB project/API terms and artwork exclusion](https://www.thetvdb.com/tos)
- [TheTVDB v4 schema and caching/update guidance](https://github.com/thetvdb/v4-api)
- [Movie of the Night local catalog and discovery guide](https://docs.movieofthenight.com/guide/shows)
- [Movie of the Night subscription filtering and pagination](https://docs.movieofthenight.com/resource/shows)
- [Movie of the Night free-plan limits](https://www.movieofthenight.com/about/api/pricing)
- [Movie of the Night current developer terms](https://developers.movieofthenight.com/terms-and-conditions)

Reviewed against the repository and conversation on 2026-10-06. No real API calls have been made with the user's keys.
