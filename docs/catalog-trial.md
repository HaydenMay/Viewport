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
- Hard per-run caps: **25 availability requests** and **260 TheTVDB requests**, counting login, retries and the rating audit. These caps are not estimated billable credits, guaranteed title counts, or guarantees of fitting an account's remaining monthly quota.
- An upstream transient failure gets at most one retry. Authentication/quota failures are not retried. Repeated/missing cursors stop the affected pagination stream. HTTP calls time out after 20 seconds; the Actions job has a 15-minute limit.
- A `budget` error means the local cap prevented another request; a `quota` error means the upstream service returned HTTP 429. The report shows actual attempted request counts and an illustrative number of equally sized trials within a fresh 1,000-request allowance. It is not an estimate for refreshing an entire production catalog.

## Metadata and matching

Movie of the Night supplies stable IDs, title/year/genre facts and current US offers. Its IMDb ID is matched through TheTVDB's remote-ID endpoint. Only an unambiguous movie/series entity whose extended record confirms that IMDb ID is enriched. Ambiguous, missing and conflicting identifiers are report categories, not guessed matches. Source IDs and per-field provenance remain in ephemeral normalized records.

TheTVDB supplies English descriptions and US certifications where present. Unknown fields remain null. The importer does not invent summaries, years or safety annotations. Ratings map to the existing app's age levels for analysis only; the app's filtering implementation is unchanged.

| Maturity state | Meaning |
| --- | --- |
| `rated` | One recognized US movie/TV certification appropriate to the media type |
| `missing` | A trusted TheTVDB record was assessed but had no populated US certification |
| `not-evaluated` | No trusted TheTVDB record was assessed (for example, matching failed or a response was invalid) |
| `unrated` | Explicit NR / Unrated / Not Rated label |
| `unrecognized` | Populated US label not understood by the current media-specific mapping |
| `conflict` | Multiple distinct US labels; no single age level selected |

US movie and TV labels are handled separately; audience enjoyment scores are never maturity ratings. Unrecognized labels are counted without printing arbitrary upstream strings. Horror genre is counted, but scary/seasonal/violence/sexual-content/language classifications remain unknown. Absence of those tags does not mean safe. Series-level certificates may not capture episode or season variation.

## Response failures and diagnostics

A malformed per-title TheTVDB response is counted as an error and leaves that title unenriched, but does not stop assessment of unrelated titles. The run still fails if any schema error occurred; it never reports the affected record as a successful match. Login, authentication, quota and request-budget safeguards remain unchanged.

The report includes only endpoint families (`remote-search`, `movie-extended`, `series-extended`), fixed error categories and data types (`null`, `array`, `object`, `undefined`, etc.). It does not print response bodies, arbitrary status messages, title identifiers, URLs or credentials. This is enough to distinguish a missing/null search envelope from invalid extended metadata without publishing source data.

The first live trial selected 100 titles in 12 availability calls, but assessment stopped after four trusted TheTVDB records because of one `invalid-response`. Its 99 missing-rating count included unassessed records and must not be interpreted as source rating coverage. The revised report separates these states. The second live run assessed 93 trusted records and identified seven HTTP-success remote searches with `data: null`. Such null results are now counted as `unresolved`, with no metadata or rating invented. They produce a `partial` evaluation rather than a schema failure; they do not prove those titles are absent from TheTVDB. Explicit failure/unknown status envelopes and missing or wrongly typed data still fail validation. No title-name guessing or extra API calls were added. Of the 93 assessed records, 68 lacked a populated US certification, 22 had recognized ratings, two had unrecognized ratings and one was explicitly unrated. Only 92/100 had descriptions. This sample does not support relying on TheTVDB alone for complete maturity coverage.

## Maturity source audit

The report now breaks rating states down by movie versus series, records whether `contentRatings` was absent, null, empty, populated or wrongly typed, and counts rating-entry categories. These distinguish foreign-only ratings, missing country identifiers and US labels that belong to the other media type. No arbitrary upstream labels, country names, title names, URLs or raw responses are printed. US country-code whitespace is normalized; foreign certifications are never treated as US equivalents.

For up to **three movies and three series** with missing or unrecognized ratings, the same extended record is fetched with `short=false` and its ID/IMDb association checked again. This adds at most six requests before retries and uses the existing 260-request cap. `improved` means a full response has a recognized US rating where the shortened response did not. `unchanged` means it still has no recognized rating, even if its exact unknown state changed. Failed checks are reported separately and do not overwrite a trusted initial match. These checks are a small targeted investigation, not a representative coverage study; they do not change catalog ratings or the live app.

