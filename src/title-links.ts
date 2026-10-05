import type { ProviderId } from "./domain.ts";

export interface TitlePageLink {
  titleId: string;
  providerId: ProviderId;
  url: string;
  checkedAt: string;
  evidence: "official-title-page";
}

// Manually located official pages, not scraped catalog data or native-launch proof.
// Source/identity observations and exceptions: docs/title-link-evidence.md.
export const TITLE_PAGE_LINKS: TitlePageLink[] = [
  [
    "moana",
    "disney",
    "https://www.disneyplus.com/browse/entity-e8896bfa-1052-41f7-ae2e-00255d77cf05",
  ],
  [
    "encanto",
    "disney",
    "https://www.disneyplus.com/browse/entity-328b0ec7-6e50-4ead-aa7f-c8bb92e6f08a",
  ],
  [
    "mandalorian",
    "disney",
    "https://www.disneyplus.com/browse/entity-422f6dcc-226f-44e7-98d4-22de69b31cf3",
  ],
  [
    "hocus-pocus",
    "disney",
    "https://www.disneyplus.com/browse/entity-b99c38fd-44ae-402f-b727-bc7fccb63740",
  ],
  [
    "coco",
    "disney",
    "https://www.disneyplus.com/browse/entity-ce1ccdca-f468-4960-b67c-026b01ba42ab",
  ],
  [
    "only-murders",
    "hulu",
    "https://www.hulu.com/series/only-murders-in-the-building-ef31c7e1-cd0f-4e07-848d-1cbfedb50ddf?tab=episodes",
  ],
  [
    "abbott",
    "hulu",
    "https://www.hulu.com/series/abbott-elementary-7c33eeb2-5d16-4a10-ad9e-ee31f9fff15c",
  ],
  [
    "the-bear",
    "hulu",
    "https://www.hulu.com/series/the-bear-c8cfbf97-1efd-4329-9d2c-162d385b49d7",
  ],
  [
    "prey",
    "hulu",
    "https://www.hulu.com/movie/55349764-323e-4d0e-898f-a4c12c9bf615",
  ],
  ["mitchells", "netflix", "https://www.netflix.com/title/81399614"],
  ["wednesday", "netflix", "https://www.netflix.com/title/81231974"],
  ["stranger-things", "netflix", "https://www.netflix.com/title/80057281"],
  ["our-planet", "netflix", "https://www.netflix.com/title/80049832"],
  [
    "fellowship",
    "prime",
    "https://www.primevideo.com/detail/0N0CRBLY1S5GDA4EVTQ34LF5GN",
  ],
  [
    "maisel",
    "prime",
    "https://www.primevideo.com/detail/0N2ZNLA18SIYYKK3H9W469YBKQ",
  ],
  [
    "the-boys",
    "prime",
    "https://www.primevideo.com/detail/0S1FYJ3LY9KTL9C7WFFAGA9F6F",
  ],
  [
    "the-holiday",
    "prime",
    "https://www.primevideo.com/detail/0O6ZAB6P2OCG8ZFBCOFPHX1HX3",
  ],
].map(([titleId, providerId, url]) => ({
  titleId,
  providerId: providerId as ProviderId,
  url,
  checkedAt: "2026-10-05",
  evidence: "official-title-page",
}));
