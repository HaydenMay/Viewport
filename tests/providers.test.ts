import { test } from "node:test";
import assert from "node:assert/strict";
import { PrototypeLauncher } from "../src/providers.ts";
import type { ProviderId } from "../src/domain.ts";

test("each sample provider has an honest HTTPS homepage fallback", () => {
  const domains = {
    disney: "www.disneyplus.com",
    hulu: "www.hulu.com",
    netflix: "www.netflix.com",
    prime: "www.primevideo.com",
    max: "www.hbomax.com",
  };
  for (const providerId of Object.keys(domains) as ProviderId[]) {
    const target = new PrototypeLauncher().resolve({
      providerId,
      titleId: "demo",
      region: "US",
      access: "subscription",
      provenance: "prototype",
    });
    assert.equal(target.url, `https://${domains[providerId]}/`);
    assert.equal(target.scope, "provider-homepage");
    assert.equal(target.nativeTitleVerified, false);
    assert.match(target.explanation, /website/i);
  }
});

test("a known Disney title resolves to its own official page instead of the home menu", () => {
  const target = new PrototypeLauncher().resolve({
    providerId: "disney",
    titleId: "moana",
    region: "US",
    access: "subscription",
    provenance: "prototype",
  });
  assert.equal(
    target.url,
    "https://www.disneyplus.com/browse/entity-e8896bfa-1052-41f7-ae2e-00255d77cf05",
  );
  assert.equal(target.scope, "provider-title-page");
  assert.equal(target.nativeTitleVerified, false);
});

test("a multi-provider title keeps separate destinations and an honest missing-link fallback", () => {
  const offer = {
    titleId: "fellowship",
    region: "US",
    access: "subscription",
    provenance: "prototype",
  } as const;
  const launcher = new PrototypeLauncher();
  assert.equal(
    launcher.resolve({ ...offer, providerId: "prime" }).url,
    "https://www.primevideo.com/detail/0N0CRBLY1S5GDA4EVTQ34LF5GN",
  );
  const max = launcher.resolve({ ...offer, providerId: "max" });
  assert.equal(max.scope, "provider-homepage");
  assert.equal(max.url, "https://www.hbomax.com/");
  assert.match(max.explanation, /title.*not.*verified/i);
});

test("Hulu and Netflix title destinations keep their provider identity without claiming native support", () => {
  for (const [providerId, titleId, url] of [
    [
      "hulu",
      "abbott",
      "https://www.hulu.com/series/abbott-elementary-7c33eeb2-5d16-4a10-ad9e-ee31f9fff15c",
    ],
    ["netflix", "our-planet", "https://www.netflix.com/title/80049832"],
  ] as const) {
    const target = new PrototypeLauncher().resolve({
      providerId,
      titleId,
      region: "US",
      access: "subscription",
      provenance: "prototype",
    });
    assert.equal(target.url, url);
    assert.equal(target.scope, "provider-title-page");
    assert.equal(target.nativeTitleVerified, false);
  }
});
