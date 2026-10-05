# Verification and publication status

Checked 2026-10-05 UTC. The public repository [HaydenMay/Viewport](https://github.com/HaydenMay/Viewport) and [GitHub Pages site](https://haydenmay.github.io/Viewport/) are published. Initial application commit `7471a87b0a49df7085de361086769111e098a7bc` deployed successfully in [workflow run 37271329774, attempt 2](https://github.com/HaydenMay/Viewport/actions/runs/37271329774). Attempt 1 passed the build but started before Pages was enabled; enabling GitHub Actions as the Pages source and rerunning deploy resolved it. The live catalog showed 14 → 18 → 20 immediately and retained edits after reload.

## Local evidence

| Check | Result |
| --- | --- |
| Node filtering, fixture, persistence, and provider tests | 24 pass, zero failures |
| Strict TypeScript check | Pass |
| Vite production build | Pass; static `dist` output |
| Browser served at `/Viewport/` repository subpath | Pass; relative scripts, CSS, SVGs load |
| Default → horror off → seasonal off | 14 → 18 → 20 titles immediately |
| Reload after preference edits | Choices persist and 20 titles remain |
| Search combined with horror hiding | Stranger Things result disappears; useful empty state |
| Maturity ceiling PG/TV-PG | Seven matching fixtures |
| Max browse scope | Three matching fixtures under default content choices |
| Artwork-only change | Mandalorian cover switches; title remains |
| No subscriptions | Helpful empty state |
| Max-only subscriptions + multi-offer title | Fellowship details show only Max's homepage action |
| Title details | Destination-specific link labels and native-routing notice, Escape dismissal, focus restored to title card |
| Blocked localStorage | Catalog usable, visible saving-failure message |
| Browser errors / failed local assets | None |

Browser checks used headless Chromium 134 with Playwright 1.51.1, against the actual production output. They are viewport emulation, not tests on physical iPads or Safari. Native provider apps were not launched. Initial checks caught an unnamed small-screen Preferences button and horizontal overflow at 200% text; both were reproduced before fixing, and the regression checks now pass.

## Visual inspection

Captured and inspected desktop 1440×1000, iPad landscape 1180×820, iPad portrait 820×1180, mobile 390×844, small mobile 320×700, and 200% base text at 1024×768. No horizontal page/dialog overflow or overflowing cover titles. Original illustrations load. Preferences remains readable and scrollable; the Back to browsing action is reachable.

The optional `scripts/browser-qa.mjs` preserves the actual interaction/viewport checks and produces screenshots plus a JSON result in ignored `qa/`. It uses a temporary local server at the `/Viewport/` path. To repeat after building, make Playwright and its Chromium browser available locally, then run:

```sh
node scripts/browser-qa.mjs
```

An externally installed Playwright module can be supplied with `VIEWPORT_PLAYWRIGHT_MODULE`; a browser executable can optionally be supplied with `VIEWPORT_CHROMIUM_PATH`. These are QA configuration values, not app dependencies or production credentials.

## Independent review

One independent read-only reviewer checked the complete source and documentation, ran tests and TypeScript, and checked 960 subscription/query/provider combinations. No critical defects. Its important finding was the icon-only Preferences button's missing accessible name at ≤1000px; adding the explicit label fixes it, with a browser accessibility regression assertion. Its verification-document concern is resolved by this evidence file. No repeat review was requested; fixes were validated by the complete test/build/browser checks.

## Milestone 1.5 checks

17 manually located official title/season destinations replace homepage-only launching; four Max offers remain explicit fallbacks. Tests cover actual Moana, Prime Fellowship, Hulu Abbott, and Netflix Our Planet destinations, provider-specific fallback, and retained false native-verification status. Browser QA checks the Mandalorian URL, Title page label, Max-only fallback, and all previous filtering/layout behavior. Production build and 24 tests pass. Application commit `336135982aba4851b0017288a45b0ee5789e21b5` deployed successfully in [workflow run 37335200780](https://github.com/HaydenMay/Viewport/actions/runs/37335200780). The live site displays Prototype 1.5. Repeated live checks confirmed 14 → 18 → 20, reload persistence, horror-protected search yielding zero Stranger Things results, and PG ceiling yielding seven. Live Moana, Abbott, Our Planet, Maisel, and Prime Fellowship actions expose their expected title URLs and Title page labels; Fellowship’s Max offer and Dune expose explicit homepage fallbacks. Visually inspected the live Moana details dialog, including the new label and native-routing notice. The browser extension reported metadata-transport errors; these were extension URLs, not app failures. No native app or physical Apple device was tested.

An independent review of 1.5 found no Critical or Important defects, confirmed all 17 mappings match fixture offers and provider hostnames, and reran the 24 tests, TypeScript, build, and whitespace checks. External identity was checked separately through official public-page retrieval; logged-in entitlement and login/profile redirects remain untested. Documentation-only commits after this application commit do not change its generated bundle.

## Native checks still required

All five providers remain unverified for exact-title native launching on iPhone, iPad, and Apple TV. Follow [the native probe](native-probe.md) and [the explicit matrix](deep-link-validation.md). No web-link result upgrades that status.
