import { test } from "node:test";
import assert from "node:assert/strict";
import { HomepageLauncher } from "../src/providers.ts";
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
    const target = new HomepageLauncher().resolve({
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
