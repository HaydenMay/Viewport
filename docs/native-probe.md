# Smallest next native Apple test

Build one tiny SwiftUI **Viewport Link Probe**, with iOS/iPadOS and tvOS targets sharing a five-provider list and verified candidate URLs. It needs no catalog, account system, backend, TMDB API, or paid availability vendor.

## First experiment

1. On a device the household already uses, obtain one genuine title share URL per provider using its official share feature or documented title page. Confirm that title is currently available under the test account. Record the exact URL/source; do not generate guessed content IDs or custom schemes. A share URL is a candidate, not native proof.
2. Give the probe one title button per provider. Use `UIApplication.open` with an installed-app-only universal-link attempt on iOS/iPadOS. Offer a separately labeled ordinary web fallback after failure. Record acceptance and a manual observation of the resulting app and title. On tvOS use the SDK-supported opening path and record the actual result.
3. Run the five buttons on **a physical iPad and Apple TV first**: ten launches test the user's principal devices. Repeat those five on a physical iPhone before claiming iPhone support: fifteen baseline observations total. Simulators cannot establish installed-provider routing.
4. For a passing provider, add one series/episode link and repeat while cold, after a profile picker, and after login. Record device/OS/provider app versions and region. Check the final screen visually, not merely the open callback.

## Success criterion and decision

The smallest positive result is **Viewport button → correct native provider → expected title detail page** on that platform, with no manual search. Autoplay is optional and separately tracked. A browser page, provider home page, phone handoff, or lost title after login is a partial result.

If all five Apple TV routes pass, proceed to a focused tvOS catalog with remote/focus navigation, safe artwork, and local preferences; reuse the normalized domain and confirmed launch registry. Add iOS/iPadOS as a companion discovery app. If a provider fails on tvOS, seek its documented partner integration before promising universal coverage. Keep that provider's fallback visible and limited to its verified capability.

This order resolves the highest-risk product assumption before investing in a full native interface. It does not prove links will work permanently, in every region, or under every subscription plan; verification should be versioned and periodically repeated.

## Probe fields

Keep a local JSON or CSV result with provider, exact expected title/provider content ID, URL/source, platform and app versions, account region/entitlement, launch callback, actual app, actual screen, and a note/evidence path. Never collect provider passwords or tokens. Use the [validation matrix](deep-link-validation.md) as the record format.
