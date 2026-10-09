export interface CatalogSettings {
  catalogMode: 'prototype' | 'apiPreview';
  publicCatalogApproved: boolean;
}
export const catalogSettings: CatalogSettings = {
  catalogMode: 'prototype',
  publicCatalogApproved: false,
};

export function catalogAccess(settings: CatalogSettings, command: 'build' | 'serve', mode: string): boolean {
  const requested = settings.catalogMode === 'apiPreview' || mode === 'apiPreview';
  if (requested && command === 'build' && !settings.publicCatalogApproved) {
    throw new Error('API catalog publication is not approved. Use npm run dev:catalog for local testing.');
  }
  return requested;
}
