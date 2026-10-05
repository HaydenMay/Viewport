# Big 6 launch research and test notes

Researched 2026-10-05 before the launch-model implementation. Preserve the existing Netflix, Disney+, and Hulu URL strings and navigation because the user confirms they work natively. Do not turn an experiment on another provider into a change to those three integrations.

## Verified, inferred, and pending

| Finding | Evidence level | Consequence |
| --- | --- | --- |
| Netflix, Disney+, Hulu open the selected native title | Explicit current user device report | iOS provider expectation is `nativeExact`; preserve routes; individual-title/version records pending |
| Prime resolves the correct web title, not the installed app | Explicit current user device report | Keep the checked URL and `webExact`; native handoff is not fixed or verified yet |
| Paramount+ full-series/movie HTTPS pages identify the intended titles | Official pages, opened in the cloud browser | Ready candidates with safe web fallback; native testing required |
| Peacock Parks and Recreation Season 1 and Despicable Me 2 pages identify the intended content | Official retrieval; Despicable Me 2 also opened in browser | Ready title/season candidates; no native app claim |
| Universal links depend on the provider's app/domain/path association and device behavior | Apple documentation | Viewport cannot create the provider's association or force a route it does not support |
| Same-tab direct Prime navigation might help app handoff | Implementation experiment, not documented Prime guarantee | Change only its navigation policy; preserve exact title URL; measure on device |
| Embedded browsers, remembered Safari choices, redirects, or unsupported associated paths may affect Prime | Hypotheses from Apple's generic guidance | Compare Safari and a long-pressed link; do not label any as the confirmed cause |

## Paramount+

Use observed official HTTPS series slugs and full-movie video IDs. All five candidate pages showed the expected identity/year in the cloud browser: SpongeBob SquarePants, Strange New Worlds, Mutant Mayhem, The SpongeBob SquarePants Movie, and Scream VI. Series pages showed full episodes. Do not use similarly named promotional `/shows/video/` clips as movie destinations. Text retrieval of some pages redirected to an international landing, while the browser displayed the intended US title; region is therefore a required device-test field.

No public provider documentation confirming these exact paths as supported native iOS routes was located in this research. This is a research limitation, not a claim that the app cannot deep link. The HTTPS route can display the exact web page if native handoff does not occur. Native movie and series behavior are separate pending checks.

## Peacock

Use the observed official URLs:

- [Parks and Recreation Season 1](https://www.peacocktv.com/watch-online/tv/parks-and-recreation/5883799404534408112/seasons/1)
- [Despicable Me 2](https://www.peacocktv.com/watch-online/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743)

Both official pages identify the expected content. Their native iOS association was not established by this research. The Office's series root redirected to its title-specific marketing page; it was not used as a new launch fixture. No opaque `/watch/asset/` identifier or custom scheme was guessed.

Peacock's [supported-device page](https://www.peacocktv.com/help/article/what-devices-and-platforms-are-supported-by-peacock) establishes an iOS app exists; it does not guarantee any particular title URL is associated with it. Signed-out pages may show Get Started instead of playback. Do not count a signup flow as a native-title pass.

## Prime Video

The current `/detail/` URLs already resolve the correct titles. The [official mobile-device help](https://www.primevideo.com/help?nodeId=G97NYNWZ7BB9CNDW) confirms iPhone/iPad app support but does not document a guaranteed title-link handoff for the prototype's paths. Public research did not locate an official custom-scheme contract or an independently checked alternative Amazon app link for these same title IDs. Do not invent an `aiv://` URI or assume Prime GTI IDs are Amazon ASINs.

The single implementation change is `navigation: same-tab` for Prime, using a plain user-tapped anchor with its exact existing HTTPS URL. Previously it opened a new tab. This removes the new-tab variable without changing the destination, using JavaScript redirects, or affecting the three working providers. Its known status stays `webExact`. A successful web page remains available without a broken custom-scheme page.

The provider's public AASA endpoints could not be inspected through the research tool. This is **not** evidence that association files are missing or that their app does not support universal links. The physical result and, if needed, an official share link from that same title are the next useful evidence.

## Apple guidance used

- [Support Universal Links](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html): HTTPS links can serve app and web destinations; provider-controlled association decides routing. Safari can respect the user's web intent on same-domain navigation.
- [Troubleshooting Universal Links, QA1916](https://developer.apple.com/library/archive/qa/qa1916/_index.html): final app/title observation matters; long-press app opening and a provider's Smart App Banner can help distinguish device choices from unsupported routing. This is archived generic guidance, not a guarantee for today's Prime, Paramount+, or Peacock apps.
- [Current Apple universal-link overview](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content).

## Three-minute physical-device check

1. Open Viewport in **Safari** on iPhone/iPad. Enable Prime, Paramount+, and Peacock in Preferences. Provider apps should already be installed and signed in.
2. Tap **SpongeBob SquarePants → Paramount+**, **Despicable Me 2 → Peacock**, and **Maisel → Prime Video**. Record **app/browser + exact title/Home/error** for each. Use Back to return after a web launch.
3. If one fails, open Viewport with `?debug=links`, inspect that title's Link diagnostics, and test its fallback. For Prime, also long-press the title link and note whether iOS offers Open in Prime Video. Do not buy or subscribe to test a route.
4. Report the three outcomes and your OS version. Optional second pass: Mutant Mayhem (Paramount+ movie) and Parks and Recreation (Peacock season). Confirm one Netflix/Disney+/Hulu title still opens natively.

Stop after these results. Native tvOS development, broader catalog imports, and other major features remain paused.

## Follow-up device result — 2026-10-05

After 1.6 loaded, the user reported successful, fast Paramount+ and Peacock title launches. Prime and Peacock explicitly remain browser launches. The same-tab Prime experiment did not establish native handoff. The user then explicitly confirmed Paramount+ opens in the native app; its iOS expectation is now `nativeExact` based on that report. The earlier research table documents the pre-test state; the compatibility matrix carries the latest observations. Preserve all working URLs and avoid another speculative route change.

## 1.7 investigation

The provider association files are now successfully retrieved by direct public HTTPS requests. Peacock covers `/watch/*`, while Prime covers its existing `/detail/*` route. Peacock’s own title pages supply matching `/watch/asset/…` destinations; these are opt-in probes with unchanged Watch fallbacks. Prime’s alternate app hostname redirected to an install page and was rejected. See [primary evidence and device retest](native-handoff-probe.md). This supersedes the earlier retrieval limitation; it does not prove native success.
