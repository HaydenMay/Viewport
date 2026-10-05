export type ProviderId = "disney" | "hulu" | "netflix" | "prime" | "max";
export type AgeLevel = 0 | 1 | 2 | 3;
export type ContentTopic =
  | "horror"
  | "scary"
  | "violence"
  | "sexual"
  | "language";
export type SeasonalTopic = "halloween" | "christmas";
export interface Title {
  id: string;
  name: string;
  year: number;
  kind: "Movie" | "Series";
  rating: string;
  ageLevel: AgeLevel | null;
  genres: string[];
  summary: string;
  duration: string;
  providerIds: ProviderId[];
  topics: ContentTopic[];
  seasonal: SeasonalTopic[];
  artworkRisk: "neutral" | "disturbing" | "seasonal" | "unknown";
  art: string;
  palette: [string, string];
}
export interface Preferences {
  providerIds: ProviderId[];
  hideHorror: boolean;
  hideSeasonal: boolean;
  hideDisturbingArtwork: boolean;
  maxAgeLevel: AgeLevel;
  allowUnrated: boolean;
  blockedTopics: ContentTopic[];
}
export interface CatalogSource {
  list(): Promise<Title[]>;
}
export interface Offer {
  titleId: string;
  providerId: ProviderId;
  region: "US";
  access: "subscription";
  provenance: "prototype";
}
export interface AvailabilitySource {
  offersFor(titleId: string): Promise<Offer[]>;
}
export interface LaunchTarget {
  url: string;
  scope: "provider-homepage" | "provider-title-page";
  nativeTitleVerified: false;
  explanation: string;
}
export interface ProviderLauncher {
  resolve(offer: Offer): LaunchTarget;
}
