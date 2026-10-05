# Implementation record

Binding brief and scope: the user's first-milestone request, recorded in the design. Executed inline in a new, initially empty project; there was no existing application or shared branch to protect.

1. Domain behavior: wrote failing filter/persistence/provider tests; 16 failures established missing behavior. Implemented filters and adapters; the final domain suite contains 21 passing tests.
2. Discovery surface: built catalog, service selection, transient browse scope/search, filters, independent artwork replacement, native detail/preferences dialogs, and homepage-only launches. Preserved SVG generator and all runtime exports.
3. Verification: production build/type checking pass. Browser QA at the Pages subpath passes interaction, storage, keyboard, asset, viewport, and enlarged-text checks. Visually inspected captures.
4. Review: one independent source review identified the small-screen Preferences accessible-name defect; the browser assertion reproduced it, then passed after the explicit label fix. Enlarged-text overflow also reproduced and passed after flexible layouts/cover typography. Documentation link completed.

Decisions: retain the requested GitHub Pages hosting destination; do not substitute Sites. Use illustrative metadata and offers to avoid unauthorized API credentials or official poster reuse. Keep native-launch capability explicitly unverified. Build the smallest SwiftUI probe next, before a full native interface.

Outstanding external operation: GitHub connector lacks repository-creation and Pages-settings actions. The source is ready; browser fallback permission is required to finish publication. Live Pages verification is not complete.

## Milestone 1.5 — 2026-10-05

User tested the initial build and reported provider app/web home-menu opening. Added 17 manually observed official title/season destinations in a separate launch registry, with provider-specific resolution and four explicit Max fallbacks. Native routing remains untested. Added behavior regressions (homepage-only red → title destinations green), destination labels, evidence log, and an updated Apple test matrix. Verification: 24 tests, TypeScript/build, production browser QA, independent review, successful GitHub deployment, and live interaction checks. See verification.md and title-link-evidence.md.

## Milestone 1.6 — fixed Big 6 launch architecture

The user's refined instruction fixes V1 to Netflix, Disney+, Hulu, Prime, Paramount+, and Peacock, removes Max, and pauses broad catalog expansion/native tvOS development. Preserved all 17 existing Big 6 fixture URLs and new-tab behavior for the three natively working providers. Added five Paramount+ and two Peacock routing examples only.

Centralized URL validation, content-ID extraction, platform support evidence, expected capability, navigation, and fallback policy in the provider registry/resolver. Discovery and availability remain separate adapters; title-linked admission strips unsupported offers before content/search filtering. Normal UI consumes generic plan fields. Opt-in `?debug=links` shows test diagnostics without telemetry or persistence. Prime retains its checked title URL, with same-tab direct navigation as an unverified handoff experiment.

Provider-launch tests were observed failing before the new model, then passed after implementation. Device reports explicitly establish Netflix/Disney+/Hulu native success and Prime web-exact status; new providers remain untested. The compatibility/research documents distinguish user observation, official web evidence, inference, and pending native tests. Stop after deployment and await the user's physical results.

## Device results after 1.6 deployment

The user reports the updated site loaded, Paramount+/Peacock title launching works, and loading is fast. Prime and Peacock explicitly open the website rather than the native app. Record Peacock iOS evidence as user-reported `webExact`; keep Prime `webExact` after its same-tab retest. A subsequent explicit confirmation establishes Paramount+ native app opening; promote its iOS expectation to `nativeExact` with user-reported evidence. Updated diagnostics and documentation only; preserved every launch URL and navigation policy.

## 1.7 — bounded Prime/Peacock investigation

Retrieved current public association files directly, retaining relevant entries/hashes. Peacock’s `/watch-online/…` route does not match published app paths; official Sign In return links supply `/watch/asset/…` for both fixtures. Added opt-in, identity-validated candidates only, preserving all 24 primary URLs/navigation. Prime’s current `/detail/…` is listed in its association. Its Share UI retains the same title URL; an alternate app hostname redirected to an install page and was rejected. Follow Apple Notes long-press diagnostics next. The candidate test failed before implementation, then passed; malformed/mismatched candidates fail closed. No native result is claimed.