The [official API specification](https://github.com/thetvdb/v4-api/blob/main/docs/swagger.yml) documents `contentRatings` as an array with string `country` and `name` fields. Its shortened movie response omits characters, artwork and trailers; its shortened series response omits characters and artwork. Ratings are not documented as omitted. The [official movie scraper](https://github.com/thetvdb/metadata.movies.thetvdb.com.v4.python/blob/main/metadata.movies.thetvdb.com.v4.python/resources/lib/movies.py) also selects US ratings using country code `usa`, which the importer already supported. These are reasons to suspect source coverage, not proof about the current live payload.

Interpret the next run before adding another source:

- Empty or foreign-only rating arrays, with no improvement in full responses: evidence of a source coverage gap in this sample.
- Missing country fields or invalid types: investigate schema/reference-ID resolution before changing the maturity policy.
- Recognized ratings recovered in full responses: investigate short-response behavior and change the ingestion request deliberately.
- US labels from the other media type: keep the current conservative classification until the policy is decided. Do not equate TV and movie ratings silently.

## Launching, artwork and distribution

Source title URLs are analyzed against the current centralized provider URL rules. Accepted means a candidate has the expected provider origin and title path, **not** that the native app opens it or that the user is entitled to watch. Rejected destinations are counted without widening rules. This initial report does not yet break down rejection reasons by provider/path family. All new candidate destinations require physical-device verification. Existing fixture URLs and navigation remain untouched.

No posters/backdrops are downloaded or rendered. Keep Viewport's original neutral artwork. Neither API registration nor receipt of an image URL grants third-party artwork rights.

Only aggregate diagnostics appear in public Actions logs and summaries. No source catalog artifact is uploaded, committed, or placed in `public/`/`dist/`. The later public static catalog needs the relevant project-specific caching/distribution permission, including reconciliation of Movie of the Night's competing-product/data-distribution restrictions. Their guide supports local databases and movie search engines technically; it does not replace the governing terms. TheTVDB's local-cache guidance also does not waive its project/API conditions.

## Decision after the trial

Check rating and description completeness, matched-ID percentage, Big 6 coverage, rejected URL shapes and actual request usage. A technically completed run is not proof of sufficient data quality. Decide whether to expand to 300–1,000 titles only after reviewing those results and resolving public catalog rights.

The later app milestone must separately address ranked local search, content-hidden explicit-search matches with a preference warning, pagination/performance and unknown content policies. Hard parental maturity restrictions remain a product question. Prime/Peacock are now off by default for new households; saved selections are preserved. See [catalog expansion](catalog-expansion.md) for the new maturity/search policy and 300-title preview. No saved household preference migration happens in this trial.

## Wikidata movie-rating evaluation

Every manual trial now also checks movie IMDb IDs against [Wikidata P345](https://www.wikidata.org/wiki/Property:P345), then reads [US MPA movie ratings, P1657](https://www.wikidata.org/wiki/Property:P1657). Wikidata's structured data is [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing), permitting commercial reuse and storage without an API subscription. This does not grant rights to posters or text on linked websites. No new API key is needed.

This is a bounded server-side evaluation, not a browser/runtime dependency: batches of 25 unique IMDb IDs, normally two queries for 50 movies, with a hard maximum of four queries for 100 movies. Calls are sequential, time out after 20 seconds, never retry, and stop on an endpoint error. The public query service has no availability guarantee; throttling or malformed responses are reported in the Wikidata section without discarding the separate TheTVDB results. No Wikidata title database or raw responses are published.

Only unambiguous exact IMDb matches with a single recognized, non-deprecated MPA rating become candidates. G, PG, PG-13, R and NC-17 are mapped by verified Wikidata entity identifiers, not arbitrary labels. Certificate-number qualifiers ([P2676](https://www.wikidata.org/wiki/Property:P2676)) are allowed; every other qualifier requires review because it can restrict applicability to a version or date. Multiple items, conflicting ratings, unknown values and missing ratings stay unresolved. Preferred statements do not silently override conflicting non-deprecated statements.

The summary reports potential fills of missing ratings, agreements/disagreements with existing recognized TheTVDB ratings, and whether candidates have reference statements. A reference's presence does **not** establish an authoritative source or accuracy. Existing unrated, unrecognized and conflicting ratings are not counted as fills; nothing replaces current ratings. Wikidata is community-maintained, so candidates need a provenance/quality policy before affecting parental restrictions.

**TV series are not tested:** no suitable US TV rating property has been verified for this integration. Movie ratings must not stand in for TV ratings. The trial therefore measures whether Wikidata can supplement movie coverage, not whether it solves all maturity gaps.

Run the existing manual workflow on `main` once and read the new **Wikidata movie-rating trial** section. `complete` means the queries completed, not that every movie has a rating. This evaluation makes no changes to the app, artwork, provider defaults or verified launch URLs.
