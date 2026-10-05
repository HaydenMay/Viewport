// Optional local production QA. Supply a Playwright module path if not installed
// in this checkout; Playwright is deliberately not a runtime dependency.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.VIEWPORT_PLAYWRIGHT_MODULE || "playwright",
);
const root = resolve("dist");
const output = resolve("qa");
await mkdir(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (!pathname.startsWith("/Viewport/")) {
    response.writeHead(404).end();
    return;
  }
  const file = resolve(
    root,
    pathname.slice("/Viewport/".length) || "index.html",
  );
  if (!file.startsWith(root + "/") && file !== root) {
    response.writeHead(403).end();
    return;
  }
  try {
    response.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolveReady) =>
  server.listen(0, "127.0.0.1", resolveReady),
);
const url = `http://127.0.0.1:${server.address().port}/Viewport/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.VIEWPORT_CHROMIUM_PATH
    ? { executablePath: process.env.VIEWPORT_CHROMIUM_PATH }
    : {}),
});
const errors = [];
const results = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400)
    errors.push(`HTTP ${response.status()}: ${response.url()}`);
});
const waitCount = async (count) => {
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".title-card").length === expected,
    count,
  );
};

try {
  await page.goto(url, { waitUntil: "load" });
  await waitCount(14);
  await page.screenshot({ path: `${output}/viewport-preview.png` });
  await page.setViewportSize({ width: 820, height: 1180 });
  assert.equal(
    await page
      .getByRole("button", { name: "Preferences", exact: true })
      .count(),
    1,
    "iPad Preferences button needs an accessible name",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.quick-filters [data-preference="hideHorror"]').uncheck();
  await waitCount(18);
  await page
    .locator('.quick-filters [data-preference="hideSeasonal"]')
    .uncheck();
  await waitCount(20);
  await page.reload({ waitUntil: "load" });
  await waitCount(20);
  assert.equal(
    await page
      .locator('.quick-filters [data-preference="hideHorror"]')
      .isChecked(),
    false,
  );
  results.push(
    "Filters change results immediately; local preferences survive reload.",
  );

  await page.locator("#search").fill("stranger");
  await waitCount(1);
  await page.locator('.quick-filters [data-preference="hideHorror"]').check();
  await waitCount(0);
  assert.match(
    await page.locator(".empty-state").innerText(),
    /Nothing matches/,
  );
  await page.locator("#search").fill("");
  await page.locator('.quick-filters [data-preference="hideSeasonal"]').check();
  await waitCount(14);
  await page.locator(".quick-filters [data-maturity]").selectOption("1");
  await waitCount(7);
  await page.locator(".quick-filters [data-maturity]").selectOption("3");
  await waitCount(14);
  results.push(
    "Search never bypasses content rules; maturity boundary gives seven PG-or-lower fixtures.",
  );

  await page.locator('[data-provider="max"]').click();
  await waitCount(3);
  await page.locator('[data-provider="all"]').click();
  await waitCount(14);
  await page.locator('.title-card[data-title="mandalorian"]').click();
  await page.locator("#details-dialog[open]").waitFor();
  assert.equal(await page.locator("#details-dialog .cover-neutral").count(), 1);
  assert.equal(
    await page.locator("#details-dialog .watch-link").getAttribute("href"),
    "https://www.disneyplus.com/",
  );
  assert.match(
    await page.locator(".launch-note").innerText(),
    /homepage.*unverified/s,
  );
  await page.keyboard.press("Escape");
  await page.locator("#details-dialog[open]").waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("data-title"),
    ),
    "mandalorian",
  );
  results.push(
    "Provider browse scope, neutral title artwork, honest launch destination, Escape and restored focus pass.",
  );

  await page.locator("[data-open-preferences]").first().click();
  await page.locator('[data-preference="hideDisturbingArtwork"]').uncheck();
  await page.locator('[data-close="preferences-dialog"]').last().click();
  assert.equal(
    await page
      .locator('.title-card[data-title="mandalorian"] .cover-neutral')
      .count(),
    0,
  );
  assert.equal(
    await page.locator('.title-card[data-title="mandalorian"]').count(),
    1,
  );
  await page.locator("[data-open-preferences]").first().click();
  await page.locator('[data-preference="hideDisturbingArtwork"]').check();
  for (const id of ["disney", "hulu", "netflix", "prime", "max"])
    await page.locator(`[data-service="${id}"]`).uncheck();
  await page.locator('[data-close="preferences-dialog"]').last().click();
  await waitCount(0);
  assert.match(
    await page.locator(".empty-state").innerText(),
    /Which services/,
  );
  await page.locator("[data-open-preferences]").first().click();
  await page.locator('[data-service="max"]').check();
  await page.locator('[data-close="preferences-dialog"]').last().click();
  await waitCount(3);
  await page.locator('.title-card[data-title="fellowship"]').click();
  await page.locator("#details-dialog[open]").waitFor();
  assert.equal(await page.locator(".watch-link").count(), 1);
  assert.equal(
    await page.locator(".watch-link").getAttribute("href"),
    "https://www.hbomax.com/",
  );
  await page.keyboard.press("Escape");
  results.push(
    "Artwork choice preserves title; zero subscriptions has an empty state; Watch on offers include only subscribed services.",
  );

  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await waitCount(14);
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["ipad-landscape", 1180, 820],
    ["ipad-portrait", 820, 1180],
    ["mobile", 390, 844],
    ["small-mobile", 320, 700],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${name}: horizontal overflow`,
    );
    assert.ok(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll(".cover-title")).every((title) => {
          const a = title.getBoundingClientRect(),
            b = title.parentElement.getBoundingClientRect();
          return a.top >= b.top && title.scrollWidth <= title.clientWidth + 1;
        }),
      ),
      `${name}: overflowing title typography`,
    );
    assert.ok(
      await page.evaluate(() =>
        Array.from(document.images).every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      ),
      `${name}: missing image`,
    );
    await page.locator("[data-open-preferences]").first().click();
    await page.screenshot({ path: `${output}/${name}-preferences.png` });
    assert.equal(
      await page.evaluate(() => {
        const dialog = document.querySelector("#preferences-dialog");
        return dialog.scrollWidth > dialog.clientWidth;
      }),
      false,
      `${name}: dialog overflow`,
    );
    await page.keyboard.press("Escape");
    results.push(`${name} ${width}×${height}: assets and layout pass.`);
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
  await page.screenshot({
    path: `${output}/enlarged-text.png`,
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "200% text: horizontal overflow",
  );
  assert.ok(
    await page.evaluate(() =>
      Array.from(document.querySelectorAll(".cover-title")).every((title) => {
        const a = title.getBoundingClientRect(),
          b = title.parentElement.getBoundingClientRect();
        return a.top >= b.top && title.scrollWidth <= title.clientWidth + 1;
      }),
    ),
    "200% text: overflowing title typography",
  );
  results.push("200% base text size: no horizontal page overflow.");

  const blocked = await browser.newPage();
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Blocked storage");
      },
    });
  });
  await blocked.goto(url, { waitUntil: "load" });
  await blocked.locator(".title-card").first().waitFor();
  assert.match(
    await blocked.locator("#save-status").innerText(),
    /could not save/,
  );
  assert.equal(await blocked.locator(".title-card").count(), 14);
  await blocked.close();
  results.push(
    "Blocked browser storage remains usable and explains that saving failed.",
  );
  assert.deepEqual(errors, []);
  results.push("No browser page errors or failed local asset responses.");
  await writeFile(
    `${output}/results.json`,
    JSON.stringify(
      {
        browser: await browser.version(),
        checkedAt: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  );
  console.log(results.join("\n"));
} finally {
  await browser.close();
  server.close();
}
