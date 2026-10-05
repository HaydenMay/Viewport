# Official title-link evidence — milestone 1.5

Located manually on 2026-10-05 UTC using public web search and retrieval of official provider pages. These are 17 title/season-page candidates across four providers, not scraped catalog data, subscription-availability certification, native routing proof, or playback validation. Original prototype availability/classification remains illustrative.

| Fixture | Provider | Official title destination / source |
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

## Observations and gaps

- Disney pages identify the expected movies or series; Moana is the 2016 animated film, not the 2026 remake. Encanto is the film, not the sing-along or concert.
- Hulu’s Only Murders bare URL redirected to Disney+ home during retrieval. The official `?tab=episodes` URL returned the named 2021 series; preserve that observed form. This variation makes device/account retesting especially necessary. Abbott and The Bear pages identified the series; Prey identified the 2022 movie.
- Netflix pages identify the four named titles. These are `/title/` detail destinations, not `/watch/` playback promises.
- Prime pages identify Fellowship’s theatrical film, The Holiday (2006), and Season 1 pages for Maisel and The Boys. Do not substitute extended editions or a randomly selected episode. Fellowship’s retrieved page offered rental/purchase or a Max channel trial rather than proving inclusion in base Prime; a title link never proves entitlement.
- No usable Max title page was located from official public pages; its public `/movies` page returned “Site Unavailable” in this browser. Dune, Iron Giant, Conjuring, and Fellowship’s Max offer remain labeled homepage fallbacks. No private endpoints, scraped catalogs, guessed IDs, or paid API were used.
- All iPhone, iPad and Apple TV exact native destinations remain **Untested**. User report from the earlier build confirms app/web home-menu opening only, without OS/app versions or per-provider outcomes.

## Minimal user test after this deployment

On iPhone/iPad, refresh Viewport and test Moana → Disney+, Abbott Elementary → Hulu, Our Planet → Netflix, and Maisel → Prime. Record app versus browser, expected title versus home, whether login/profile choice loses the title, OS/app version, and region. Do not buy or subscribe to test a link. Native tvOS remains the next physical-device probe. A web launch does not validate Apple TV support.
