# Catalog trial: operation and interpretation

The 100-title trial evaluates Movie of the Night US subscription availability and TheTVDB metadata/maturity ratings. It does **not** replace the live 24-title fixture, change filtering, or change any provider launch URL. It is an ingestion evaluation, not a runtime API integration.

## Run on GitHub

1. Add project API keys as repository Actions secrets named `TVDB_API_KEY` and `STREAMING_AVAILABILITY_API_KEY`.
2. The availability key must come from the direct [Movie of the Night developer portal](https://developers.movieofthenight.com/), not RapidAPI. TheTVDB uses a registered project API key; a subscriber PIN is not used.
3. Open [Evaluate 100-title catalog](https://github.com/HaydenMay/Viewport/actions/workflows/catalog-trial.yml), choose **Run workflow**, select `main`, and run once.
4. Open the run summary after completion. The report contains aggregate counts only. Authentication/schema/quota failures fail the job with sanitized error categories; incomplete sampling is explicitly `partial`.

If GitHub Actions is unavailable, wait for it to recover rather than repeatedly triggering runs. Every manual run consumes requests. There is no scheduled import or ingestion on Pages deploys.

## Local operation

Use Node 22.18+ and `npm ci`. Supply both keys privately through the process environment, then run `npm run catalog:trial`. Never commit a key, use a `VITE_` secret, put credentials in a command-line argument, or send a token in a URL.

The command reads environment variables; it does not automatically read `.env`. Missing keys fail before any upstream request. It prints an aggregate Markdown report and also writes that report to `GITHUB_STEP_SUMMARY` when running in Actions. No title database, raw responses or third-party images are saved by default. `catalog-trial-output/` is ignored for any later private local experiments.

## Sampling and budgets

- Target: 100 deduplicated titles, ideally 50 movies and 50 series. Sample each of the Big 6 before choosing titles, then use bounded pagination if needed. Exhausted catalogs can produce a smaller or differently balanced sample.
- Region/language: US availability and English metadata. Offer coverage is distinct from launch capability.
- Include base subscription offers only. Exclude rent, buy, free-only and channel/add-on offers; Prime's rental catalog and Hulu/Prime channel subscriptions do not become base subscription availability.
- Hard per-run caps: **25 availability requests** and **260 TheTVDB requests**, counting login and retries. These caps are not estimated billable credits, guaranteed title counts, or guarantees of fitting an account's remaining monthly quota.
- An upstream transient failure gets at most one retry. Authentication/quota failures are not retried. Repeated/missing cursors stop the affected pagination stream. HTTP calls time out after 20 seconds; the Actions job has a 15-minute limit.
- A `budget` error means the local cap prevented another request; a `quota` error means the upstream service returned HTTP 429. The report shows actual attempted request counts and an illustrative number of equally sized trials within a fresh 1,000-request allowance. It is not an estimate for refreshing an entire production catalog.

## Metadata and matching

Movie of the Night supplies stable IDs, title/year/genre facts and current US offers. Its IMDb ID is matched through TheTVDB's remote-ID endpoint. Only an unambiguous movie/series entity whose extended record confirms that IMDb ID is enriched. Ambiguous, missing and conflicting identifiers are report categories, not guessed matches. Source IDs and per-field provenance remain in ephemeral normalized records.

TheTVDB supplies English descriptions and US certifications where present. Unknown fields remain null. The importer does not invent summaries, years or safety annotations. Ratings map to the existing app's age levels for analysis only; the app's filtering implementation is unchanged.

| Maturity state | Meaning |
| --- | --- |
| `rated` | One recognized US movie/TV certification appropriate to the media type |
| `missing` | No populated US certification |
| `unrated` | Explicit NR / Unrated / Not Rated label |
| `unrecognized` | Populated US label not understood by the current media-specific mapping |
| `conflict` | Multiple distinct US labels; no single age level selected |

US movie and TV labels are handled separately; audience enjoyment scores are never maturity ratings. Unrecognized labels are counted without printing arbitrary upstream strings. Horror genre is counted, but scary/seasonal/violence/sexual-content/language classifications remain unknown. Absence of those tags does not mean safe. Series-level certificates may not capture episode or season variation.

## Launching, artwork and distribution

Source title URLs are analyzed against the current centralized provider URL rules. Accepted means a candidate has the expected provider origin and title path, **not** that the native app opens it or that the user is entitled to watch. Rejected destinations are counted without widening rules. This initial report does not yet break down rejection reasons by provider/path family. All new candidate destinations require physical-device verification. Existing fixture URLs and navigation remain untouched.

No posters/backdrops are downloaded or rendered. Keep Viewport's original neutral artwork. Neither API registration nor receipt of an image URL grants third-party artwork rights.

Only aggregate diagnostics appear in public Actions logs and summaries. No source catalog artifact is uploaded, committed, or placed in `public/`/`dist/`. The later public static catalog needs the relevant project-specific caching/distribution permission, including reconciliation of Movie of the Night's competing-product/data-distribution restrictions. Their guide supports local databases and movie search engines technically; it does not replace the governing terms. TheTVDB's local-cache guidance also does not waive its project/API conditions.

## Decision after the trial

Check rating and description completeness, matched-ID percentage, Big 6 coverage, rejected URL shapes and actual request usage. A technically completed run is not proof of sufficient data quality. Decide whether to expand to 300–1,000 titles only after reviewing those results and resolving public catalog rights.

The later app milestone must separately address ranked local search, content-hidden explicit-search matches with a preference warning, pagination/performance and unknown content policies. Hard parental maturity restrictions remain a product question. Prime/Peacock must be off by default in that integration; the current checked-in preference defaults still require that correction. No saved household preference migration happens in this trial.
