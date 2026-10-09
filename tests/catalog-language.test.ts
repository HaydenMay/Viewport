import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeShow} from '../scripts/catalog-trial/model.ts';import {buildSnapshot} from '../scripts/catalog-trial/snapshot.ts';import {SnapshotSource} from '../src/snapshot.ts';
const raw={id:'1',title:'English-looking title',showType:'movie',releaseYear:2020,streamingOptions:{us:[{service:{id:'netflix'},type:'subscription',link:'https://www.netflix.com/title/123'}]}};
test('English-looking names, overviews and dubbed audio do not establish original language',()=>{
 const unknown=normalizeShow({...raw,overview:'English overview',streamingOptions:{us:[{service:{id:'netflix'},type:'subscription',link:'https://www.netflix.com/title/123',audios:[{language:'en'}]}]}},'2026-10-09')!;
 const confirmed=normalizeShow({...raw,id:'2'},'2026-10-09','en')!;
 const forged=structuredClone(unknown);forged.title.id='3';forged.title.originalLanguage='en';
 const snapshot=buildSnapshot([unknown,confirmed,forged],'2026-10-09',new Map(),true);
 assert.deepEqual(snapshot.titles.map(t=>t.id),[confirmed.title.id]);assert.equal(snapshot.languagePolicy,'english-original');
 assert.equal(snapshot.titles[0].metadata?.languageEvidence,'availability-query');new SnapshotSource(snapshot);
 assert.throws(()=>new SnapshotSource({...snapshot,titles:[{...snapshot.titles[0],metadata:{...snapshot.titles[0].metadata!,originalLanguage:null}}]}),/Unconfirmed original language/);
});
