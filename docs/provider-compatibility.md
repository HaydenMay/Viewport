# Big 6 provider compatibility

Updated 2026-10-05. V1 is exactly Netflix, Disney+, Hulu, Prime Video, Paramount+, and Peacock. The following user observations are ground truth. They are provider-level reports, not a certification of every fixture URL or OS/app version. iPadOS-specific coverage and login/profile continuation still need records. Max is outside V1.

| Provider | Exact title resolved | Opens native iOS app | Opens correct title | Web fallback | Verified on device | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Netflix | Yes, 4 checked mappings | Yes, user reports working | Yes, user reports working | Same official `/title/` URL | User verified native exact; versions/title records pending | `nativeExact` iOS expectation; URL/new-tab behavior preserved |
| Disney+ | Yes, 5 checked mappings | Yes, user reports working | Yes, user reports working | Same official `/browse/entity-…` URL | User verified native exact; versions/title records pending | `nativeExact` iOS expectation; URL/new-tab behavior preserved |
| Hulu | Yes, 4 checked mappings | Yes, user reports working | Yes, user reports working | Same official title URL | User verified native exact; versions/title records pending | `nativeExact` iOS expectation; Only Murders episodes query preserved |
| Prime Video | Yes, 4 checked mappings | No, current test opens website | Yes, web title works | Checked `/detail/` URL | User retested 1.6; web exact, still no app handoff | `webExact`; native handoff cause is unresolved |
| Paramount+ | Yes, 2 series + 3 movies | Yes, user explicitly reports app opening | Yes, user reports working | Checked `/shows/…` or `/movies/video/…` URL | User verified native exact; title/version records pending | `nativeExact` iOS expectation; preserve URL/same-tab behavior |
| Peacock | Yes, 1 season + 1 movie | No, user reports website | Yes, user reports working and fast | Checked `/watch-online/…` URL | User verified web exact; title/version records pending | `webExact`; normal route preserved; opt-in `/watch/asset/…` native probe pending (1.7) |

## Capability and evidence rules

`nativeExact` means native exact-title behavior has been observed for that provider/platform; current four passes come from the user's explicit report. `webExact` means a checked title page exists, with no native success claimed. `providerHome` is a reliable provider homepage without a title route. `unsupported` means there is no supported integration or executable route.

The resolver returns an **expected capability** for a requested platform, not the provider's observed final screen. Each title's `requiresDeviceVerification` stays true until an individual device/title record exists, including the four providers with successful provider-level reports. Diagnostics identify the evidence as `user-reported-provider`, `official-web-page`, or `none` so a route cannot silently acquire native confidence from a URL.

All six integrations have an HTTPS homepage fallback for unmapped titles. Checked title plans use the same HTTPS URL as their web fallback: the OS can open the provider app when associated, otherwise the browser can display the title. There is no undocumented custom scheme, app-install probe, redirect timer, or optimistic native-success callback. Unsupported and homepage-only offers stay out of discovery/Watch actions.

## Record the next observation

Record provider, exact expected title/year/edition, candidate URL, iPhone/iPad model, OS/provider app version, account region, logged-in state, profile-picker behavior, app versus browser, final title versus Home/error, and whether the destination survives login. Do not record credentials. Promote only the tested route/platform combination; one movie pass does not verify all series paths. No tvOS result is claimed or developed in this milestone.

## Latest device report — 2026-10-05

The user confirms the updated prototype has loaded, Paramount+ and Peacock title launching work well, and loading is fast. They explicitly identify both Prime and Peacock as opening webpages rather than native apps. The user then explicitly confirmed Paramount+ opens in its native app. Title names, device/app versions, and movie-versus-series coverage were not supplied. No launch URL or navigation behavior is changed in response to this report.

## 1.7 handoff probe

Peacock’s normal Watch route still carries the user-verified web-exact status. Its separate opt-in app candidate uses official title navigation and association evidence, and remains physically unverified. Prime’s association covers the current path; its root cause remains unresolved. An alternate app hostname was rejected after an install-page redirect. See [the focused investigation](native-handoff-probe.md).
