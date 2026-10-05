import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TITLES,
  PrototypeAvailability,
  PrototypeCatalog,
} from "../src/catalog.ts";

test("catalog entries have unique IDs, known providers, and editable copies", async () => {
  const catalog = await new PrototypeCatalog().list();
  assert.equal(new Set(catalog.map((title) => title.id)).size, catalog.length);
  assert.ok(catalog.every((title) => title.providerIds.length > 0));
  const known = new Set([
    "disney",
    "hulu",
    "netflix",
    "prime",
    "peacock",
    "paramount",
  ]);
  assert.ok(
    catalog.every((title) => title.providerIds.every((id) => known.has(id))),
  );
  catalog[0].name = "Changed";
  assert.notEqual(TITLES[0].name, "Changed");
});
test("availability adapter labels fixture provenance and handles unknown titles", async () => {
  const source = new PrototypeAvailability();
  const offers = await source.offersFor("fellowship");
  assert.deepEqual(
    offers.map((offer) => offer.providerId),
    ["prime"],
  );
  assert.ok(
    offers.every(
      (offer) =>
        offer.provenance === "prototype" &&
        offer.region === "US" &&
        offer.access === "subscription",
    ),
  );
  assert.deepEqual(await source.offersFor("missing"), []);
});
