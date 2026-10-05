import type {
  LaunchPlatform,
  LaunchTarget,
  Offer,
  Preferences,
  Title,
} from "./domain.ts";
import { shouldReplaceArtwork } from "./filter.ts";
import { providerById } from "./providers.ts";

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

// Rendered only when explicitly requested with ?debug=links. The launch resolver
// supplies every provider-specific decision; normal cards/details stay unchanged.
export function launchDiagnostics(
  title: Title,
  offer: Offer,
  target: LaunchTarget,
  platform: LaunchPlatform,
): string {
  const fields = [
    ["Title", `${title.name} (${title.year})`],
    ["Provider", providerById(offer.providerId).name],
    [
      "Platform expectation",
      platform === "ios" ? "iOS / iPadOS candidate" : "Web",
    ],
    ["Launch URL", target.url ?? "None"],
    ["Provider content ID", target.providerContentId ?? "Not mapped"],
    ["TMDB ID", "Not imported; prototype fixture"],
    ["Expected capability", target.expectedCapability],
    ["Evidence", target.evidence],
    ["Web fallback", target.fallbackUrl ?? "None"],
    ["Navigation", target.navigation],
    [
      "Physical verification needed",
      target.requiresDeviceVerification
        ? "Yes — individual-title/device record pending"
        : "No",
    ],
    ["Notes", target.explanation],
    ...(target.appCandidate ? [
      ["App candidate URL", target.appCandidate.url],
      ["Candidate evidence", target.appCandidate.evidence],
      ["Candidate verification", "Pending physical-device test; native success is not claimed"],
      ["Candidate notes", target.appCandidate.explanation],
    ] : []),
  ];
  const probe = target.appCandidate ? `<p>Experimental app link. If it fails, return here and use the working Watch action.</p><a class="button-secondary" data-app-probe href="${escapeHtml(target.appCandidate.url)}" target="_self">Try app link · ${escapeHtml(providerById(offer.providerId).name)}</a>` : "";
  return `<details class="launch-diagnostics"><summary>Link diagnostics · ${escapeHtml(providerById(offer.providerId).name)}</summary>${probe}<dl>${fields.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>${target.fallbackUrl ? `<a class="text-button" data-web-fallback href="${escapeHtml(target.fallbackUrl)}" target="_blank" rel="noopener noreferrer">Open fallback provider page</a>` : ""}</details>`;
}
export const icon = (
  name:
    | "search"
    | "sliders"
    | "close"
    | "arrow"
    | "play"
    | "shield"
    | "check"
    | "leaf"
    | "eye"
    | "home",
) => {
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    sliders:
      '<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    play: '<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
    shield:
      '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    leaf: '<path d="M20 4C9 2 2 10 6 16c6 6 14-1 14-12Z"/><path d="m5 19 10-10"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
  };
  return `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

export function cover(
  title: Title,
  preferences: Preferences,
  className = "",
): string {
  const replacement = shouldReplaceArtwork(title, preferences);
  const name = escapeHtml(title.name);
  return `<div class="cover ${className} ${replacement ? "cover-neutral" : ""}" style="--cover-a:${title.palette[0]};--cover-b:${title.palette[1]}">
    ${replacement ? '<div class="neutral-orbit"></div>' : `<img src="./artwork/${title.id}.svg" alt="" loading="lazy" width="600" height="900" />`}
    <span class="cover-kind">${title.kind}</span>
    ${replacement ? `<span class="neutral-label">${icon("eye")} Neutral artwork</span>` : ""}
    <div class="cover-title ${title.name.length > 18 ? "title-long" : ""}">${name}</div>
  </div>`;
}

export function titleCard(title: Title, preferences: Preferences): string {
  const providers = title.providerIds.filter((id) =>
    preferences.providerIds.includes(id),
  );
  return `<button class="title-card" data-title="${title.id}" aria-label="View details for ${escapeHtml(title.name)}">
    ${cover(title, preferences)}
    <span class="card-metadata"><span>${title.year} <span class="dot">·</span> ${title.rating}</span><span class="card-provider" style="color:${providerById(providers[0]).color}">${escapeHtml(providerById(providers[0]).name)}${providers.length > 1 ? " +1" : ""}</span></span>
  </button>`;
}

export function feature(title: Title, preferences: Preferences): string {
  const replacement = shouldReplaceArtwork(title, preferences);
  return `<article class="feature" style="--feature-a:${title.palette[0]}">
    <div class="feature-art ${replacement ? "feature-neutral" : ""}" aria-hidden="true">${replacement ? '<div class="feature-orbit"></div>' : `<img src="./artwork/${title.id}.svg" alt="" width="600" height="900" />`}</div>
    <div class="feature-copy">
      <span class="eyebrow">FROM YOUR CATALOG</span>
      <h2>${escapeHtml(title.name)}</h2>
      <p class="feature-meta">${title.year}<span>·</span>${title.rating}<span>·</span>${title.duration}<span>·</span>${title.genres[0]}</p>
      <p class="feature-summary">${escapeHtml(title.summary)}</p>
      <button class="button-primary" data-title="${title.id}">${icon("play")} Explore title</button>
    </div>
    <span class="illustration-note">Original illustration${replacement ? " · neutral artwork" : ""}</span>
  </article>`;
}

export function switchControl(
  key: "hideHorror" | "hideSeasonal" | "hideDisturbingArtwork",
  title: string,
  subtitle: string,
  preferences: Preferences,
): string {
  return `<label class="switch-control"><span class="switch-copy"><span>${title}</span><small>${subtitle}</small></span><input type="checkbox" role="switch" data-preference="${key}" ${preferences[key] ? "checked" : ""} /><span class="switch-track" aria-hidden="true"></span></label>`;
}

export const maturityOptions = `<option value="3">All rated titles</option><option value="2">Up to PG-13 / TV-14</option><option value="1">Up to PG / TV-PG</option><option value="0">G / TV-G only</option>`;
