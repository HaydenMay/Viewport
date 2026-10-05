import { test } from "node:test";
import assert from "node:assert/strict";
import { TITLES } from "../src/catalog.ts";
import { PrototypeLauncher } from "../src/providers.ts";
import { filterTitles } from "../src/filter.ts";
import { defaultPreferences } from "../src/preferences.ts";
import { loadLaunchableCatalog, titleLinkedOffers } from "../src/discovery.ts";
import type {
  AvailabilitySource,
  CatalogSource,
  Offer,
  Title,
} from "../src/domain.ts";

const launcher = new PrototypeLauncher();
const sample: Title[] = [
  {
    ...TITLES.find((title) => title.id === "moana")!,
    providerIds: ["disney", "peacock"],
  },
  {
    ...TITLES.find((title) => title.id === "moana")!,
    id: "unlinked",
    name: "Unlinked example",
    providerIds: ["peacock"],
  },
];
const source: CatalogSource = { list: async () => structuredClone(sample) };
const availability: AvailabilitySource = {
  offersFor: async (titleId) =>
    (sample.find((title) => title.id === titleId)?.providerIds ?? []).map(
      (providerId) => ({
        titleId,
        providerId,
        region: "US",
        access: "subscription",
        provenance: "prototype",
      }),
    ),
};
const catalog = () => loadLaunchableCatalog(source, availability, launcher);

test("an unlinked title never enters discovery or search", async () => {
  const titles = await catalog();
  assert.deepEqual(
    titles.map((title) => title.id),
    ["moana"],
  );
  assert.deepEqual(filterTitles(titles, defaultPreferences(), "Unlinked"), []);
});

test("a multi-service title appears only under a service with its own title link", async () => {
  const titles = await catalog();
  assert.equal(
    filterTitles(titles, { ...defaultPreferences(), providerIds: ["peacock"] })
      .length,
    0,
  );
  assert.equal(
    filterTitles(titles, defaultPreferences(), "Moana", "peacock").length,
    0,
  );
  assert.equal(
    filterTitles(
      titles,
      { ...defaultPreferences(), providerIds: ["disney"] },
      "Moana",
    ).length,
    1,
  );
  assert.deepEqual(titles[0].providerIds, ["disney"]);
});

test("details never expose a homepage fallback alongside a title link", async () => {
  const offers: Offer[] = await availability.offersFor("moana");
  assert.deepEqual(
    titleLinkedOffers(offers, launcher).map((offer) => offer.providerId),
    ["disney"],
  );
  assert.deepEqual(
    titleLinkedOffers(await availability.offersFor("unlinked"), launcher),
    [],
  );
});

test("link admission does not mutate metadata or simulated availability", async () => {
  await catalog();
  const raw = await source.list();
  assert.deepEqual(raw[0].providerIds, ["disney", "peacock"]);
  assert.equal(
    raw.some((title) => title.id === "unlinked"),
    true,
  );
});
