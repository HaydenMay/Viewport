import type { Preferences, ProviderId, Title } from "./domain.ts";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export function hiddenByContentPreferences(title: Title, preferences: Preferences): boolean {
  return (preferences.hideHorror && title.topics.some(topic => topic === "horror" || topic === "scary")) ||
    (preferences.hideSeasonal && title.seasonal.length > 0) ||
    title.topics.some(topic => preferences.blockedTopics.includes(topic));
}

export function filterTitles(
  titles: Title[], preferences: Preferences, query = "", provider: ProviderId | null = null,
): Title[] {
  const search = normalize(query);
  const matches = titles.filter(title => {
    if (!title.providerIds.some(id => preferences.providerIds.includes(id))) return false;
    if (provider && (!preferences.providerIds.includes(provider) || !title.providerIds.includes(provider))) return false;
    // A selected maturity ceiling is a hard restriction, including during search.
    // Legacy allowUnrated values cannot bypass it.
    if (preferences.maxAgeLevel !== null && (title.ageLevel === null || title.ageLevel > preferences.maxAgeLevel)) return false;
    if (!search && hiddenByContentPreferences(title, preferences)) return false;
    return !search || normalize([title.name, ...title.genres, title.summary].join(" ")).includes(search);
  });
  const rank = (title: Title) => {
    const name = normalize(title.name);
    return name === search ? 0 : name.startsWith(search) ? 1 : name.includes(search) ? 2 : 3;
  };
  return search ? matches.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)) : matches;
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
