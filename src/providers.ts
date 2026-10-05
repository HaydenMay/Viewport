import type {
  Offer,
  ProviderId,
  ProviderLauncher,
  LaunchTarget,
} from "./domain.ts";

export const PROVIDERS: {
  id: ProviderId;
  name: string;
  monogram: string;
  color: string;
  homepage: string;
}[] = [
  {
    id: "disney",
    name: "Disney+",
    monogram: "D+",
    color: "#88bdff",
    homepage: "https://www.disneyplus.com/",
  },
  {
    id: "hulu",
    name: "Hulu",
    monogram: "hulu",
    color: "#5ceaa1",
    homepage: "https://www.hulu.com/",
  },
  {
    id: "netflix",
    name: "Netflix",
    monogram: "N",
    color: "#ff7d83",
    homepage: "https://www.netflix.com/",
  },
  {
    id: "prime",
    name: "Prime Video",
    monogram: "prime",
    color: "#7ed6ff",
    homepage: "https://www.primevideo.com/",
  },
  {
    id: "max",
    name: "Max",
    monogram: "max",
    color: "#b1a3ff",
    homepage: "https://www.hbomax.com/",
  },
];
export function providerById(id: ProviderId) {
  const provider = PROVIDERS.find((provider) => provider.id === id);
  if (!provider) throw new Error("Unsupported provider");
  return provider;
}
export class HomepageLauncher implements ProviderLauncher {
  resolve(offer: Offer): LaunchTarget {
    return {
      url: providerById(offer.providerId).homepage,
      scope: "provider-homepage",
      nativeTitleVerified: false,
      explanation:
        "Opens the provider website. Search for the title there; exact-title native app launching has not been verified.",
    };
  }
}
