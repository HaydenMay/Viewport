# Architecture and product decisions

Vite, strict TypeScript, native DOM/CSS, and native dialogs keep the prototype lightweight and compatible with GitHub Pages. No framework, router, backend, or state library was added for the launch integration. Existing streaming-style layout and household controls are retained.

## Boundaries

| Source | Responsibility |
| --- | --- |
| `domain.ts` | Title, preference, offer, launch capability/platform, and adapter contracts |
| `catalog.ts` | Prototype metadata and simulated subscription availability, independently of launch paths |
| `title-links.ts` | Checked official title destinations and their source/date |
| `providers.ts` | The fixed Big 6 registry, URL validation/ID extraction, platform evidence, navigation, and fallback policy |
| `discovery.ts` | Joins independent catalog/availability/launch adapters to admit only title-linked offers |
| `filter.ts` | Pure household, provider, maturity, and search rules; independent artwork decision |
| `preferences.ts` | Validated local preference persistence and retired-provider migration |
| `ui.ts` | Escaped generic rendering, including opt-in launch diagnostics |
| `main.ts` | Small state/interaction orchestration; no provider-specific launch branches |
| `scripts/create-artwork.mjs` | Reusable original SVG sources and runtime exports |

`CatalogSource.list()` answers what titles exist. `AvailabilitySource.offersFor()` answers where a title is offered, with region/access/provenance. `ProviderLauncher.resolve(offer, platform)` separately answers the best known launch plan. A commercial availability source or licensed URL source can replace the fixtures without scattering provider behavior through UI components.

`loadLaunchableCatalog` projects only exact-title-resolved offers into discovery. It does not alter raw metadata or availability, nor claim that the checked URL proves entitlement. All surfaces use the projected list and the same content predicate. Details independently gate offers again and intersect with the household's selected services. A link on one provider never makes another provider's offer launchable. Missing-link titles cannot appear in search or featured content; home-only fallbacks never become Watch buttons.

## Launch plans

A plan carries exact URL, safe fallback, expected capability (`nativeExact`, `webExact`, `providerHome`, `unsupported`), evidence, provider content ID, navigation, and physical-verification requirement. The resolver validates HTTPS, provider origin, credentials, and recognized title-path shape, then preserves the observed URL verbatim. Hulu's significant query string is retained. Unknown integrations return unsupported; malformed/untrusted mappings fall back to the known provider homepage and are excluded from discovery.

The platform argument affects expected capability, not whether the app actually opened. Current iOS native expectations for Netflix/Disney+/Hulu are based on the user's report. The other three are web-exact candidates; no native confidence is inferred. Individual title/device records remain pending. See [compatibility](provider-compatibility.md).

All current primary URLs are safe HTTPS title destinations that also serve as web fallbacks. There is no custom-scheme navigation, hidden redirect, install detection, or timeout heuristic that might replace a successful native handoff with an erroneous fallback. Netflix/Disney+/Hulu preserve new-tab navigation. Prime/Paramount+/Peacock use same-tab direct links from the centralized policy. Prime's change is an experiment, not a claimed native fix.

## Diagnostics and normal UX

Only `?debug=links` renders diagnostic details. They show title/provider, URL, provider content ID, expected capability for iOS (or `&platform=web`), fallback, evidence, navigation, and verification notes. No TMDB ID is fabricated. Normal browsing has no developer fields; no diagnostic result is stored or sent anywhere. The UI consumes generic launch-plan properties rather than branching on provider IDs.

## Household rules and persistence

Subscriptions determine included offers; service tabs are transient browse scope. Horror includes scary-theme annotations. Seasonal hiding covers annotated Halloween and other holidays. Maturity bands combine film/TV labels as a prototype convenience, not equivalent standards or a content review. Unknown maturity is excluded by default. Violence/sexual/language preferences compose with these controls.

Promotional-art risk is separate from title acceptance: neutral local artwork can replace unreviewed/disturbing art without hiding an allowed title. All images are original local scenes, not official posters. Sample tags and subscription offers remain illustrative and cannot certify safety or entitlement.

Preferences use `viewport.preferences.v1`; old service choices are preserved, Max is discarded as retired, and Paramount+/Peacock are recognized when selected. Stored households are not silently enrolled in new services. Invalid fields recover safely; blocked storage produces a visible message and leaves the app usable. Local controls have no PIN or provider-profile enforcement.

Semantic controls, live result counts, visible focus, reduced-motion support, and native dialog Escape/focus behavior are preserved. Existing working routes are covered by literal URL/navigation regression checks. The Pages workflow still builds/tests/deploys `main`.

Accounts, payments, API purchases, production refresh backends, automated classification, broad catalog expansion, and native tvOS work are outside this milestone. Await the physical-device outcomes before the next major feature.
