import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cover} from '../src/ui.ts';
import {defaultPreferences} from '../src/preferences.ts';
import {TITLES} from '../src/catalog.ts';
import {generatedCoverArt} from '../src/cover-art.ts';
test('fallback covers are original graphics without repeated placeholder labels',()=>{
 const title={...TITLES[0],art:"",genres:['Comedy']};
 const rendered=cover(title,defaultPreferences());
 assert.ok(!rendered.includes('Neutral artwork'));
 assert.match(rendered,/class="generated-art"/);
 assert.equal(rendered,cover(title,defaultPreferences()));
 assert.notEqual(rendered,cover({...title,id:'another-id'},defaultPreferences()));
 assert.notEqual(rendered,cover({...title,genres:['Science Fiction']},defaultPreferences()));
 assert.match(cover({...title,genres:[]},defaultPreferences()),/generated-art/);
});
test('a catalog of one genre still gets varied compositions and palettes',()=>{
 const covers=Array.from({length:300},(_,i)=>generatedCoverArt({id:`catalog-${i}`,genres:['Drama']}));
 const patterns=new Set(covers.map(svg=>svg.match(/data-art-pattern="([^"]+)"/)?.[1]));
 const palettes=new Set(covers.map(svg=>svg.match(/data-art-palette="([^"]+)"/)?.[1]));
 assert.ok(!patterns.has(undefined));
 assert.ok(patterns.size>=12,`Only ${patterns.size} compositions`);
 assert.ok(palettes.size>=4,`Only ${palettes.size} palettes`);
 assert.equal(new Set(covers).size,300);
 assert.ok(covers.every(svg=>!svg.includes('NaN')&&!svg.includes('undefined')));
 assert.equal(generatedCoverArt({id:'<script>bad</script>',genres:[]}).includes('<script>'),false);
});
