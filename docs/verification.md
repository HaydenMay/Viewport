# Verification and publication status

Checked 2026-10-05 UTC. The public [HaydenMay/Viewport repository](https://github.com/HaydenMay/Viewport) and [GitHub Pages site](https://haydenmay.github.io/Viewport/) are published. Milestone 1.6 has completed local validation and is committed to main. After the earlier Actions outage, the user confirms the updated site loaded and tested its new providers. Workflow completion and live browser regression checks have not been independently rechecked.

## Milestone 1.6 local evidence

| Check | Result |
| --- | --- |
| Node behavior suite | 33 tests pass, zero failures |
| Strict TypeScript and Vite production build | Pass; static `dist` output |
| Linked catalog admission | 24 title-linked fixtures across exactly the Big 6; unsupported offers excluded |
| Default → horror off → seasonal off | 17 → 22 → 24 immediately |
| Reload after preference edits | Choices persist, all 24 remain |
| Every browsable title's details | All 24 render title-specific Watch actions; no homepage fallbacks |
| Horror-protected search | Stranger Things disappears; search cannot bypass controls |
| PG/TV-PG/TV-Y7 ceiling | 11 fixtures |
| Retired Max | No service control, offer, or catalog entry in V1 |
| Provider navigation | Netflix/Disney+/Hulu keep `_blank`; Prime/Paramount+/Peacock use direct `_self` HTTPS |
| Prime-only browsing | Exact Fellowship destination, with safe web fallback |
| Peacock scope | Two title-linked entries; correct movie/season destinations |
| Opt-in diagnostics | Exact URL, ID, expected capability, evidence, fallback, and pending device state; absent in normal UI |
| Paramount+ only, default → horror off | 3 → 5 titles; provider selection persists after reload |
| Paramount+ series action | SpongeBob targets its exact official series URL |
| Artwork-only change | Mandalorian cover switches; title stays visible |
| Zero subscriptions | Useful service-selection empty state |
| Details accessibility | Escape closes, focus returns to the title card |
| Blocked browser storage | Catalog usable, visible saving-failure message |
| Browser page errors / failed local assets | None |

The new admission tests were observed failing against the previous ungated behavior (unsupported title admitted, Max-only offers admitted, fallback action admitted). The Paramount+ preference test failed when the old parser discarded its ID. They passed after implementation.

Browser QA used headless Chromium 134 and Playwright 1.51.1 against the actual production build served at `/Viewport/`. This is browser viewport emulation, not Safari or a physical Apple device. No native provider app, signed-in entitlement, or playback was tested.

## Responsive and visual checks

Captured desktop 1440×1000, iPad landscape 1180×820, iPad portrait 820×1180, mobile 390×844, small mobile 320×700, and 200% base text at 1024×768. Browser assertions passed for page/dialog overflow, long cover-title typography, and image loading. Preferences remains scrollable and the bottom action is reachable.

The optional `scripts/browser-qa.mjs` preserves these checks and creates screenshots plus a result JSON in ignored `qa/`. After a build, run it with Playwright/Chromium available. An external installation can be supplied with `VIEWPORT_PLAYWRIGHT_MODULE` and an executable with `VIEWPORT_CHROMIUM_PATH`; neither is a production dependency.

## External destination evidence

Seven new destinations were located manually on official pages. All five Paramount+ candidates were opened in the cloud browser and showed the expected full movie/series heading and year. Peacock's two official title/season destinations were retrieved; its movie page was also opened in the cloud browser and showed the expected title/year. Other successful official title-page retrievals and regional observations are documented in [title-link evidence](title-link-evidence.md). No catalog crawling, guessed IDs, or private endpoints were used.

The user explicitly confirms Netflix/Disney+/Hulu native exact-title opening on iOS and Prime web-exact opening without native handoff. These are preserved as ground truth, with individual-title/version coverage pending. The user subsequently confirms Paramount+ native exact-title launching and Peacock web-exact launching. Prime still opens the web title after the same-tab change. Apple TV remains untested; no native development begins here.

## Independent review

The independent reviewer could not run because its session returned a usage-limit error. No independent 1.6 approval is claimed. A focused source review and complete regression/build/browser checks are used instead. Earlier independent reviews of the initial prototype and 1.5 found no unresolved Critical or Important defects; an initial small-screen accessible-name defect was fixed and has a browser regression check.

## Deployment history

- Initial application commit `7471a87b0a49df7085de361086769111e098a7bc` deployed in [run 37271329774, attempt 2](https://github.com/HaydenMay/Viewport/actions/runs/37271329774). Attempt 1 began before Pages was enabled; selecting GitHub Actions as the Pages source resolved deployment.
- Milestone 1.5 application commit `336135982aba4851b0017288a45b0ee5789e21b5` deployed in [run 37335200780](https://github.com/HaydenMay/Viewport/actions/runs/37335200780). Live checks confirmed 14 → 18 → 20, preference persistence, protected search, maturity filtering, and the new provider title URLs. The explicit Max homepage fallbacks in that release are removed from discovery/actions in 1.6.

## Milestone 1.6 deployed checks

Application commit `a169ef18babaea8e3296fd7c8af71a42a0c45183` is published on main. [Pages run 37372529348](https://github.com/HaydenMay/Viewport/actions/runs/37372529348) was queued when checked. The user reported that GitHub Actions is down and explicitly instructed us not to wait. The live site still showed Prototype 1.5 at the last check. Deployment and live 1.6 verification therefore remain pending. No workflow or hosting configuration was changed. Local build evidence alone does not establish deployed correctness.

Follow-up: the user now confirms the update loaded and reports successful Paramount+/Peacock title launches and fast loading. Prime and Peacock open webpages rather than native apps. The user subsequently explicitly confirmed Paramount+ native app opening. This is user-provided deployed/device evidence, not an independent workflow or browser regression recheck. No additional major feature work begins.

## Native checks still required

Follow [the physical-device probe](native-probe.md) and [six-provider matrix](deep-link-validation.md). A public title page or unspecified user success report does not certify iPhone, iPad, or Apple TV exact-title routing. The next native catalog must exclude routes that fail on its actual platform.

## Milestone 1.7 local verification

35 tests pass, including a new Peacock candidate test observed failing before implementation. Strict TypeScript and the Vite production build pass. A direct comparison confirms all 24 primary title URL mappings are unchanged. The full production-browser QA passes on desktop, both iPad orientations, mobile, 320px width, and 200% text, with no page errors or failed local assets. Normal actions and all existing filters/preferences remain intact.

Opt-in mobile diagnostics expose the exact observed Peacock season candidate, pending-device label, same-tab test action, and original web fallback without overflow. Prime exposes no rejected app-host candidate and retains the original title fallback plus Apple Notes testing guidance. The candidate control was visually inspected in the mobile capture. No native handoff is claimed from desktop/browser checks.

Application commit `4e7ad28983d2d9aa0149c415961a581736626788` deployed successfully in [Pages run 37383837597](https://github.com/HaydenMay/Viewport/actions/runs/37383837597); both build and deploy jobs concluded success. A live browser check showed Prototype 1.7, all six services, and 17 default titles. Despicable Me 2 diagnostics showed the exact `/watch/asset/…` candidate, original web action/fallback, user-reported `webExact`, and pending physical verification. Its live control was visually inspected and captured. These checks establish deployed web correctness, not native app handoff.


## Catalog evaluation implementation — 2026-10-06

- Baseline: 35 existing tests passed.
- Added 24 importer tests covering subscription projection, matching, certifications, safe URLs, bounded auth/HTTP and end-to-end sampling/reporting. Each task's tests were written/run before the implementation.
- `npm run verify`: 59 tests passed; strict TypeScript passed; Vite production build passed. The existing environment emits an npm proxy-configuration warning; it did not fail verification.
- Missing-key CLI probe: exit 1 with a sanitized `missing-secret` error before any upstream request.
- Manual workflow YAML checked for dispatch-only trigger, read-only permissions, finite timeout, verification before secret access and trial-step-only secret scope.
- `git diff --check` passed; comparison with pre-trial commit `16cec4a` found no changes in `src/` or `.github/workflows/pages.yml`. Generated browser bundle remains `index-z1N0_keH.js` and `index-UBbJjgNJ.css`.
- Real credentials/data coverage have not yet been tested. The only 100-title result so far is a synthetic mocked evaluation, not a claim about the provider catalogs. Live discovery still uses 24 fixtures.

Independent read-only code review identified malformed TVDB envelopes and unnecessary unbalanced-sample pagination. Four reproducing tests failed before fixes and pass afterward; full verification passes 59 tests/build. A minor limitation remains: link rejection diagnostics are totals, without provider/path-family categories. Real API execution is still pending.

## Catalog expansion preparation — 2026-10-06

- `npm run verify`: 76 tests passed; strict TypeScript and production build passed. npm emits the existing non-fatal proxy configuration warning.
- Added reproducing filter/default/search tests and a synthetic 300-title ingestion selection test before implementation. Snapshot tests verify unknown-state handling, rating disagreement, availability/link separation and preservation of checked fixture links.
- Production browser QA at `/Viewport/` passes desktop, both iPad orientations, 390px/320px mobile, 200% text, saved/blocked storage and all 24 fixture title destinations. The QA script was updated for new default services and explicit-search behavior; obsolete count assertions initially failed and were corrected to the approved policy.
- Focused browser checks confirm a horror title can appear with a search warning, a maturity limit still excludes it, and details repeat the warning. No page errors or horizontal overflow; screenshots visually inspected.
- A temporary **synthetic** 300-title snapshot verified 60-card initial rendering, Show more, full-catalog partial search, unknown-rating labels, exclusion under a limit and persisted No maturity limit. It was removed before the release build. This is not a real 300-title ingestion result.
- Real 300-title preview requires a manual workflow run with repository secrets. No real source data was published. Live catalog remains 24 fixtures; source distribution clarification is pending.
- Final browser bundle: `index-ClKbXrgz.js`, `index-C4LcUMOx.css`. Pages workflow is unchanged and remains independent of API keys.
