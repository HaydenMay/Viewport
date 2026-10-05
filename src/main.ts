import "./styles.css";
import type {
  AgeLevel,
  LaunchPlatform,
  ContentTopic,
  Offer,
  Preferences,
  ProviderId,
  Title,
} from "./domain.ts";
import { PrototypeAvailability, PrototypeCatalog } from "./catalog.ts";
import { filterTitles, shouldReplaceArtwork } from "./filter.ts";
import { loadLaunchableCatalog, titleLinkedOffers } from "./discovery.ts";
import {
  defaultPreferences,
  parsePreferences,
  PREFERENCE_KEY,
  savePreferences,
} from "./preferences.ts";
import { PrototypeLauncher, PROVIDERS, providerById } from "./providers.ts";
import {
  cover,
  escapeHtml,
  feature,
  icon,
  launchDiagnostics,
  maturityOptions,
  switchControl,
  titleCard,
} from "./ui.ts";

const catalogSource = new PrototypeCatalog();
const availabilitySource = new PrototypeAvailability();
const launcher = new PrototypeLauncher();
const debugLinks =
  new URLSearchParams(location.search).get("debug") === "links";
const diagnosticPlatform: LaunchPlatform =
  new URLSearchParams(location.search).get("platform") === "web"
    ? "web"
    : "ios";
let preferences: Preferences;
let storageAvailable = true;
try {
  preferences = parsePreferences(localStorage.getItem(PREFERENCE_KEY));
} catch {
  preferences = defaultPreferences();
  storageAvailable = false;
}
let titles: Title[] = [];
let query = "";
let providerScope: ProviderId | null = null;
let openTitleId: string | null = null;
let detailRequest = 0;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <a class="skip-link" href="#catalog">Skip to catalog</a>
  <header class="site-header"><div class="header-inner">
    <button class="wordmark" data-home aria-label="Viewport Home"><img src="./favicon.svg" alt="" width="36" height="36" />Viewport<span class="wordmark-dot">.</span></button>
    <nav aria-label="Main navigation"><button class="nav-home" data-home aria-current="page">Home</button></nav>
    <div class="header-actions"><label class="search"><span class="sr-only">Search titles, genres, or descriptions</span>${icon("search")}<input id="search" type="search" placeholder="Search your catalog" autocomplete="off" /><kbd aria-hidden="true">/</kbd></label>
    <button class="preferences-button" data-open-preferences aria-label="Preferences">${icon("sliders")}<span>Preferences</span></button></div>
  </div></header>
  <main class="main-shell">
    <div class="catalog-heading"><div><span class="eyebrow subtle">YOUR STREAMING, TOGETHER</span><h1>Your catalog</h1><p id="service-summary">Loading your catalog…</p></div><button class="prototype-badge" data-open-about><span></span>Prototype 1.6</button></div>
    <div class="services-bar"><div id="provider-tabs" class="provider-tabs" role="group" aria-label="Browse by streaming service"></div><button class="text-button manage-services" data-open-preferences>Manage services ${icon("arrow")}</button></div>
    <section class="quick-filters" aria-label="Household content controls">
      <div class="filter-intro">${icon("shield")}<span>Your house.<br /><strong>Your rules.</strong></span></div>
      ${switchControl("hideHorror", "Hide Horror", "Horror & scary themes", preferences)}
      ${switchControl("hideSeasonal", "Hide Halloween / seasonal", "Halloween & other holidays", preferences)}
      <label class="maturity-control"><span>Maturity limit</span><select data-maturity aria-label="Maturity limit">${maturityOptions}</select></label>
    </section>
    <p class="save-status" id="save-status" role="status"></p>
    <div id="feature"></div>
    <section id="catalog" class="catalog-section" aria-labelledby="results-heading" tabindex="-1">
      <div class="results-heading"><div><h2 id="results-heading">Across your services</h2><p id="results-count" aria-live="polite" aria-atomic="true"></p></div><span class="catalog-order">Handpicked sample catalog</span></div>
      <div id="title-grid" class="title-grid"></div>
    </section>
    <footer><span class="footer-wordmark">Viewport<span>.</span></span><p><span id="catalog-size"></span> linked sample titles · Illustrative US availability & content annotations · Original artwork</p><button class="text-button" data-open-about>About this prototype ${icon("arrow")}</button></footer>
  </main>
  <dialog id="preferences-dialog" class="preferences-dialog" aria-labelledby="preferences-title"><div class="dialog-top"><div><span class="eyebrow subtle">SET YOUR PREFERENCES</span><h2 id="preferences-title">Make it your catalog</h2></div><button class="icon-button" data-close="preferences-dialog" aria-label="Close preferences">${icon("close")}</button></div><div id="preferences-body"></div><div class="dialog-bottom"><span>Changes apply immediately.</span><button class="button-primary" data-close="preferences-dialog">Back to browsing ${icon("arrow")}</button></div></dialog>
  <dialog id="details-dialog" class="details-dialog" aria-labelledby="details-title"><div id="details-body"></div></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-top"><h2 id="about-title">A catalog you control</h2><button class="icon-button" data-close="about-dialog" aria-label="Close prototype information">${icon("close")}</button></div><div class="about-content"><p>Viewport brings your services into one place, with household preferences that decide what appears. It is for everyone, with controls you can adjust.</p><h3>What you’re trying</h3><p>Search, service selection, content filters, title details, and preferences saved on this browser. The real title names are demonstration examples. Summaries and illustrations are original.</p><h3>Sample data, clearly labeled</h3><p>Provider availability, ratings, and safety annotations are illustrative, manually entered prototype data. They are not verified current US availability or comprehensive content guidance. Promotional-art annotations describe a hypothetical promotion; these drawings are not official posters.</p><h3>What happens when you watch</h3><p>Only titles with a checked, title-specific destination on a selected service appear. “Watch on” opens that provider’s title page. Your device may open the app or browser; native routing depends on the provider and platform and has not been certified. Sign-in, region, and plan restrictions may affect the result. The V1 services are Netflix, Disney+, Hulu, Prime Video, Paramount+, and Peacock. Native opening is reported working for Netflix, Disney+, Hulu, and Paramount+; Prime and Peacock currently open the correct web title.</p><h3>Household controls</h3><p>Your choices apply to this browser only. They do not change provider recommendations or profiles after you leave Viewport, and are not protected by a PIN. Neutral artwork can replace an image without hiding its title.</p><p class="muted">Viewport is a working name. No streaming services are affiliated with this prototype.</p></div></dialog>`;

