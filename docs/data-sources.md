# Data sources and future ingestion

## What ships today

`src/catalog.ts` is a hand-authored 24-entry fixture, with checked destinations across the fixed Big 6. Real title names/year/rating labels are representative sample facts entered manually and are not independently audited. Summaries are original short descriptions. Duration and rating labels are prototype metadata. US providers are simulated offers for UX testing and may not reflect actual current subscription availability. Content and art flags are illustrative annotations, not a comprehensive review of a film or its real advertisements.

The Mandalorian and The Boys include hypothetical disturbing-promotional-art flags specifically to prove that allowed titles can retain a neutral cover. Wednesday and other examples demonstrate content filtering. All rendered SVG scenes are original and deliberately non-graphic; no official promotional image is fetched. The app does not claim TMDB/JustWatch attribution because it does not use their data yet.

## Approved next data architecture

The metadata candidate is **TheTVDB**, with **Movie of the Night** providing US availability across the fixed Big 6. TMDB is not a long-term catalog dependency. No TMDB API requests are made, and an external IMDb/TMDB identifier returned by another source is not an integration with those APIs.

The first step is the separate [100-title trial](catalog-trial.md): manual CI-only ingestion, ephemeral normalized title/offer records, bounded requests and aggregate diagnostics. Secrets remain in GitHub Actions. No title database or poster is published in this trial. Catalog metadata, availability and provider launching remain independent.

After successful evaluation and project-specific distribution clearance, the proposed pipeline is periodic upstream updates → normalization with source IDs/provenance → versioned Viewport catalog → local browsing/search/filtering. The browser would read our snapshot without making live upstream requests. A paid API or production backend is not required merely to evaluate this approach; continued free operation depends on applicable tiers, quotas and permissions.

## Maturity and content

TheTVDB US movie/TV certifications are metadata, not guarantees of complete family guidance. The trial reports missing, explicitly unrated, unrecognized and conflicting ratings separately, and treats review scores as unrelated to maturity. It measures missing English descriptions and external-ID matching failures. Movie of the Night supplies region-specific included-subscription offers; rentals, purchases and channels/add-ons must remain distinct.

Horror genre can support a limited genre flag. Scary themes, seasonal content, violence, sexuality and language require an additional reviewed source or explicit unknown policy. Absence of metadata is not evidence of safety. No AI classification is authorized. The existing hand-authored content flags remain fixture-only until the larger catalog design addresses these gaps.

## Artwork and reuse rights

Use the original neutral SVG artwork while evaluating data. TheTVDB's API license expressly excludes image-display rights. Movie of the Night's image URLs likewise do not by themselves establish third-party artwork permission. Displaying or caching posters requires the relevant rights.

TheTVDB publishes a free commercial tier below $50,000 annual company/parent-company revenue with attribution. Its access is product-specific and its API conditions still apply. Movie of the Night's direct free tier currently includes 1,000 requests/month and commercial use. Local database/discovery workflows are documented, but the competing-product and data-distribution clauses must be resolved for the eventual public static catalog. No public source dump, automatic ingestion schedule or paid subscription is included in this evaluation.

## Refresh, storage and attribution

Run the manual trial through Actions or privately supplied process environment variables. There is no auto-refresh of the live app yet. The trial prints aggregate counts only; raw responses, source descriptions, offers and generated snapshots stay out of public git, Pages and Actions artifacts. Current browser storage contains household preferences only. The Pages build is independent of API keys and availability.

A future approved snapshot should keep each title's source IDs, field provenance, region/access, availability check time and expiry/freshness separately from provider/platform launch evidence. Incremental changes can reduce refresh costs; a stale or failed import must not overwrite a last known good catalog. Appropriate source attribution must accompany released metadata, rather than being assumed satisfied by developer documentation.

## Primary references (checked 2026-10-06 UTC)

- [TheTVDB API pricing and attribution](https://www.thetvdb.com/api-information)
- [TheTVDB project/API terms and image rights](https://www.thetvdb.com/tos)
- [TheTVDB v4 schema and caching/update guidance](https://github.com/thetvdb/v4-api)
- [Movie of the Night local catalog/discovery guide](https://docs.movieofthenight.com/guide/shows)
- [Subscription catalogs and pagination](https://docs.movieofthenight.com/resource/shows)
- [Movie of the Night pricing](https://www.movieofthenight.com/about/api/pricing)
- [Movie of the Night developer terms](https://developers.movieofthenight.com/terms-and-conditions)

These establish integration constraints and documented fields, not measured data completeness or native provider handoff.
