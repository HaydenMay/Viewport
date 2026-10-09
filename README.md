# Viewport

A unified streaming discovery prototype: choose your subscriptions, browse one catalog, and control what surfaces in your household. Viewport is a working name and is not a kids-only app.

**Live:** [Open Viewport](https://haydenmay.github.io/Viewport/) · [Public repository](https://github.com/HaydenMay/Viewport)

## Milestone 1.7: Big 6 integration and handoff probes

V1 supports exactly **Netflix, Disney+, Hulu, Prime Video, Paramount+, and Peacock**. Max is retired from V1. The existing discovery UI, filters, and working Netflix/Disney+/Hulu URLs are preserved. Select Paramount+ and Peacock in Preferences; saved households retain their other service choices and retired Max selections are discarded.

The user confirms native exact-title opening for Netflix, Disney+, Hulu, and Paramount+ on iOS. Prime and Peacock open the correct web title without native handoff, confirmed by the user after testing 1.6. Native status is never inferred from a public page or an open callback. See the [compatibility matrix](docs/provider-compatibility.md).

Provider routing and support evidence live in one integration registry. Plans distinguish `nativeExact`, `webExact`, `providerHome`, and `unsupported`, with explicit safe fallbacks. Direct HTTPS title links allow the OS/provider to choose native app or website without risky undocumented custom schemes. Prime uses the same checked title URL with a direct same-tab action; the user retested it and still gets the website. Native improvement is not established. Netflix, Disney+, and Hulu retain their existing new-tab behavior.

**Every visible title must have a checked exact title destination on a selected service.** Home, search, featured content, provider scopes, and Watch actions all apply that rule. Provider-home/unsupported plans remain available to diagnostics and future adapters, but never become exact-title Watch buttons.

## Try it

Choose services in **Preferences**, search across them, or scope browsing to one provider. **Hide Horror**, **Hide Halloween / seasonal**, and maturity controls apply immediately. Additional preferences hide violence, sexual content, and strong language. Neutral artwork can replace an image while retaining an acceptable title. Preferences persist on this browser only and do not change provider recommendations after you leave Viewport.

There are 24 linked fixtures: the 17 existing Big 6 examples plus five Paramount+ and two Peacock test entries. Broad catalog expansion is paused. Names, years, durations, and ratings are manually entered prototype metadata. Summaries and SVG scenes are original. **Subscription availability, content annotations, and promotional-art flags are illustrative, not current availability guarantees or comprehensive content guidance.** No service is scraped and no official posters or API keys are used.

## Link diagnostics and device testing

Open the deployed site with **`?debug=links`**, then open title details and expand **Link diagnostics**. It shows provider/title, exact launch URL, provider content ID, expected iOS capability, web fallback, evidence, navigation policy, and remaining device verification. TMDB IDs are explicitly not imported. Add `&platform=web` to inspect the web expectation. Normal browsing never exposes these fields; no diagnostic data is transmitted or stored.

On iPhone/iPad Safari, enable Paramount+, Peacock, and Prime in Preferences. Test **SpongeBob SquarePants**, **Despicable Me 2**, and **The Marvelous Mrs. Maisel**. Report app versus browser and exact title versus Home, plus OS/provider app versions if available. A second series/movie check can use Mutant Mayhem and Parks and Recreation. See [the short checklist and research](docs/provider-launch-research.md).

## Develop and deploy

Use Node **22.18+** (or Node 24).

```sh
npm ci
npm run dev
npm run verify   # behavior tests, strict TypeScript, Vite production build
npm run preview
npm run artwork  # regenerate original SVG exports from preserved source
```

The optional `scripts/browser-qa.mjs` verifies the production build at the `/Viewport/` repository subpath with Playwright/Chromium. An external module can be supplied via `VIEWPORT_PLAYWRIGHT_MODULE`; Playwright is not a product dependency.

Relative assets and native dialogs work on GitHub Pages without a client router. [.github/workflows/pages.yml](.github/workflows/pages.yml) validates and deploys pushes to `main`; Pages uses GitHub Actions as its source. Local and deployed evidence are in [verification](docs/verification.md).

## Decisions and boundaries

- [Architecture](docs/architecture.md)
- [Provider compatibility](docs/provider-compatibility.md)
- [Launch research and physical-device checklist](docs/provider-launch-research.md)
- [Title URL evidence](docs/title-link-evidence.md)
- [Data provenance and catalog sources](docs/data-sources.md)
- [100-title catalog trial](docs/catalog-trial.md)
- [Catalog admission rules](docs/catalog-curation.md)
- [Deferred native validation](docs/deep-link-validation.md)

No accounts, payments, production backend, AI classification, commercial API subscriptions, or native tvOS development are included. Do not begin another major feature until the current device results are returned. No open-source license has been selected; third-party tools retain their licenses. Reusable source and original artwork exports are preserved.

## Catalog evaluation

A separate **Evaluate 100-title catalog** manual Actions workflow samples US Big 6 included-subscription titles using Movie of the Night and enriches metadata/maturity ratings using TheTVDB. It uses repository secrets, bounded requests and an aggregate-only report. It does not change the live 24-title catalog or provider launches, and ordinary browsing/deployment makes no third-party API calls. See [operation and limitations](docs/catalog-trial.md). TMDB is not the proposed long-term dependency. The completed real trial found substantial maturity gaps; Wikidata can supplement seven missing movie ratings in that sample. Posters and public catalog distribution rights remain separate questions.

## Focused iOS handoff probe — 1.7

Every normal Watch URL and navigation policy remains unchanged. `?debug=links` adds a Peacock **Try app link** action using the same title’s official `/watch/asset/…` destination, which matches its published iOS association. This is an unverified native candidate with the existing web link kept available. Prime’s current path already appears in its association; an alternate host led to an install page and was rejected. See [research and the short retest](docs/native-handoff-probe.md).

## Catalog expansion preparation

Maturity limits now exclude unknown ratings, while No maturity limit allows them. Explicit search may show content-hidden titles with a warning but respects maturity and service restrictions. New household defaults keep Prime and Peacock off; saved selections are preserved.

The manual **Preview 300-title catalog** workflow reuses the ingestion pipeline and builds an app-ready snapshot in memory. It publishes counts only. No larger live catalog is shipped until source distribution terms are clarified. See [pipeline, refresh instructions and limitations](docs/catalog-expansion.md).

## Discovery feedback

Results now explain why titles are hidden, and maturity-blocked searches have a distinct empty state from no matches. Imported availability check dates are preserved; older checks carry a freshness notice. See [validation and the short iPhone checklist](docs/discovery-validation.md).

## Local API catalog testing

`npm run catalog:local` generates an ignored, private snapshot targeting 300 titles; `npm run dev:catalog` loads it on loopback only. Public catalog approval defaults to false, and normal builds exclude local data. Existing Pages defaults, provider links and maturity behavior remain unchanged. See [local setup, refresh and publication controls](docs/local-catalog-preview.md).
