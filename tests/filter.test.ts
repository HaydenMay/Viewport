import { test } from "node:test";
import assert from "node:assert/strict";
import type { Title } from "../src/domain.ts";
import { filterTitles, shouldReplaceArtwork } from "../src/filter.ts";
import { defaultPreferences } from "../src/preferences.ts";

const base: Title = {
  id: "a",
  name: "Ocean Adventure",
  year: 2024,
  kind: "Movie",
  rating: "PG",
  ageLevel: 1,
  genres: ["Adventure"],
  summary: "An ocean journey.",
  duration: "100m",
  providerIds: ["disney"],
  topics: [],
  seasonal: [],
  artworkRisk: "neutral",
  art: "a.svg",
  palette: ["#123", "#456"],
};
const fixture = (changes: Partial<Title>): Title => ({ ...base, ...changes });
const ids = (titles: Title[]) => titles.map((t) => t.id);

test("horror and scary annotations disappear immediately", () => {
  assert.deepEqual(
    ids(
      filterTitles(
        [
          base,
          fixture({ id: "h", topics: ["horror"] }),
          fixture({ id: "s", topics: ["scary"] }),
        ],
        defaultPreferences(),
      ),
    ),
    ["a"],
  );
});
test("turning off Hide Horror restores those titles", () => {
  assert.equal(
    filterTitles([fixture({ topics: ["horror"] })], {
      ...defaultPreferences(),
      hideHorror: false,
    }).length,
    1,
  );
});
test("Halloween and other seasonal content are hidden", () => {
  assert.deepEqual(
    ids(
      filterTitles(
        [
          base,
          fixture({ id: "h", seasonal: ["halloween"] }),
          fixture({ id: "x", seasonal: ["christmas"] }),
        ],
        defaultPreferences(),
      ),
    ),
    ["a"],
  );
});
test("seasonal content can be allowed independently from horror", () => {
  assert.deepEqual(
    ids(
      filterTitles(
        [
          fixture({ id: "x", seasonal: ["christmas"] }),
          fixture({ id: "h", topics: ["horror"] }),
        ],
        { ...defaultPreferences(), hideSeasonal: false },
      ),
    ),
    ["x"],
  );
});
test("subscription selection uses any matching offer and empty selection yields none", () => {
  const both = fixture({ providerIds: ["hulu", "peacock"] });
  assert.equal(
    filterTitles([both], { ...defaultPreferences(), providerIds: ["peacock"] })
      .length,
    1,
  );
  assert.equal(
    filterTitles([both], { ...defaultPreferences(), providerIds: ["netflix"] })
      .length,
    0,
  );
  assert.equal(
    filterTitles([base], { ...defaultPreferences(), providerIds: [] }).length,
    0,
  );
});
test("maturity ceiling includes boundary and excludes adults", () => {
  assert.deepEqual(
    ids(
      filterTitles(
        [
          base,
          fixture({ id: "teen", ageLevel: 2 }),
          fixture({ id: "adult", ageLevel: 3 }),
        ],
        { ...defaultPreferences(), maxAgeLevel: 2 },
      ),
    ),
    ["a", "teen"],
  );
});
test("unknown maturity is excluded under a limit even when a legacy preference allows it", () => {
  const unknown = fixture({ ageLevel: null, rating: "Unrated" });
  assert.equal(
    filterTitles([unknown], { ...defaultPreferences(), maxAgeLevel: 1 }).length,
    0,
  );
  assert.equal(
    filterTitles([unknown], {
      ...defaultPreferences(),
      maxAgeLevel: 1,
      allowUnrated: true,
    }).length,
    0,
  );
});
test("content-topic controls compose without changing maturity", () => {
  assert.deepEqual(
    ids(
      filterTitles(
        [
          base,
          fixture({ id: "v", topics: ["violence"] }),
          fixture({ id: "l", topics: ["language"] }),
          fixture({ id: "sex", topics: ["sexual"] }),
        ],
        {
          ...defaultPreferences(),
          blockedTopics: ["violence", "language", "sexual"],
        },
      ),
    ),
    ["a"],
  );
});
test("search matches only titles without case/diacritic sensitivity", () => {
  assert.equal(
    filterTitles([base], defaultPreferences(), "  OCEAN ").length,
    1,
  );
  assert.equal(
    filterTitles([fixture({ name: "Amélie" })], defaultPreferences(), "amelie")
      .length,
    1,
  );
  assert.equal(filterTitles([base], defaultPreferences(), "journey").length, 0);
  assert.equal(
    filterTitles([base], defaultPreferences(), "unrelated").length,
    0,
  );
});
test("browse provider scope must also be subscribed", () => {
  assert.equal(
    filterTitles([base], defaultPreferences(), "", "hulu").length,
    0,
  );
  assert.equal(
    filterTitles(
      [base],
      { ...defaultPreferences(), providerIds: ["hulu"] },
      "",
      "disney",
    ).length,
    0,
  );
});
test("artwork replacement retains the allowed underlying title", () => {
  const risky = fixture({ artworkRisk: "disturbing" });
  assert.equal(shouldReplaceArtwork(risky, defaultPreferences()), true);
  assert.equal(filterTitles([risky], defaultPreferences()).length, 1);
  assert.equal(
    shouldReplaceArtwork(risky, {
      ...defaultPreferences(),
      hideDisturbingArtwork: false,
    }),
    false,
  );
});
test("unknown artwork gets a neutral fallback and seasonal artwork follows seasonal preference", () => {
  assert.equal(
    shouldReplaceArtwork(
      fixture({ artworkRisk: "unknown" }),
      defaultPreferences(),
    ),
    true,
  );
  assert.equal(
    shouldReplaceArtwork(
      fixture({ artworkRisk: "seasonal" }),
      defaultPreferences(),
    ),
    true,
  );
  assert.equal(
    shouldReplaceArtwork(
      fixture({ artworkRisk: "neutral" }),
      defaultPreferences(),
    ),
    false,
  );
});
test("filtering does not mutate catalog order or preferences", () => {
  const titles = [base, fixture({ id: "h", topics: ["horror"] })];
  const before = JSON.stringify(titles);
  const preferences = defaultPreferences();
  const saved = JSON.stringify(preferences);
  filterTitles(titles, preferences, "Ocean");
  assert.equal(JSON.stringify(titles), before);
  assert.equal(JSON.stringify(preferences), saved);
});


