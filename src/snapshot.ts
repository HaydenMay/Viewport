import type { AvailabilitySource, CatalogSource, Offer, Title } from './domain.ts';
import type { TitlePageLink } from './title-links.ts';

export interface CatalogSnapshot {
  version: 1;
  generatedAt: string;
  languagePolicy?: 'english-original';
  titles: Title[];
  offers: Offer[];
  links: TitlePageLink[];
}
// Build-generated, normalized data only. The browser never authenticates to sources.
export class SnapshotSource implements CatalogSource, AvailabilitySource {
  private snapshot: CatalogSnapshot;
  private offers: Map<string, Offer[]>;
  constructor(snapshot: CatalogSnapshot) {
    if(snapshot.languagePolicy === 'english-original' && snapshot.titles.some(t=>t.metadata?.originalLanguage !== 'en' || t.metadata?.languageEvidence !== 'availability-query')) throw new Error('Unconfirmed original language in English-only catalog');
    if (snapshot.version !== 1 || !snapshot.titles.length || snapshot.titles.length > 1000 ||
      new Set(snapshot.titles.map(x => x.id)).size !== snapshot.titles.length) throw new Error('Invalid catalog snapshot');
    this.snapshot = structuredClone(snapshot);
    this.offers = new Map();
    for (const offer of this.snapshot.offers) this.offers.set(offer.titleId, [...(this.offers.get(offer.titleId) ?? []), offer]);
  }
  async list(): Promise<Title[]> { return structuredClone(this.snapshot.titles); }
  async offersFor(titleId: string): Promise<Offer[]> { return structuredClone(this.offers.get(titleId) ?? []); }
}