const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const visibleTitles = () =>
  filterTitles(titles, preferences, query, providerScope);
const dialog = (id: string) => byId<HTMLDialogElement>(id);

function updateSaveStatus(): void {
  byId("save-status").textContent = storageAvailable
    ? ""
    : "Preferences work for this visit, but this browser could not save them.";
}
function persist(): void {
  try {
    storageAvailable = savePreferences(localStorage, preferences);
  } catch {
    storageAvailable = false;
  }
  updateSaveStatus();
}
function syncControls(): void {
  document
    .querySelectorAll<HTMLInputElement>("[data-preference]")
    .forEach((input) => {
      input.checked =
        preferences[
          input.dataset.preference as
            | "hideHorror"
            | "hideSeasonal"
            | "hideDisturbingArtwork"
        ];
    });
  document
    .querySelectorAll<HTMLSelectElement>("[data-maturity]")
    .forEach((select) => {
      select.value = String(preferences.maxAgeLevel);
    });
}
function renderProviders(): void {
  if (providerScope && !preferences.providerIds.includes(providerScope))
    providerScope = null;
  byId("provider-tabs").innerHTML =
    `<button class="provider-tab all-services ${providerScope === null ? "selected" : ""}" data-provider="all" aria-pressed="${providerScope === null}">${icon("home")}All my services</button>` +
    PROVIDERS.filter((provider) =>
      preferences.providerIds.includes(provider.id),
    )
      .map(
        (provider) =>
          `<button class="provider-tab ${providerScope === provider.id ? "selected" : ""}" data-provider="${provider.id}" aria-pressed="${providerScope === provider.id}" style="--provider-color:${provider.color}"><span class="provider-dot"></span>${provider.name}</button>`,
      )
      .join("");
  const count = preferences.providerIds.length;
  byId("service-summary").textContent = count
    ? `One place to browse your ${count} streaming service${count === 1 ? "" : "s"}.`
    : "Choose your streaming services to start browsing.";
}
function renderCatalog(): void {
  const visible = visibleTitles();
  const contentAllowed = filterTitles(titles, preferences, "", providerScope);
  const subscribed = titles.filter((title) =>
    title.providerIds.some(
      (id) =>
        preferences.providerIds.includes(id) &&
        (!providerScope || id === providerScope),
    ),
  );
  const hidden = subscribed.length - contentAllowed.length;
  const noLinks = preferences.providerIds.length > 0 && subscribed.length === 0;
  const emptyTitle = !preferences.providerIds.length
    ? "Which services do you watch?"
    : noLinks
      ? "Title links are still being checked"
      : "Nothing matches these choices";
  const emptyDescription = !preferences.providerIds.length
    ? "Choose the services you subscribe to and build your combined catalog."
    : noLinks
      ? `No checked title destinations are available for ${providerScope ? providerById(providerScope).name : "your selected services"} yet. Browse another selected service or choose one in Preferences.`
      : "Try a different search or adjust your content preferences.";
  byId("results-heading").textContent = query.trim()
    ? "Search results"
    : providerScope
      ? `On ${providerById(providerScope).name}`
      : "Across your services";
  byId("results-count").textContent =
    `${visible.length} title${visible.length === 1 ? "" : "s"} showing${hidden ? ` · ${hidden} hidden by your content preferences` : ""}`;
  byId("feature").innerHTML =
    visible.length && !query.trim() ? feature(visible[0], preferences) : "";
  byId("title-grid").innerHTML = visible.length
    ? visible.map((title) => titleCard(title, preferences)).join("")
    : `<div class="empty-state">${icon(preferences.providerIds.length ? "search" : "sliders")}<h3>${emptyTitle}</h3><p>${escapeHtml(emptyDescription)}</p><div>${query ? '<button class="button-secondary" data-clear-search>Clear search</button>' : ""}<button class="button-primary" data-open-preferences>${preferences.providerIds.length ? "Adjust preferences" : "Choose services"}</button></div></div>`;
  if (openTitleId) {
    const title = visible.find((title) => title.id === openTitleId);
    if (!title) {
      dialog("details-dialog").close();
      openTitleId = null;
      detailRequest++;
    } else if (dialog("details-dialog").open) void showDetails(title, false);
  }
}
function renderPreferences(): void {
  byId("preferences-body").innerHTML =
    `<section class="preference-section"><h3>Your streaming services</h3><p>Select the subscriptions you want to browse. Only titles with checked title links appear.</p><div class="service-choices">${PROVIDERS.map((provider) => `<label class="service-choice"><input type="checkbox" data-service="${provider.id}" ${preferences.providerIds.includes(provider.id) ? "checked" : ""}/><span class="service-monogram" style="color:${provider.color}">${provider.monogram}</span><span>${provider.name}</span>${icon("check")}</label>`).join("")}</div></section>
    <section class="preference-section"><h3>Content you see</h3><p>Titles disappear as soon as a preference excludes them.</p><div class="preference-switches">${switchControl("hideHorror", "Hide Horror", "Includes scary themes in the sample annotations", preferences)}${switchControl("hideSeasonal", "Hide Halloween / seasonal", "Halloween and other holiday-themed titles", preferences)}</div><label class="pref-maturity"><span>Maturity limit</span><select data-maturity>${maturityOptions}</select></label><label class="plain-check"><input type="checkbox" data-unrated ${preferences.allowUnrated ? "checked" : ""}/><span>Include titles with an unknown rating</span></label><h4>Also hide titles with</h4><div class="topic-choices">${(["violence", "sexual", "language"] as ContentTopic[]).map((topic) => `<label class="plain-check"><input type="checkbox" data-topic="${topic}" ${preferences.blockedTopics.includes(topic) ? "checked" : ""}/><span>${{ violence: "Violence", sexual: "Sexual content", language: "Strong language", horror: "Horror", scary: "Scary themes" }[topic]}</span></label>`).join("")}</div></section>
    <section class="preference-section artwork-preferences"><h3>Artwork is a separate choice</h3><p>Keep an acceptable title in your catalog while replacing a disturbing or unreviewed promotion with neutral artwork.</p>${switchControl("hideDisturbingArtwork", "Use neutral artwork", "Replace disturbing or unknown promotional images", preferences)}<p class="annotation-note">Try The Mandalorian with this on and off. Its promotional-art flag is a hypothetical sample; no official poster is shown.</p></section><p class="preference-note">Sample annotations demonstrate the controls, not a complete content advisory. Preferences stay on this browser and do not change the provider’s own screens.</p>`;
  syncControls();
}
async function showDetails(title: Title, open = true): Promise<void> {
  const request = ++detailRequest;
  const offers = await availabilitySource.offersFor(title.id);
  if (
    request !== detailRequest ||
    !visibleTitles().some((candidate) => candidate.id === title.id)
  )
    return;
  const subscribedOffers = titleLinkedOffers(offers, launcher).filter((offer) =>
    preferences.providerIds.includes(offer.providerId),
  );
  const tags = [
    ...title.topics.map(
      (topic) =>
        ({
          horror: "Horror",
          scary: "Scary themes",
          violence: "Violence",
          sexual: "Sexual content",
          language: "Strong language",
        })[topic],
    ),
    ...title.seasonal.map((topic) =>
      topic === "halloween" ? "Halloween" : "Christmas",
    ),
  ];
  byId("details-body").innerHTML =
    `<button class="icon-button detail-close" data-close="details-dialog" aria-label="Close title details">${icon("close")}</button><div class="detail-layout">${cover(title, preferences, "detail-cover")}<div class="detail-copy"><span class="eyebrow subtle">${title.kind.toUpperCase()} · SAMPLE METADATA</span><h2 id="details-title">${escapeHtml(title.name)}</h2><p class="detail-meta">${title.year} <span>·</span> ${title.rating} <span>·</span> ${title.duration}</p><p class="genre-line">${title.genres.join(" · ")}</p><p class="detail-summary">${escapeHtml(title.summary)}</p><div class="annotation-block"><h3>Sample content notes</h3><div class="content-tags">${tags.length ? tags.map((tag) => `<span>${tag}</span>`).join("") : "<span>No selected sample flags</span>"}</div><p>Illustrative annotations, not a complete content review.</p>${shouldReplaceArtwork(title, preferences) ? `<p class="art-notice">${icon("eye")} Neutral artwork applied. The title stays available.</p>` : ""}</div><div class="watch-block"><h3>Watch with your services</h3><p>Sample US subscription availability</p><div class="watch-actions">${subscribedOffers.map(watchAction).join("")}${debugLinks ? subscribedOffers.map((offer) => launchDiagnostics(title, offer, launcher.resolve(offer, diagnosticPlatform), diagnosticPlatform)).join("") : ""}</div><div class="launch-note">${icon("arrow")}<span>Opens this title in the provider app or on its website. If the app does not open, the title page is available in your browser. Sign-in, region, or plan restrictions may apply.</span></div></div></div></div>`;
  openTitleId = title.id;
  if (open) dialog("details-dialog").showModal();
}
function watchAction(offer: Offer): string {
  const provider = providerById(offer.providerId);
  const target = launcher.resolve(offer);
  if (!target.exactTitleResolved || !target.url) return "";
  const navigation =
    target.navigation === "new-tab"
      ? 'target="_blank" rel="noopener noreferrer"'
      : 'target="_self"';
  const tabNote = target.navigation === "new-tab" ? " in a new tab" : "";
  return `<div class="watch-option"><a class="watch-link" href="${escapeHtml(target.url)}" ${navigation} aria-label="Watch on ${provider.name}, opens this title’s provider page${tabNote}"><span class="provider-dot" style="background:${provider.color}"></span><span class="watch-label">Watch on ${provider.name}<small>Title page</small></span>${icon("arrow")}</a></div>`;
}
function changedPreferences(): void {
  persist();
  syncControls();
  renderProviders();
  renderCatalog();
}

