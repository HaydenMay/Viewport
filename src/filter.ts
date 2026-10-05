import type { Preferences, ProviderId, Title } from "./domain.ts";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export function filterTitles(
  titles: Title[],
  preferences: Preferences,
  query = "",
  provider: ProviderId | null = null,
): Title[] {
  const search = normalize(query);
  return titles.filter((title) => {
    if (!title.providerIds.some((id) => preferences.providerIds.includes(id)))
      return false;
    if (
      provider &&
      (!preferences.providerIds.includes(provider) ||
        !title.providerIds.includes(provider))
    )
      return false;
    if (
      preferences.hideHorror &&
      title.topics.some((topic) => topic === "horror" || topic === "scary")
    )
      return false;
    if (preferences.hideSeasonal && title.seasonal.length > 0) return false;
    if (
      title.ageLevel === null
        ? !preferences.allowUnrated
        : title.ageLevel > preferences.maxAgeLevel
    )
      return false;
    if (title.topics.some((topic) => preferences.blockedTopics.includes(topic)))
      return false;
    return (
      !search ||
      normalize(
        [title.name, ...title.genres, title.summary].join(" "),
      ).includes(search)
    );
  });
}
export function shouldReplaceArtwork(
  title: Title,
  preferences: Preferences,
): boolean {
  return (
    (preferences.hideDisturbingArtwork &&
      (title.artworkRisk === "disturbing" ||
        title.artworkRisk === "unknown")) ||
    (preferences.hideSeasonal && title.artworkRisk === "seasonal")
  );
}
