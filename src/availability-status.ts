// Seven days is a freshness notice, not an entitlement or expiry decision.
// Old/missing dates never prevent launching an otherwise accepted title URL.
export function availabilityStatus(stamps: (string | undefined)[], now = new Date()): string {
  const times = stamps.map(stamp => stamp ? Date.parse(stamp) : NaN);
  const current = now.getTime();
  if (!times.length || times.some(time => !Number.isFinite(time) || time > current))
    return 'Availability check date unavailable. Confirm availability with the provider.';
  const oldest = Math.min(...times);
  const day = new Date(oldest).toISOString().slice(0, 10);
  return current - oldest >= 7 * 86_400_000
    ? `Availability last checked ${day}; it may be out of date.`
    : `Availability checked ${day}. Availability can change.`;
}
