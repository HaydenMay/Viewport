import { test } from "node:test";
import assert from "node:assert/strict";
import { PrototypeLauncher, PROVIDERS } from "../src/providers.ts";
import type { Offer, ProviderId } from "../src/domain.ts";
import { TITLE_PAGE_LINKS } from "../src/title-links.ts";

const offer = (providerId: ProviderId, titleId: string): Offer => ({
  providerId,
  titleId,
  region: "US",
  access: "subscription",
  provenance: "prototype",
});
const launcher = new PrototypeLauncher();

test("Peacock app probes preserve the checked web actions and exact movie/season identity", () => {
  for (const [titleId, path] of [
    ["despicable-me-2", "/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743"],
    ["parks-and-rec", "/tv/parks-and-recreation/5883799404534408112/seasons/1"],
  ]) {
    const target = launcher.resolve(offer("peacock", titleId), "ios");
    assert.equal(target.url, `https://www.peacocktv.com/watch-online${path}`);
    assert.equal(target.fallbackUrl, target.url);
    assert.equal(target.expectedCapability, "webExact");
    assert.equal(target.appCandidate?.url, `https://www.peacocktv.com/watch/asset${path}`);
    assert.equal(target.appCandidate?.requiresDeviceVerification, true);
    assert.equal(target.appCandidate?.evidence, "provider-navigation-and-association");
    assert.equal(launcher.resolve(offer("peacock", titleId), "web").appCandidate, undefined);
  }
  assert.equal(launcher.resolve(offer("prime", "maisel"), "ios").appCandidate, undefined);
  assert.equal(launcher.resolve(offer("peacock", "unmapped"), "ios").appCandidate, undefined);
});

test("app candidates cannot change title identity or introduce another origin or custom scheme", () => {
  const link = TITLE_PAGE_LINKS.find((link) => link.titleId === "parks-and-rec")!;
  for (const appCandidateUrl of [
    "peacock://watch/asset/tv/parks-and-recreation/5883799404534408112/seasons/1",
    "https://evil.example/watch/asset/tv/parks-and-recreation/5883799404534408112/seasons/1",
    "https://www.peacocktv.com/watch/asset/tv/other/5883799404534408112/seasons/1",
    "https://www.peacocktv.com/watch/asset/tv/parks-and-recreation/5883799404534408112/seasons/2",
    "https://user:password@www.peacocktv.com/watch/asset/tv/parks-and-recreation/5883799404534408112/seasons/1",
    "not a URL",
  ]) {
    const target = new PrototypeLauncher([{...link, appCandidateUrl}]).resolve(offer("peacock", "parks-and-rec"), "ios");
    assert.equal(target.appCandidate, undefined);
    assert.equal(target.url, link.url, "a rejected probe must preserve the working web destination");
  }
});

test("every Big 6 integration has a safe HTTPS fallback for missing title mappings", () => {
  const domains = {
    disney: "www.disneyplus.com",
    hulu: "www.hulu.com",
    netflix: "www.netflix.com",
    prime: "www.primevideo.com",
    paramount: "www.paramountplus.com",
    peacock: "www.peacocktv.com",
  };
  assert.deepEqual(
    new Set(PROVIDERS.map((provider) => provider.id)),
    new Set(Object.keys(domains)),
  );
  for (const providerId of Object.keys(domains) as ProviderId[]) {
    const target = launcher.resolve(offer(providerId, "unmapped"), "ios");
    assert.equal(target.url, `https://${domains[providerId]}/`);
    assert.equal(target.fallbackUrl, target.url);
    assert.equal(target.expectedCapability, "providerHome");
    assert.equal(target.exactTitleResolved, false);
  }
});

