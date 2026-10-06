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
  appCandidatePath?: { from: string; to: string };
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
      "User retested: correct web title, no native handoff. Prime's published iOS association covers /detail/. Copy this link to Apple Notes and long-press it: whether Open in Prime Video appears distinguishes device routing preference from unavailable association. An alternate app hostname led to an install page, so it was rejected.",
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
    iosCapability: "nativeExact",
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms Paramount+ opens the selected title in its native iOS app. Individual title, movie/series paths, and app/OS versions still need records.",
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
    iosEvidence: "user-reported",
    iosNotes:
      "User confirms the correct web title, not native handoff. Peacock's association covers /watch/*, not this /watch-online/ path. The opt-in app candidate comes from this title's official Sign In return destination; native exact-title behavior still needs testing.",
    appCandidatePath: { from: "/watch-online/", to: "/watch/asset/" },
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

    let appCandidate: LaunchTarget["appCandidate"];
    if (platform === "ios" && link.appCandidateUrl && provider.appCandidatePath) {
      try {
        const candidate = new URL(link.appCandidateUrl);
        const { from, to } = provider.appCandidatePath;
        if (
          candidate.origin === url.origin &&
          !candidate.username && !candidate.password &&
          url.pathname.startsWith(from) &&
          candidate.pathname === to + url.pathname.slice(from.length) &&
          candidate.search === url.search && candidate.hash === url.hash
        ) {
          appCandidate = {
            url: link.appCandidateUrl,
            evidence: "provider-navigation-and-association",
            requiresDeviceVerification: true,
            explanation: "Official title navigation supplies this /watch/asset/ destination, and the provider's iOS association includes /watch/*. This supports a test candidate, not a verified native result. If it fails, return to Viewport and use the original Watch action or web fallback.",
          };
        }
      } catch {
        // A rejected probe never changes the working title destination.
      }
    }

    return {
      // Keep the checked URL verbatim, including provider-significant query strings.
      url: link.url,
      fallbackUrl: link.url,
      expectedCapability:
        platform === "ios" && link.evidence !== "availability-api" ? provider.iosCapability : "webExact",
      fallbackCapability: "webExact",
      exactTitleResolved: true,
      providerContentId: url.pathname.match(provider.contentId)?.[1] ?? null,
      navigation: provider.navigation,
      evidence:
        link.evidence === "availability-api" ? "availability-api" : platform === "ios" && provider.iosEvidence === "user-reported"
          ? "user-reported-provider"
          : "official-web-page",
      requiresDeviceVerification: true,
      explanation:
        link.evidence === "availability-api" ? "Availability source supplied this title URL. Its shape is accepted, but exact identity and native routing require a device test." : platform === "ios"
          ? provider.iosNotes
          : "Opens the checked provider title page. The provider and device decide app versus browser; sign-in, region, and plan restrictions may apply.",
      ...(appCandidate ? { appCandidate } : {}),
    };
  }
}
