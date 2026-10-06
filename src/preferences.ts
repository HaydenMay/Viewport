import type { Preferences } from "./domain.ts";

export const PREFERENCE_KEY = "viewport.preferences.v1";
export function defaultPreferences(): Preferences {
  return {
    providerIds: ["disney", "hulu", "netflix", "paramount"],
    hideHorror: true,
    hideSeasonal: true,
    hideDisturbingArtwork: true,
    maxAgeLevel: 3,
    allowUnrated: false,
    blockedTopics: [],
  };
}
const providerIds = [
  "disney",
  "hulu",
  "netflix",
  "prime",
  "peacock",
  "paramount",
] as const;
const topics = ["horror", "scary", "violence", "sexual", "language"] as const;

export function parsePreferences(raw: string | null): Preferences {
  const defaults = defaultPreferences();
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    if (
      !data ||
      typeof data !== "object" ||
      !("version" in data) ||
      data.version !== 1 ||
      !("preferences" in data)
    )
      return defaults;
    const value = data.preferences;
    if (!value || typeof value !== "object" || Array.isArray(value))
      return defaults;
    const p = value as Record<string, unknown>;
    const bool = (key: keyof Preferences, fallback: boolean) =>
      typeof p[key] === "boolean" ? (p[key] as boolean) : fallback;
    return {
      providerIds: Array.isArray(p.providerIds)
        ? providerIds.filter((id) => (p.providerIds as unknown[]).includes(id))
        : defaults.providerIds,
      hideHorror: bool("hideHorror", defaults.hideHorror),
      hideSeasonal: bool("hideSeasonal", defaults.hideSeasonal),
      hideDisturbingArtwork: bool(
        "hideDisturbingArtwork",
        defaults.hideDisturbingArtwork,
      ),
      allowUnrated: bool("allowUnrated", defaults.allowUnrated),
      maxAgeLevel: p.maxAgeLevel === null || [0, 1, 2, 3].includes(p.maxAgeLevel as number)
        ? (p.maxAgeLevel as Preferences["maxAgeLevel"])
        : defaults.maxAgeLevel,
      blockedTopics: Array.isArray(p.blockedTopics)
        ? topics.filter((topic) =>
            (p.blockedTopics as unknown[]).includes(topic),
          )
        : defaults.blockedTopics,
    };
  } catch {
    return defaults;
  }
}
export function savePreferences(
  storage: Pick<Storage, "setItem">,
  preferences: Preferences,
): boolean {
  try {
    storage.setItem(
      PREFERENCE_KEY,
      JSON.stringify({ version: 1, preferences }),
    );
    return true;
  } catch {
    return false;
  }
}
