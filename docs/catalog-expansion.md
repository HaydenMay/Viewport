# Catalog expansion and maturity policy

## What is implemented

A selected maturity limit (including All rated titles) excludes missing, explicitly unrated, unrecognized and conflicting ratings. No maturity limit allows them, labeled Rating unavailable. The legacy allowUnrated preference remains readable but cannot bypass a limit. Existing saved service choices are preserved; new households default to Netflix, Disney+, Hulu and Paramount+, with Prime/Peacock off.

Explicit search retains service and maturity restrictions but can reveal titles hidden by horror, scary, seasonal or other content preferences. Those cards and details explain that they are normally hidden. Search is case/diacritic insensitive, accepts partial matches and ranks exact title, title prefix, title substring in that order. A one-character query matches title prefixes only; queries of two or more characters also match substrings. Search matches title names only; genres and descriptions do not create matches. Home keeps passive filters. Only 60 cards initially render; Show more adds another batch. Search still examines the entire loaded dataset.

## Repeatable ingestion preview

Run [Preview 300-title catalog](https://github.com/HaydenMay/Viewport/actions/workflows/catalog-preview.yml) manually on main. This uses the existing repository secrets and pipeline; it does not require new credentials or a paid plan. Alternatively supply keys privately to the environment and run npm run catalog:preview locally. No automatic API calls occur during browsing or Pages deployment.

The preview targets 150 movies and 150 series, deduplicates records, includes only US base subscriptions across the Big 6, and paginates within fixed caps: 75 availability calls and 700 TheTVDB calls, including authentication/retries. The original trial retains its 25/260 caps and 100-title target. These are attempted-call caps, not an assurance about remaining monthly quota. Wikidata queries batch 25 movie IMDb IDs, normally six queries for 150 movies and at most twelve if all 300 are movies. No Wikidata retry occurs.

The pipeline generates an app-ready snapshot **in memory**. Its summary includes normalized title count, link-admitted title count, known/unknown rating count and discovery counts at PG/teen/no-limit settings. The preview publishes aggregate diagnostics only: no source database, URLs, source text or artwork in logs/artifacts/git. Authentication/schema/quota failures prevent publication; unresolved matches are partial and retain unknown metadata.

## Snapshot and launch boundaries

The reusable buildSnapshot function creates versioned titles, offers and title-link mappings separately. It preserves IMDb/TheTVDB IDs, rating state/source, Wikidata item ID where used and check time. Wikidata fills only genuinely missing movie ratings. A disagreement between recognized ratings becomes conflict/unknown; an explicit unrated or unrecognized rating is not silently replaced. No movie rating is applied to TV. Records without names are excluded; missing years/descriptions/runtime remain clearly unavailable.

Availability is retained even without a title URL; discovery only admits providers with a URL accepted by the centralized launch resolver. New API destinations carry availability-api evidence and webExact expectations, with device verification required. Existing checked links keep their exact URLs, navigation and provider-level native expectations. The API does not automatically confer native verification. Original abstract SVG covers are generated for imported records even when artwork replacement is switched off. Genre selects a palette/pattern and a stable title ID selects consistent variations. Missing genres use a general pattern. No scenes are inferred and no third-party images are fetched.

An authorized build can later supply src/generated/catalog.json using this snapshot contract. Vite bundles it at build time; without that file the existing fixture loads. That directory is gitignored to prevent accidental source-data publication. There is deliberately no source-data export or public import workflow yet. Local storage contains preferences only; the snapshot would be cached with the app's static assets, not fetched from upstream at runtime.

## Publication blocker

TheTVDB's API terms restrict distribution of Data, and the current Movie of the Night developer terms forbid competing services and standalone data distribution while permitting end-user display and local caching. We need project-specific clarification that Viewport's consumer discovery functionality and a browser-readable static snapshot served by GitHub Pages are allowed. A registered key and a free tier do not settle this distribution question. Do not commit source records into the public repo as a shortcut.

Relevant primary sources: [TheTVDB terms, API restrictions](https://www.thetvdb.com/tos) and [Movie of the Night developer terms, sections 3 and 6](https://developers.movieofthenight.com/terms-and-conditions). The latter is client-rendered; its current terms differ from the older GitHub TERMS.md. No posters or backdrops are authorized by these API terms alone.

Ask each provider to confirm: Viewport is a commercial consumer streaming-discovery app; it periodically caches normalized metadata/US availability for roughly 300–1,000 titles, serves it with its GitHub Pages frontend for end-user browsing/filtering, provides required attribution, exposes no third-party API or downloadable catalog product, and uses original neutral covers. Request confirmation of permission, refresh/retention requirements and any limitations.

## Known coverage limits

The real 100-title sample had 22 recognized TheTVDB ratings, 68 missing US ratings, seven unresolved matches, two unrecognized and one explicitly unrated. Wikidata found ten movie ratings, including seven potential fills and no disagreements, raising potential combined coverage to 29/100. Full TheTVDB responses improved none of six targeted checks. TV coverage remains a gap. Source references are not guarantees of accuracy.

Genres are available, but only Horror genre is automatically flagged. Scary themes, seasonal content, violence, sexual content and language are unknown for imported titles; empty tags do not imply safety. Details disclose genre-only coverage. Hard parental controls/PIN protection remain out of scope. The live site still uses 24 fixtures until distribution permission and a publishable snapshot are available.

## Representative sampling

Private preview refreshes target 600 records, balanced between movies and series and interleaved across the Big 6. Every provider/media pair has independent paginated popularity_alltime, rating, and release_date queries, all descending, with English-original and US included-subscription constraints. Provider documentation specifies alphabetical original_title as the default; relying on it caused the previous sample to stop at A. Independent cursors prevent mixing query streams. Duplicate IDs merge before selection. This is a varied bounded sample, not a complete catalog or guaranteed equal A–Z coverage; imported popularity never controls household filtering. Aggregate refresh reports include title-initial counts to expose sampling bias. Caps: 120 availability requests and 1,300 TheTVDB requests, including retries/authentication. No user-time live API requests.

Query contract: https://github.com/movieofthenight/streaming-availability-api/blob/main/openapi.yaml
