import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TITLES,
  PrototypeAvailability,
  PrototypeCatalog,
} from "../src/catalog.ts";

test("catalog has twenty distinct entries and all five illustrative services", async () => {
  const catalog = await new PrototypeCatalog().list();
  assert.equal(catalog.length, 20);
  assert.equal(new Set(catalog.map((title) => title.id)).size, 20);
  assert.equal(new Set(catalog.flatMap((title) => title.providerIds)).size, 5);
  catalog[0].name = "Changed";
  assert.notEqual(TITLES[0].name, "Changed");
});
test("availability adapter supports multiple providers and labels fixture provenance", async () => {
  const source = new PrototypeAvailability();
  const offers = await source.offersFor("fellowship");
  assert.deepEqual(
    offers.map((offer) => offer.providerId),
    ["prime", "max"],
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