document.addEventListener("click", (event) => {
  const target = (event.target as Element).closest<HTMLElement>("button");
  if (!target) return;
  if (target.hasAttribute("data-open-preferences")) {
    renderPreferences();
    dialog("preferences-dialog").showModal();
  }
  if (target.hasAttribute("data-open-about"))
    dialog("about-dialog").showModal();
  if (target.dataset.close) dialog(target.dataset.close).close();
  if (target.dataset.title) {
    const title = visibleTitles().find(
      (title) => title.id === target.dataset.title,
    );
    if (title) void showDetails(title);
  }
  if (target.dataset.provider) {
    providerScope =
      target.dataset.provider === "all"
        ? null
        : (target.dataset.provider as ProviderId);
    renderProviders();
    renderCatalog();
    document
      .querySelector<HTMLButtonElement>(
        `[data-provider="${target.dataset.provider}"]`,
      )
      ?.focus();
  }
  if (target.hasAttribute("data-home")) {
    query = "";
    providerScope = null;
    byId<HTMLInputElement>("search").value = "";
    renderProviders();
    renderCatalog();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (target.hasAttribute("data-clear-search")) {
    query = "";
    byId<HTMLInputElement>("search").value = "";
    renderCatalog();
    byId<HTMLInputElement>("search").focus();
  }
});
document.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.preference)
    preferences[
      input.dataset.preference as
        | "hideHorror"
        | "hideSeasonal"
        | "hideDisturbingArtwork"
    ] = input.checked;
  else if (input.hasAttribute("data-maturity"))
    preferences.maxAgeLevel = Number(input.value) as AgeLevel;
  else if (input.dataset.service) {
    const id = input.dataset.service as ProviderId;
    preferences.providerIds = input.checked
      ? [...preferences.providerIds, id]
      : preferences.providerIds.filter((provider) => provider !== id);
  } else if (input.dataset.topic) {
    const topic = input.dataset.topic as ContentTopic;
    preferences.blockedTopics = input.checked
      ? [...preferences.blockedTopics, topic]
      : preferences.blockedTopics.filter((candidate) => candidate !== topic);
  } else if (input.hasAttribute("data-unrated"))
    preferences.allowUnrated = input.checked;
  else return;
  changedPreferences();
});
byId<HTMLInputElement>("search").addEventListener("input", (event) => {
  query = (event.target as HTMLInputElement).value;
  renderCatalog();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !(
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    byId<HTMLInputElement>("search").focus();
  }
});
dialog("details-dialog").addEventListener("close", () => {
  openTitleId = null;
  detailRequest++;
});
document.querySelectorAll<HTMLDialogElement>("dialog").forEach((modal) =>
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      modal.close();
  }),
);

syncControls();
updateSaveStatus();
renderProviders();
loadLaunchableCatalog(catalogSource, availabilitySource, launcher)
  .then((catalog) => {
    titles = catalog;
    byId("catalog-size").textContent = String(titles.length);
    renderCatalog();
  })
  .catch(() => {
    byId("service-summary").textContent = "The catalog could not load.";
    byId("title-grid").innerHTML =
      '<div class="empty-state"><h3>Unable to load this catalog</h3><p>Reload the page to try again.</p></div>';
  });