test("working Netflix, Disney+, and Hulu destinations remain byte-for-byte unchanged", () => {
  for (const [providerId, titleId, url] of [
    [
      "disney",
      "moana",
      "https://www.disneyplus.com/browse/entity-e8896bfa-1052-41f7-ae2e-00255d77cf05",
    ],
    [
      "hulu",
      "abbott",
      "https://www.hulu.com/series/abbott-elementary-7c33eeb2-5d16-4a10-ad9e-ee31f9fff15c",
    ],
    ["netflix", "our-planet", "https://www.netflix.com/title/80049832"],
  ] as const) {
    const target = launcher.resolve(offer(providerId, titleId), "ios");
    assert.equal(target.url, url);
    assert.equal(target.fallbackUrl, url);
    assert.equal(target.expectedCapability, "nativeExact");
    assert.equal(target.evidence, "user-reported-provider");
    assert.equal(
      target.requiresDeviceVerification,
      true,
      "per-title device records are still needed",
    );
    assert.equal(
      target.navigation,
      "new-tab",
      "preserve the working link behavior",
    );
    assert.equal(
      launcher.resolve(offer(providerId, titleId), "web").expectedCapability,
      "webExact",
    );
  }
});

test("Prime keeps its exact web destination and uses a direct same-tab handoff experiment", () => {
  const target = launcher.resolve(offer("prime", "maisel"), "ios");
  assert.equal(
    target.url,
    "https://www.primevideo.com/detail/0N2ZNLA18SIYYKK3H9W469YBKQ",
  );
  assert.equal(target.fallbackUrl, target.url);
  assert.equal(target.expectedCapability, "webExact");
  assert.equal(target.navigation, "same-tab");
  assert.equal(target.requiresDeviceVerification, true);
});

test("Paramount+ native and Peacock web expectations follow device reports with unchanged URLs", () => {
  for (const [providerId, titleId, url, id] of [
    [
      "paramount",
      "spongebob",
      "https://www.paramountplus.com/shows/spongebob-squarepants/",
      "spongebob-squarepants",
    ],
    [
      "paramount",
      "mutant-mayhem",
      "https://www.paramountplus.com/movies/video/zzvVWZ_qkLDj2LXltHmuZlUsX8BfdZ7U/",
      "zzvVWZ_qkLDj2LXltHmuZlUsX8BfdZ7U",
    ],
    [
      "peacock",
      "parks-and-rec",
      "https://www.peacocktv.com/watch-online/tv/parks-and-recreation/5883799404534408112/seasons/1",
      "5883799404534408112",
    ],
    [
      "peacock",
      "despicable-me-2",
      "https://www.peacocktv.com/watch-online/movies/despicable-me-2/41bacec9-efbf-3ae4-8358-5f4c1917c743",
      "41bacec9-efbf-3ae4-8358-5f4c1917c743",
    ],
  ] as const) {
    const target = launcher.resolve(offer(providerId, titleId), "ios");
    assert.equal(target.url, url);
    assert.equal(target.fallbackUrl, url);
    assert.equal(target.expectedCapability, providerId === "paramount" ? "nativeExact" : "webExact");
    assert.equal(target.evidence, "user-reported-provider");
    assert.equal(target.exactTitleResolved, true);
    assert.equal(target.providerContentId, id);
    assert.equal(target.requiresDeviceVerification, true);
  }
});

test("a title cannot inherit another provider's destination", () => {
  const target = launcher.resolve(offer("peacock", "moana"), "ios");
  assert.equal(target.expectedCapability, "providerHome");
  assert.equal(target.exactTitleResolved, false);
  assert.equal(target.url, "https://www.peacocktv.com/");
});

test("untrusted or malformed title mappings never become executable Watch URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://www.peacocktv.com/watch-online/movies/example/41bacec9-efbf-3ae4-8358-5f4c1917c743",
    "https://www.peacocktv.com.evil.invalid/watch-online/movies/example/41bacec9-efbf-3ae4-8358-5f4c1917c743",
    "https://www.peacocktv.com/",
    "not-a-url",
  ]) {
    const candidate = new PrototypeLauncher([
      {
        titleId: "test",
        providerId: "peacock",
        url,
        checkedAt: "2026-10-05",
        evidence: "official-title-page",
      },
    ]);
    const target = candidate.resolve(offer("peacock", "test"), "ios");
    assert.equal(target.url, "https://www.peacocktv.com/");
    assert.equal(target.exactTitleResolved, false);
    assert.equal(target.expectedCapability, "providerHome");
  }
});

test("an unknown integration is unsupported rather than an invented route", () => {
  const target = launcher.resolve(offer("retired" as ProviderId, "test"));
  assert.equal(target.expectedCapability, "unsupported");
  assert.equal(target.url, null);
  assert.equal(target.fallbackUrl, null);
});
