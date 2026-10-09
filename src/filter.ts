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

type HiddenReason = "maturity" | "unknownRating" | "horror" | "seasonal" | "content";
function hiddenReason(title: Title, preferences: Preferences, searching: boolean): HiddenReason | null {
  if (preferences.maxAgeLevel !== null) {
    if (title.ageLevel === null) return "unknownRating";
    if (title.ageLevel > preferences.maxAgeLevel) return "maturity";
  }
  if (!searching) {
    if (preferences.hideHorror && title.topics.some(x => x === "horror" || x === "scary")) return "horror";
    if (preferences.hideSeasonal && title.seasonal.length) return "seasonal";
    if (title.topics.some(x => preferences.blockedTopics.includes(x))) return "content";
  }
  return null;
}
function scopedMatch(title: Title, preferences: Preferences, search: string, provider: ProviderId | null): boolean {
  return title.providerIds.some(id => preferences.providerIds.includes(id)) &&
    (!provider || (preferences.providerIds.includes(provider) && title.providerIds.includes(provider))) &&
    (!search || (Array.from(search).length === 1 ? normalize(title.name).startsWith(search) : normalize(title.name).includes(search)));
}
// Aggregate-only feedback: names, identifiers and artwork of restricted matches
// never leave the filtering layer. Each hidden title gets one reason, with maturity first.
export function explainFiltering(titles: Title[], preferences: Preferences, query = "", provider: ProviderId | null = null) {
  const search = normalize(query);
  const report = { matching: 0, showing: 0, hidden: { maturity: 0, unknownRating: 0, horror: 0, seasonal: 0, content: 0 } };
  for (const title of titles) {
    if (!scopedMatch(title, preferences, search, provider)) continue;
    report.matching++;
    const reason = hiddenReason(title, preferences, !!search);
    if (reason) report.hidden[reason]++; else report.showing++;
  }
  return report;
}

export function filterTitles(
  titles: Title[], preferences: Preferences, query = "", provider: ProviderId | null = null,
): Title[] {
  const search = normalize(query);
  const matches = titles.filter(title => scopedMatch(title, preferences, search, provider) && !hiddenReason(title, preferences, !!search));
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
