# Verification and publication status

Checked 2026-10-05 UTC. The local prototype is implemented and validated. **The public GitHub repository and deployed Pages site are not yet created/verified**: the connected GitHub tool can write files but exposes neither repository creation nor Pages enablement. Browser fallback requires user approval. Do not claim the target URL is live.

## Local evidence

| Check | Result |
| --- | --- |
| Node filtering, fixture, persistence, and provider tests | 21 pass, zero failures |
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
| Title details | Honest homepage notice, Escape dismissal, focus restored to title card |
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

## Publication checks still required

Create public `HaydenMay/Viewport`; push the complete source and lockfile; enable GitHub Actions as the Pages source; observe successful build/deploy jobs; open the actual emitted URL and repeat the production browser checks there. Document the deployment commit, workflow URL, final Pages URL, and actual outcome. Repository creation and deployed-site verification remain pending; local results do not substitute for them.

## Native checks still required

All five providers remain unverified for exact-title native launching on iPhone, iPad, and Apple TV. Follow [the native probe](native-probe.md) and [the explicit matrix](deep-link-validation.md). No web-link result upgrades that status.
