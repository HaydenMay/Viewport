import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogAccess } from '../catalog.config.ts';
const settings={catalogMode:'prototype' as const,publicCatalogApproved:false};
test('normal production excludes local snapshots and explicit API builds require approval', () => {
  assert.equal(catalogAccess(settings,'build','production'),false);
  assert.throws(()=>catalogAccess(settings,'build','apiPreview'),/publication is not approved/);
  assert.throws(()=>catalogAccess({...settings,catalogMode:'apiPreview'},'build','production'),/publication is not approved/);
  assert.equal(catalogAccess({...settings,publicCatalogApproved:true},'build','apiPreview'),true);
});
test('API preview is available locally without enabling public publication', () => {
  assert.equal(catalogAccess(settings,'serve','apiPreview'),true);
  assert.equal(catalogAccess(settings,'serve','development'),false);
  assert.equal(settings.publicCatalogApproved,false);
});
