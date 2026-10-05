# Data sources and future ingestion

## What ships today

`src/catalog.ts` is a hand-authored 24-entry fixture, with checked destinations across the fixed Big 6. Real title names/year/rating labels are representative sample facts entered manually and are not independently audited. Summaries are original short descriptions. Duration and rating labels are prototype metadata. US providers are simulated offers for UX testing and may not reflect actual current subscription availability. Content and art flags are illustrative annotations, not a comprehensive review of a film or its real advertisements.

The Mandalorian and The Boys include hypothetical disturbing-promotional-art flags specifically to prove that allowed titles can retain a neutral cover. Wednesday and other examples demonstrate content filtering. All rendered SVG scenes are original and deliberately non-graphic; no official promotional image is fetched. The app does not claim TMDB/JustWatch attribution because it does not use their data yet.

## Eventual architecture

1. **Metadata adapter:** Resolve a stable TMDB movie/TV ID with media type, titles, localized descriptions, genres, release dates, and region-specific certifications. Retain source IDs and provenance separately from Viewport's internal ID. Do not infer a horror exclusion solely from a rating.
2. **Availability adapter:** Obtain country-specific offers, distinguishing included subscription, free, ad-supported, rent, buy, channels/add-ons, and plan-specific entitlement. Selecting Prime Video must not silently include every rentable movie. Preserve provider/content IDs, source, region, last checked time, expiry policy, and confidence.
3. **Content annotation source:** Separate licensing-reviewed human/editorial content data from TMDB genres. Horror/scary themes, violence, sexuality, language, and holidays need source and review status. No AI classification is included in this milestone. Unknown classifications require a household-visible policy.
4. **Artwork review source:** Review each actual poster/backdrop/promotional asset, with asset hash/ID, source rights, region/locale, risk tags, and review date. A safe title can still have unsafe art. Do not fetch an excluded remote asset into the browser before masking it. Render a neutral local fallback for unreviewed assets when required.
5. **Launch adapter:** Resolve an offer into a platform-specific, provider-approved or physically verified title URL. Keep `provider-homepage`, `provider-title-page`, `native-title-detail`, and `native-playback` as distinct capability levels. Never promote a web success to native confidence. Record per-platform verification and its date/app version.

For an inexpensive next data milestone, use a deliberate, noncommercial TMDB import to generate an attributed static snapshot during a controlled build, with the API token in CI secrets rather than browser code. Review terms before storing/reusing any data or art. If public snapshot redistribution is not allowed by the applicable agreement, use a licensed access mechanism instead. No API calls or secret fields are in the current client bundle.

The eventual server, if needed, can protect tokens and refresh/cache normalized records. It is outside this prototype. Static client preferences can continue to filter the normalized snapshot locally. Freshness/error states must distinguish unavailable data from no matching offers.

## Important API distinctions

TMDB's developer API is free for noncommercial use with attribution; its commercial classification depends on a project's purpose of generating revenue. A commercial launch requires discussing the applicable license. TMDB requires its approved logo and attribution notice when its API/data are used. Check the latest agreement before integration.

TMDB's watch-provider endpoint is powered by JustWatch and gives availability by country and transaction type. Its documentation explicitly distinguishes that from full content deep links. JustWatch attribution is required for those availability results. The provided TMDB watch page must not be treated as a verified native-title URI.

Commercial availability/deep-link vendors can be evaluated later against the actual physical-device matrix, regional coverage, mapping quality, refresh cadence, contractual reuse rights, and price. No paid evaluation or subscription is authorized for this prototype.

## Primary references (checked 2026-10-05 UTC)

- [TMDB API FAQ, licensing and attribution](https://developer.themoviedb.org/docs/faq)
- [TMDB movie watch providers, country data and JustWatch attribution](https://developer.themoviedb.org/reference/movie-watch-providers)
- [TMDB TV watch providers](https://developer.themoviedb.org/reference/tv-series-watch-providers)
- [Apple universal-link handling](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)

These references establish integration constraints, not validated support by any individual streaming app.

## Current milestone boundary

Big 6 launch architecture and physical-device results take priority over further catalog growth. No metadata import, API purchase, or backend begins in this task. Existing metadata and simulated availability remain separate from the checked launch registry. A later TMDB/availability integration must preserve that separation and the exact-title admission rule.
