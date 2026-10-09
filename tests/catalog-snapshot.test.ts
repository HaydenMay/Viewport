import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSnapshot } from '../scripts/catalog-trial/snapshot.ts';
import { SnapshotSource } from '../src/snapshot.ts';
import { normalizeShow, classifyRatings } from '../scripts/catalog-trial/model.ts';
import { loadLaunchableCatalog } from '../src/discovery.ts';
import { PrototypeLauncher } from '../src/providers.ts';
import { TITLE_PAGE_LINKS } from '../src/title-links.ts';
import { filterTitles } from '../src/filter.ts';
import { defaultPreferences } from '../src/preferences.ts';
const stamp = '2026-10-06T21:00:00Z';
const item = (id: number) => normalizeShow({ id: String(id), showType: 'movie', title: `Real source title ${id}`, imdbId: `tt${1000000+id}`, releaseYear: 2024, genres: [{name:'Horror'}], streamingOptions:{us:[{service:{id:'netflix'},type:'subscription',link:`https://www.netflix.com/title/${id}`}] } }, stamp)!;

test('snapshot separates metadata, subscription offers and candidate links without invented ratings or art', async () => {
  const records = [item(1), item(2), item(3)];
  records[0].title.ratings = classifyRatings([{country:'usa',name:'PG-13'}], 'movie');
  records[1].title.ratings = classifyRatings([{country:'usa',name:'NR'}], 'movie');
  records[2].offers[0].url = null;
  records[2].offers[0].linkAccepted = false;
  const snapshot = buildSnapshot(records, stamp, new Map());
  const source = new SnapshotSource(snapshot);
  const launcher = new PrototypeLauncher([...TITLE_PAGE_LINKS, ...snapshot.links]);
  const titles = await loadLaunchableCatalog(source, source, launcher);
  assert.equal(titles.length, 2);
  assert.equal(snapshot.titles[1].rating, 'Rating unavailable');
  assert.equal(snapshot.titles[1].ageLevel, null);
  assert.equal(snapshot.titles[1].contentCoverage, 'genre-only');
  assert.equal(snapshot.titles[1].art, '');
  assert.equal(snapshot.offers.length, 3); // Availability does not depend on links.
  assert.equal(launcher.resolve(snapshot.offers[0], 'ios').evidence, 'availability-api');
  assert.equal(launcher.resolve(snapshot.offers[0], 'ios').expectedCapability, 'webExact');
  assert.equal(filterTitles(titles, {...defaultPreferences(),hideHorror:false,maxAgeLevel:2}).length, 1);
  assert.equal(filterTitles(titles, {...defaultPreferences(),maxAgeLevel:2}, 'title 1').length, 1);
  assert.equal(filterTitles(titles, {...defaultPreferences(),maxAgeLevel:2}, 'title 2').length, 0);
  assert.equal(launcher.resolve({titleId:'moana',providerId:'disney',region:'US',access:'subscription',provenance:'prototype'},'ios').url, TITLE_PAGE_LINKS.find(x=>x.titleId==='moana')!.url);
});

test('Wikidata only fills missing ratings and turns source disagreements into unknowns', () => {
  const records = [item(1),item(2),item(3)];
  records[1].title.ratings = classifyRatings([{country:'usa',name:'R'}], 'movie');
  records[2].title.ratings = classifyRatings([{country:'usa',name:'NR'}], 'movie');
  const candidates = new Map(records.map(r => [r.title.id, {rating:'PG',itemId:'Q1'}]));
  const snapshot = buildSnapshot(records, stamp, candidates);
  assert.equal(snapshot.titles[0].rating, 'PG');
  assert.equal(snapshot.titles[0].metadata?.ratingSource, 'wikidata');
  assert.equal(snapshot.titles[1].ageLevel, null);
  assert.equal(snapshot.titles[1].metadata?.ratingState, 'conflict');
  assert.equal(snapshot.titles[2].ageLevel, null);
  assert.equal(records[0].title.ratings.state, 'missing');
});

test('duplicate records merge offers without inventing missing metadata or refreshing old availability dates', async () => {
  const first=item(1);first.title.year=null;first.title.summary=null;first.title.genres=[];
  first.title.ratings=classifyRatings([{country:'usa',name:'TV-14'}],'movie');
  first.offers[0].checkedAt='2026-09-01T00:00:00Z';
  const duplicate=structuredClone(first);
  duplicate.offers.push({...duplicate.offers[0],providerId:'hulu',url:'https://www.hulu.com/movie/synthetic-title',checkedAt:stamp});
  const snapshot=buildSnapshot([first,duplicate],stamp,new Map());
  assert.equal(snapshot.titles.length,1);
  assert.equal(snapshot.offers.length,2);
  assert.equal(snapshot.titles[0].year,null);
  assert.equal(snapshot.titles[0].summary,'Description unavailable.');
  assert.equal(snapshot.titles[0].ageLevel,null);
  assert.deepEqual(snapshot.titles[0].genres,[]);
  assert.equal(snapshot.offers[0].checkedAt,'2026-09-01T00:00:00Z');
  const source=new SnapshotSource(snapshot);
  const titles=await loadLaunchableCatalog(source,source,new PrototypeLauncher(snapshot.links));
  assert.equal(filterTitles(titles,{...defaultPreferences(),providerIds:['hulu'],maxAgeLevel:null}).length,1);
  assert.equal(filterTitles(titles,{...defaultPreferences(),providerIds:['netflix'],maxAgeLevel:2}).length,0);
});
