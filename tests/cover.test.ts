import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cover} from '../src/ui.ts';
import {defaultPreferences} from '../src/preferences.ts';
import {TITLES} from '../src/catalog.ts';
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
