import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultPreferences,
  parsePreferences,
  savePreferences,
  PREFERENCE_KEY,
} from "../src/preferences.ts";

test("missing, corrupt, wrong-version, and non-object preferences recover to defaults", () => {
  for (const raw of [
    null,
    "{broken",
    "null",
    "[]",
    '"text"',
    '{"version":99,"preferences":{}}',
  ])
    assert.deepEqual(parsePreferences(raw), defaultPreferences());
});
test("valid preferences round-trip with subscription and content choices", () => {
  const desired = {
    ...defaultPreferences(),
    providerIds: [] as [],
    hideHorror: false,
    maxAgeLevel: 1 as const,
    blockedTopics: ["violence" as const],
  };
  assert.deepEqual(
    parsePreferences(JSON.stringify({ version: 1, preferences: desired })),
    desired,
  );
});
test("untrusted stored values cannot disable protections or inject provider IDs", () => {
  const result = parsePreferences(
    JSON.stringify({
      version: 1,
      preferences: {
        providerIds: ["netflix", "evil", "netflix"],
        hideHorror: "false",
        maxAgeLevel: 99,
        blockedTopics: ["violence", "other"],
      },
    }),
  );
  assert.deepEqual(result.providerIds, ["netflix"]);
  assert.equal(result.hideHorror, true);
  assert.equal(result.maxAgeLevel, 3);
  assert.deepEqual(result.blockedTopics, ["violence"]);
});
test("blocked storage does not throw and reports saving failure", () => {
  assert.equal(
    savePreferences(
      {
        setItem() {
          throw new Error("blocked");
        },
      },
      defaultPreferences(),
    ),
    false,
  );
});
test("storage uses versioned payload and stable key", () => {
  let actualKey = "";
  let actualValue = "";
  assert.equal(
    savePreferences(
      {
        setItem(key, value) {
          actualKey = key;
          actualValue = value;
        },
      },
      defaultPreferences(),
    ),
    true,
  );
  assert.equal(actualKey, PREFERENCE_KEY);
  assert.deepEqual(JSON.parse(actualValue), {
    version: 1,
    preferences: defaultPreferences(),
  });
});
