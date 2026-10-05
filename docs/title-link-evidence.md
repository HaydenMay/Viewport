# Official title-link evidence — Big 6 milestone 1.6

Checked 2026-10-05 UTC. Twenty-four manually located official title/season URLs across the fixed Big 6 are retained independently of prototype availability. These are checked web identities, not entitlement certifications or native support inferred from URLs. The existing 17 Netflix/Disney+/Hulu/Prime destinations are unchanged from 1.5. Added only five Paramount+ and two Peacock entries for routing tests; broader catalog expansion is paused.

| Fixture | Provider | Official destination |
| --- | --- | --- |
| moana | disney | [moana official page](https://www.disneyplus.com/browse/entity-e8896bfa-1052-41f7-ae2e-00255d77cf05) |
| encanto | disney | [encanto official page](https://www.disneyplus.com/browse/entity-328b0ec7-6e50-4ead-aa7f-c8bb92e6f08a) |
| mandalorian | disney | [mandalorian official page](https://www.disneyplus.com/browse/entity-422f6dcc-226f-44e7-98d4-22de69b31cf3) |
| hocus-pocus | disney | [hocus-pocus official page](https://www.disneyplus.com/browse/entity-b99c38fd-44ae-402f-b727-bc7fccb63740) |
| coco | disney | [coco official page](https://www.disneyplus.com/browse/entity-ce1ccdca-f468-4960-b67c-026b01ba42ab) |
| only-murders | hulu | [only-murders official page](https://www.hulu.com/series/only-murders-in-the-building-ef31c7e1-cd0f-4e07-848d-1cbfedb50ddf?tab=episodes) |
| abbott | hulu | [abbott official page](https://www.hulu.com/series/abbott-elementary-7c33eeb2-5d16-4a10-ad9e-ee31f9fff15c) |
| the-bear | hulu | [the-bear official page](https://www.hulu.com/series/the-bear-c8cfbf97-1efd-4329-9d2c-162d385b49d7) |
| prey | hulu | [prey official page](https://www.hulu.com/movie/55349764-323e-4d0e-898f-a4c12c9bf615) |
| mitchells | netflix | [mitchells official page](https://www.netflix.com/title/81399614) |
| wednesday | netflix | [wednesday official page](https://www.netflix.com/title/81231974) |
| stranger-things | netflix | [stranger-things official page](https://www.netflix.com/title/80057281) |
| our-planet | netflix | [our-planet official page](https://www.netflix.com/title/80049832) |
| fellowship | prime | [fellowship official page](https://www.primevideo.com/detail/0N0CRBLY1S5GDA4EVTQ34LF5GN) |
| maisel | prime | [maisel official page](https://www.primevideo.com/detail/0N2ZNLA18SIYYKK3H9W469YBKQ) |
| the-boys | prime | [the-boys official page](https://www.primevideo.com/detail/0S1FYJ3LY9KTL9C7WFFAGA9F6F) |
| the-holiday | prime | [the-holiday official page](https://www.primevideo.com/detail/0O6ZAB6P2OCG8ZFBCOFPHX1HX3) |
| spongebob | paramount | [spongebob official page](https://www.paramountplus.com/shows/spongebob-squarepants/) |
| strange-new-worlds | paramount | [strange-new-worlds official page](https://www.paramountplus.com/shows/star-trek-strange-new-worlds/) |
| mutant-mayhem | paramount | [mutant-mayhem official page](https://www.paramountplus.com/movies/video/zzvVWZ_qkLDj2LXltHmuZlUsX8BfdZ7U/) |
| spongebob-movie | paramount | [spongebob-movie official page](https://www.paramountplus.com/movies/video/mM6oBlGnK1Tt1OzTyjM8vc_0QE1vui9k/) |
| scream-vi | paramount | [scream-vi official page](https://www.paramountplus.com/movies/video/P1DZtBQ4PfwSJVpEzYDlcu83ulIk_ARL/) |
| parks-and-rec | peacock | [parks-and-rec official page](https://www.peacocktv.com/watch-online/tv/parks-and-recreation/5883799404534408112/seasons/1) |
| despicable-me-2 | peacock | [despicable-me-2 official page](https://www.peacocktv.com/watch-online/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743) |

## Observations

- Disney pages identify the intended movies/series. Moana is the 2016 animated film; Encanto is the film rather than a sing-along/concert.
- Hulu's Only Murders bare URL redirected to Disney+ home in text retrieval. The observed `?tab=episodes` form identified the correct series and is preserved byte-for-byte. Other pages identify Abbott, The Bear, and Prey.
- Netflix's four `/title/` destinations identify the expected titles, without promising autoplay.
- Prime pages identify Fellowship's theatrical movie, The Holiday (2006), and Maisel/The Boys Season 1. Fellowship's page offered rent/buy or a channel trial in retrieval, so its sample offer does not prove base-Prime entitlement. Its URL remains useful for launch testing without purchases.
- All five Paramount+ pages were opened in the cloud browser and showed the expected movie/series heading and year. Series pages showed episodes. The three `/movies/video/` links identify full movies, not similarly titled promotional `/shows/video/` clips. Some text retrievals redirected to an international landing; native/region testing remains required.
- Peacock's Parks and Recreation URL is specifically Season 1; the official page displays episodes and title identity. Despicable Me 2's official page was retrieved and opened in the cloud browser with the expected title, 2013 year, and PG label. Signed-in playback/entitlement was not tested.
- No Max mapping or offer is part of V1. No guessed opaque IDs, unofficial URL schemes, internal endpoints, scraping, or commercial API was used.

## Current device evidence

The user explicitly reports native exact-title success for Netflix, Disney+, and Hulu; Prime resolves the correct web title but does not hand off natively. Paramount+ and Peacock are untested on real devices. These provider-level observations are the baseline in [compatibility](provider-compatibility.md); individual title/OS/app records still need to be added.

Test SpongeBob SquarePants → Paramount+, Despicable Me 2 → Peacock, and Maisel → Prime first. Optional second routes: Mutant Mayhem and Parks and Recreation. The same checked HTTPS destination is the safe web fallback. No cloud-browser result is promoted to native confidence.