test('no maturity limit includes unknown ratings while explicit search retains hard limits', () => {
  const unknown = fixture({ id: 'unknown', ageLevel: null, rating: 'Rating unavailable' });
  assert.equal(filterTitles([unknown], { ...defaultPreferences(), maxAgeLevel: null }).length, 1);
  assert.equal(filterTitles([unknown], { ...defaultPreferences(), maxAgeLevel: 2 }, 'Ocean').length, 0);
  assert.equal(filterTitles([fixture({ ageLevel: 3 })], { ...defaultPreferences(), maxAgeLevel: 2 }, 'Ocean').length, 0);
});

test('explicit title searches reveal content-hidden matches and exclude descriptions', () => {
  const hidden = fixture({ id: 'hidden', name: 'Alien', topics: ['horror'], ageLevel: 3 });
  const description = fixture({ id: 'summary', name: 'Space Journey', summary: 'An alien visitor.' });
  const prefs = { ...defaultPreferences(), maxAgeLevel: null };
  assert.deepEqual(ids(filterTitles([description, hidden], prefs, 'ALI')), ['hidden']);
  assert.deepEqual(ids(filterTitles([hidden], prefs)), []);
  assert.deepEqual(ids(filterTitles([hidden], { ...prefs, providerIds: [] }, 'Alien')), []);
});

test('filter explanations partition scoped matching titles without exposing maturity-blocked titles', async () => {
  const { explainFiltering } = await import('../src/filter.ts');
  const sample = [
    base,
    fixture({ id:'adult', ageLevel:3, topics:['horror'], name:'Ocean Adult' }),
    fixture({ id:'unknown', ageLevel:null, name:'Ocean Unknown' }),
    fixture({ id:'horror', topics:['horror'] }),
    fixture({ id:'seasonal', seasonal:['halloween'] }),
    fixture({ id:'topic', topics:['language'] }),
    fixture({ id:'other-provider', providerIds:['prime'], ageLevel:null }),
  ];
  const prefs={...defaultPreferences(),maxAgeLevel:2 as const,blockedTopics:['language' as const]};
  assert.deepEqual(explainFiltering(sample,prefs), {
    matching:6, showing:1, hidden:{maturity:1,unknownRating:1,horror:1,seasonal:1,content:1},
  });
  const searched=explainFiltering(sample,prefs,'Ocean');
  assert.equal(searched.showing,4);
  assert.deepEqual(searched.hidden,{maturity:1,unknownRating:1,horror:0,seasonal:0,content:0});
  assert.equal(explainFiltering(sample,prefs,'absent').matching,0);
  assert.equal(explainFiltering(sample,prefs,'Ocean','prime').matching,0);
  assert.ok(!JSON.stringify(searched).includes('Adult'));
});

 test('single letters match names only and exact/start/contains ranking is consistent', async () => {
 const titles=[fixture({id:'contains',name:'The Bear'}),fixture({id:'metadata',name:'Ocean',genres:['Biography'],summary:'B movie'}),fixture({id:'starts',name:'Bear Country'}),fixture({id:'exact',name:'Bear'})];
 assert.deepEqual(ids(filterTitles(titles,defaultPreferences(),' B ')),['exact','starts','contains']);
 assert.deepEqual(ids(filterTitles(titles,defaultPreferences(),'BEAR')),['exact','starts','contains']);
 const {explainFiltering}=await import('../src/filter.ts');assert.equal(explainFiltering(titles,defaultPreferences(),'B').matching,3);
 });
