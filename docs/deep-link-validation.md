# Native provider deep-link validation matrix

**Status: unverified for every native provider/platform combination.** Updated 2026-10-05 UTC. This web prototype intentionally uses homepage links. An HTTPS provider homepage is not evidence of native routing or an exact title landing.

## Destination matrix

| Provider | Prototype web destination | iPhone exact native title | iPad exact native title | Apple TV exact native title | Title URL evidence |
| --- | --- | --- | --- | --- | --- |
| Disney+ | `https://www.disneyplus.com/` homepage | Untested | Untested | Untested | No title URL collected |
| Hulu | `https://www.hulu.com/` homepage | Untested | Untested | Untested | No title URL collected |
| Netflix | `https://www.netflix.com/` homepage | Untested | Untested | Untested | No title URL collected |
| Prime Video | `https://www.primevideo.com/` homepage | Untested | Untested | Untested | No title URL collected |
| Max (HBO Max destination) | `https://www.hbomax.com/` homepage | Untested | Untested | Untested | No title URL collected |

Keep `max` as the internal identifier and the brief's Max label; the homepage destination uses HBO Max branding. Branding/domain changes do not establish a URL scheme. Revalidate destinations before release.

## Record one row per actual launch

Copy this schema into a CSV or worksheet when the device probe begins. Never leave a successful open callback as the only success evidence.

| Field | Record |
| --- | --- |
| Provider; expected title | Actual provider, full title, media type, year, provider content ID |
| Candidate URL and source | Exact copied provider share URL, official documented link, or licensed vendor URL; retrieval date |
| Device/OS | Physical iPhone, iPad, or Apple TV model and OS version |
| Provider app | Installed app version, cold/warm state |
| Account | Region, subscription entitlement, logged in/out; omit credentials |
| Profile | Adult/kids/restricted profile; whether a picker intervenes |
| Attempt | URL + options, outgoing timestamp, launch API accepted/rejected |
| Observed app | Correct provider, wrong app, browser, error, or phone handoff |
| Observed destination | Exact title detail, correct episode, playback, provider home, or lost destination |
| Evidence | Timestamped screenshot/video/manual note, never secrets |
| Return path | Return to Viewport and focus restoration |
| Result | Pass, partial (provider opens but wrong/lost title), fail, or blocked |

## Test order

Start with one confirmed available title in each service, logged in and entitled, on iPhone/iPad and physical Apple TV. Then add one series/episode candidate per provider. For a candidate that works, test cold/warm launches, profile picker, signed-out/login continuation, missing app, unavailable title, and wrong region as applicable. Do not spend time building a full catalog if tvOS exact-title routing fails.

**Pass:** A tap in the native Viewport probe opens the correct native provider and shows the expected title's detail page or verified playback, retaining the destination after required profile/login steps. Playback is a separate higher capability; title details are sufficient for the core discovery promise.

**Partial:** The correct provider opens at Home, the browser opens, a phone handoff is required, or the destination is lost after login/profile selection. Label this accurately; it does not pass the Apple TV promise.

**Fail:** Wrong provider/title, error, rejected link, or no usable route. Record a practical fallback, but do not count it as native support.

## Platform notes

Apple supports universal-link handling on iOS/tvOS, but each provider controls its app/domain association and supported routes. Viewport cannot add an association for another company's app. A link supported on iOS does not prove it is supported by that provider's tvOS build.

On iOS/iPadOS, `UIApplication.open` with `universalLinksOnly: true` can distinguish a supported installed-app universal link from a browser fallback. A true completion means the open was accepted; it does not report the provider's final title screen. On tvOS, observe actual behavior and any companion-phone handoff. Test platform availability of options in the targeted Xcode SDK, without assuming identical support.

Only use a custom scheme if a provider documents it or a permitted, reproducible physical test validates it. `canOpenURL` alone does not prove an exact-title route. Document required query-scheme entries only after selecting an evidenced scheme, rather than inventing a scheme list.

Primary references: [Apple universal links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app), [associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains), [universalLinksOnly](https://developer.apple.com/documentation/uikit/uiapplication/openexternalurloptionskey/universallinksonly).
