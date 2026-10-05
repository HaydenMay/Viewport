import type {
  AvailabilitySource,
  CatalogSource,
  Offer,
  ProviderLauncher,
  Title,
} from "./domain.ts";

export function titleLinkedOffers(
  offers: Offer[],
  launcher: ProviderLauncher,
): Offer[] {
  return offers.filter((offer) => launcher.resolve(offer).exactTitleResolved);
}

// Project availability into discovery before content filtering. A link for one
// service never makes another service's offer launchable. Raw fixtures stay intact.
export async function loadLaunchableCatalog(
  catalog: CatalogSource,
  availability: AvailabilitySource,
  launcher: ProviderLauncher,
): Promise<Title[]> {
  const titles = await catalog.list();
  const linked = await Promise.all(
    titles.map(async (title) => {
      const offers = titleLinkedOffers(
        await availability.offersFor(title.id),
        launcher,
      );
      return {
        ...title,
        providerIds: [
          ...new Set(
            offers
              .filter((offer) => offer.titleId === title.id)
              .map((offer) => offer.providerId),
          ),
        ],
      };
    }),
  );
  return linked.filter((title) => title.providerIds.length > 0);
}
