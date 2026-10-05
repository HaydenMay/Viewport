import type {
  LaunchCapability,
  LaunchPlatform,
  LaunchTarget,
  Offer,
  ProviderId,
  ProviderLauncher,
} from "./domain.ts";
import { TITLE_PAGE_LINKS, type TitlePageLink } from "./title-links.ts";

export interface ProviderIntegration {
  id: ProviderId;
  name: string;
  monogram: string;
  color: string;
  homepage: string;
  titlePath: RegExp;
  contentId: RegExp;
  navigation: LaunchTarget["navigation"];
  iosCapability: LaunchCapability;
  iosEvidence: "user-reported" | "pending";
  iosNotes: string;
}

// Provider facts and routing policy live here, never in UI components. Native
// status is the user's provider-level observation, not certification of every URL.
export const PROVIDERS: ProviderIntegration[] = [
  {
    id: "netflix",
    name: "Netflix",
    monogram: "N",
    color: "#ff7d83",
    homepage: "https://www.netflix.com/",
    titlePath: /^\/title\/\d+\/?$/,
    contentId: /^\/title\/(\d+)/,
    navigation: "new-tab",
    iosCapability: "nativeExact",
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms native exact-title opening on iOS. Individual title, app/OS versions, and iPad coverage still need records.",
  },
  {
    id: "disney",
    name: "Disney+",
    monogram: "D+",
    color: "#88bdff",
    homepage: "https://www.disneyplus.com/",
    titlePath: /^\/browse\/entity-[a-f0-9-]{36}\/?$/,
    contentId: /^\/browse\/entity-([a-f0-9-]{36})/,
    navigation: "new-tab",
    iosCapability: "nativeExact",
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms native exact-title opening on iOS. Keep the working URL and navigation; individual-title records remain pending.",
  },
  {
    id: "hulu",
    name: "Hulu",
    monogram: "hulu",
    color: "#5ceaa1",
    homepage: "https://www.hulu.com/",
    titlePath: /^\/(series|movie)\/[^/]+\/?$/,
    contentId:
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/?$/,
    navigation: "new-tab",
    iosCapability: "nativeExact",
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms native exact-title opening on iOS. Preserve the observed episodes query on Only Murders; per-title/login behavior remains to record.",
  },
  {
    id: "prime",
    name: "Prime Video",
    monogram: "prime",
    color: "#7ed6ff",
    homepage: "https://www.primevideo.com/",
    titlePath: /^\/detail\/[A-Z0-9]+\/?$/,
    contentId: /^\/detail\/([A-Z0-9]+)/,
    navigation: "same-tab",
    iosCapability: "webExact",
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms the correct web title, not native handoff. Direct same-tab HTTPS navigation is a testable handoff experiment; no verified custom scheme or alternate app route was found.",
  },
  {
    id: "paramount",
    name: "Paramount+",
    monogram: "P+",
    color: "#8bacff",
    homepage: "https://www.paramountplus.com/",
    titlePath: /^\/(shows\/[^/]+|movies\/video\/[^/]+)\/?$/,
    contentId: /^\/(?:shows|movies\/video)\/([^/]+)/,
    navigation: "same-tab",
    iosCapability: "webExact",
    iosEvidence: "pending",
    iosNotes:
      "Official full-series/movie pages checked in a browser. Native movie and series routing both require physical-device testing.",
  },
  {
    id: "peacock",
    name: "Peacock",
    monogram: "P",
    color: "#edcf77",
    homepage: "https://www.peacocktv.com/",
    titlePath:
      /^\/watch-online\/(tv|movies)\/[^/]+\/(?:\d+|[a-f0-9-]{36})(?:\/seasons\/\d+)?\/?$/,
    contentId: /^\/watch-online\/(?:tv|movies)\/[^/]+\/([^/]+)/,
    navigation: "same-tab",
    iosCapability: "webExact",
    iosEvidence: "pending",
    iosNotes:
      "Official title/season HTTPS pages checked. No exact native iOS route has been verified; use the same safe web destination until device results arrive.",
  },
];

export function providerById(id: ProviderId): ProviderIntegration {
  const provider = PROVIDERS.find((provider) => provider.id === id);
  if (!provider) throw new Error("Unsupported provider");
  return provider;
}

export class PrototypeLauncher implements ProviderLauncher {
  private readonly links: readonly TitlePageLink[];
  constructor(links: readonly TitlePageLink[] = TITLE_PAGE_LINKS) {
    this.links = links;
  }

  resolve(offer: Offer, platform: LaunchPlatform = "web"): LaunchTarget {
    const provider = PROVIDERS.find(
      (provider) => provider.id === offer.providerId,
    );
    if (!provider)
      return {
        url: null,
        fallbackUrl: null,
        expectedCapability: "unsupported",
        fallbackCapability: "unsupported",
        exactTitleResolved: false,
        providerContentId: null,
        navigation: "same-tab",
        evidence: "none",
        requiresDeviceVerification: true,
        explanation: "No supported provider integration is known.",
      };

    const link = this.links.find(
      (link) =>
        link.titleId === offer.titleId && link.providerId === offer.providerId,
    );
    let url: URL | null = null;
    if (link) {
      try {
        const candidate = new URL(link.url);
        if (
          candidate.origin === new URL(provider.homepage).origin &&
          candidate.protocol === "https:" &&
          !candidate.username &&
          !candidate.password &&
          provider.titlePath.test(candidate.pathname)
        )
          url = candidate;
      } catch {
        /* Malformed mappings fail closed to the known provider homepage. */
      }
    }
    if (!link || !url)
      return {
        url: provider.homepage,
        fallbackUrl: provider.homepage,
        expectedCapability: "providerHome",
        fallbackCapability: "providerHome",
        exactTitleResolved: false,
        providerContentId: null,
        navigation: provider.navigation,
        evidence: "none",
        requiresDeviceVerification: true,
        explanation:
          "No checked title destination exists for this provider offer. Its homepage is a fallback, not an exact-title launch.",
      };

    return {
      // Keep the checked URL verbatim, including provider-significant query strings.
      url: link.url,
      fallbackUrl: link.url,
      expectedCapability:
        platform === "ios" ? provider.iosCapability : "webExact",
      fallbackCapability: "webExact",
      exactTitleResolved: true,
      providerContentId: url.pathname.match(provider.contentId)?.[1] ?? null,
      navigation: provider.navigation,
      evidence:
        platform === "ios" && provider.iosEvidence === "user-reported"
          ? "user-reported-provider"
          : "official-web-page",
      requiresDeviceVerification: true,
      explanation:
        platform === "ios"
          ? provider.iosNotes
          : "Opens the checked provider title page. The provider and device decide app versus browser; sign-in, region, and plan restrictions may apply.",
    };
  }
}
