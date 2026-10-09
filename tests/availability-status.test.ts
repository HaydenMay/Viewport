import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availabilityStatus } from '../src/availability-status.ts';
const now=new Date('2026-10-09T00:00:00Z');
test('availability status uses the oldest displayed offer and does not call future or missing dates current', () => {
  assert.equal(availabilityStatus(['2026-10-08T00:00:00Z'],now),'Availability checked 2026-10-08. Availability can change.');
  assert.equal(availabilityStatus(['2026-10-08T00:00:00Z','2026-09-01T00:00:00Z'],now),'Availability last checked 2026-09-01; it may be out of date.');
  for(const stamps of [[],[undefined],['invalid'],['2026-10-10T00:00:00Z']])
    assert.equal(availabilityStatus(stamps,now),'Availability check date unavailable. Confirm availability with the provider.');
});
