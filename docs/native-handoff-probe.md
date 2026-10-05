# Prime and Peacock iOS handoff investigation — 1.7

Checked 2026-10-05 after the user confirmed native exact-title launches for Netflix, Disney+, Hulu, and Paramount+, and web-exact launches for Prime and Peacock. Preserve every existing Watch URL and navigation policy. Only an opt-in Peacock probe is added; no native success is claimed for it.

## Direct primary-source evidence

Public HTTPS requests returned HTTP 200 JSON for the provider association files below. The earlier research tool could not retrieve these files; that was a tool limitation, not a provider failure. Relevant entries and whole-response hashes are retained in [the evidence snapshot](evidence/2026-10-05-ios-associations.json).

| Source | Observation | Interpretation |
| --- | --- | --- |
| [Peacock association](https://www.peacocktv.com/.well-known/apple-app-site-association) | Production app `W76B757YRY.com.peacocktv.peacock` lists `/deeplink/*` and `/watch/*` | Current `/watch-online/…` URLs do not match these paths. This supports a path-mismatch hypothesis, not proof of the installed app's entitlement or final title |
| [Prime main-domain association](https://www.primevideo.com/.well-known/apple-app-site-association) | Production app `J7P34ALZ5R.com.amazon.aiv.AIVApp` lists `/detail/*`, `/watch/*`, `/dp/*`, and other paths | Current `/detail/…` route is covered on the website side; changing a path blindly is unjustified |
| [Prime app-domain association](https://app.primevideo.com/.well-known/apple-app-site-association) | Same production app lists `*` | Host is associated on the website side; no exact-title route contract follows from a wildcard |

Apple requires matching website association **and** installed-app entitlements. A published association alone cannot prove native exact-title launch. The provider's installed app and the user's device state cannot be inspected here.

## Peacock: supported-format candidate

The official [Despicable Me 2 page](https://www.peacocktv.com/watch-online/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743) uses this exact title destination in its Sign In `return` and Get Started `successRedirect` links:

`https://www.peacocktv.com/watch/asset/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743`

The official [Parks and Recreation Season 1 page](https://www.peacocktv.com/watch-online/tv/parks-and-recreation/5883799404534408112/seasons/1) similarly supplies:

`https://www.peacocktv.com/watch/asset/tv/parks-and-recreation/5883799404534408112/seasons/1`

The movie asset route returned HTTP 200 web application HTML; that alone does not verify its final signed-in title or native screen. The destination and its ID/season were observed in the title's own navigation, not guessed from a different title or private API. No catalog crawling was performed.

Implementation: store each observed candidate beside its checked web mapping. The integration validates HTTPS, the same exact origin, no credentials, matching slug/ID/season, and unchanged query/fragment. Rejected or unmapped candidates never affect discovery or Watch actions. Candidate evidence stays separate from the user-confirmed web result. Diagnostics show **Try app link · Peacock** only for the iOS expectation under `?debug=links`; normal browsing still uses the checked web links.

If the candidate fails, use Back to return to Viewport and tap the normal Watch action or **Open fallback provider page**. No custom scheme, install prompt flow, timer redirect, or app-success detector is introduced.

## Prime: reject a weak alternate, test device preference

The official Maisel page's Share UI supplied the same `/detail/0N2ZNLA18SIYYKK3H9W469YBKQ` URL with a referral query, not an alternate title-launch hostname. The cloud clipboard did not return the copied text; the visible Share controls' Email/Facebook link attributes confirmed the destination. No messages were sent.

A bounded probe of `https://app.primevideo.com/detail/0N2ZNLA18SIYYKK3H9W469YBKQ` redirected to `https://www.primevideo.com/splash/t/getTheApp?ref_=atv_dl_rdr`. It does not preserve the exact web title, and native parsing of that route is unverified. It is **rejected** rather than shipped as a new launch action. Do not infer an opaque GTI or ASIN mapping, or invent an `aiv://` URI.

[Apple's current TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links) recommends pasting a link into Apple Notes and long-pressing it to inspect app versus browser options. It distinguishes user approval, site/framework approval, cached association state, and browser behavior. Typing a URL into Safari's address bar is not an app-handoff test. A long-press result will help narrow Prime's cause; it does not yet identify the cause as a remembered user preference.

## Short physical retest

1. Open Viewport in Safari with `?debug=links`, showing **Prototype 1.7**. Enable Peacock and Prime if needed.
2. Open **Despicable Me 2**, expand **Link diagnostics · Peacock**, tap **Try app link · Peacock**. Report app/browser and exact movie/Home/error. If desired, repeat **Parks and Recreation** to test the season route.
3. For **Maisel**, copy its normal Watch link into Apple Notes, then long-press that link. Report whether **Open in Prime Video** appears and, if selected, whether it reaches Maisel. If no app option appears, a URL copied from that same title's Share control inside the installed Prime app would be the next useful evidence.

Current native expectations remain unchanged: four provider-level native passes, Prime and Peacock web-exact. Promote only after physical-device results. Native tvOS work and further features remain deferred.
