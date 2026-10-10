# Catalog source permissions

## Movie of the Night

On October 10, 2026, the owner supplied a provider reply confirming that the described Viewport use case is allowed. The request described a commercial consumer discovery app periodically caching 300–1,000 titles, supplying a normalized browser-readable static catalog, providing attribution, keeping keys private, using original covers, and offering no standalone data product. Keep the original correspondence with the owner's licensing records.

Terms supplied by the owner: https://developers.movieofthenight.com/terms-and-conditions

- Section 3 permits commercial consumer applications and end-user display. Do not offer a standalone database, data API or catalog download, or substantially replicate the upstream Service.
- Section 4 requires the linked credit: “Streaming availability information is provided by Streaming Availability API by Movie of the Night.” The link is https://www.movieofthenight.com/about/api. Snapshot builds display it in the catalog footer and About → Data sources. Fixture-only builds do not claim upstream availability data.
- Section 6 permits caching for the application's functional needs and continued use after a subscription ends, subject to the terms. No mandatory refresh interval is specified. Refresh availability for product accuracy; keys remain in build-time secrets.
- Section 5 does not grant rights to third-party posters, backdrops, descriptions, logos or other third-party content. The API approval does not establish those rights. Viewport uses original abstract covers; metadata rights must be assessed by source.
- On a provider removal notice, promptly stop displaying and delete affected third-party content. Identify records by stable source IDs, remove affected fields/assets from snapshots and caches, rebuild/redeploy, and remove retained copies from artifacts and previous hosted versions where applicable. This is a manual operating obligation, not an automated takedown system.
- Respect request quotas. Do not use upstream data to train, fine-tune, evaluate or improve AI/ML systems (Section 10).

## Other sources

Movie of the Night's confirmation does not approve TheTVDB distribution or third-party artwork. TheTVDB confirmation remains outstanding for publishing the combined metadata snapshot. Preserve the private preview audience and the public fixture-only build until that source is cleared. No public catalog approval flag was enabled by this documentation update.
