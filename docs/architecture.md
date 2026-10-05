# Architecture and product decisions

## Why this stack

Vite, strict TypeScript, semantic HTML, CSS, and native dialogs provide a lightweight static prototype for GitHub Pages. React or Angular could support a larger application, but this single catalog does not need a component framework, router, or state library. The filtering domain stays reusable if a framework is added later.

## Source map

| File | Responsibility |
| --- | --- |
| `src/domain.ts` | Normalized title, preference, offer, and adapter contracts |
| `src/catalog.ts` | Twenty fixture entries; catalog/availability implementations |
| `src/filter.ts` | Pure content, maturity, provider, and search filtering; independent art decision |
| `src/preferences.ts` | Safe defaults, versioned parsing, and failure-aware browser persistence |
| `src/providers.ts` | Provider registry and honest homepage launch adapter |
| `src/ui.ts` | Escaped rendering helpers for cards, features, switches, and icons |
| `src/main.ts` | Interaction orchestration and small in-memory state |
| `src/styles.css` | Cinema theme, responsive grid, dialogs, touch and focus states |
| `scripts/create-artwork.mjs` | Reusable original SVG illustration source |
| `public/artwork` | Runtime illustration exports, one per title |
| `tests` | Filtering, art independence, persistence validation, fixtures, and launch semantics |

The flow is `CatalogSource.list → preferences + transient search/provider scope → filterTitles → feature/grid/details`. `AvailabilitySource.offersFor → subscribed offers → ProviderLauncher.resolve → external provider action` is separate. Future adapters can replace data/launch behavior without rewriting filtering or discovery rendering.

## Household rules

- Subscriptions identify catalogs to include; the service tabs are a separate temporary browse scope.
- Hide Horror excludes both horror and scary-theme annotations; Hide Halloween / seasonal excludes Halloween and other annotated holidays, including Christmas. Neither depends on a marketing season or today's date.
- Rating bands combine film and television labels for the demo: G/TV-G; PG/TV-PG; PG-13/TV-14; R/TV-MA. This is a UI convenience, not an assertion that film and TV rating standards are identical. Production must normalize by region and retain original labels.
- Default hide flags are on, while the default maturity ceiling includes all rated titles. Households choose their own restrictions.
- Unknown maturity is hidden unless explicitly included. Production needs an explicit unknown/review-needed policy for content annotations too; empty demo flags are not a safety guarantee.
- Promotional-art decisions operate on the individual asset, not just a title's genre. Unknown/disturbing art can be replaced. Seasonal promotional art is replaced when seasonal hiding is enabled. The title remains unless a content rule independently excludes it.
- All surfaces use the same predicate. Filtering out a currently open title also closes its details. Search does not bypass preferences.

## State and accessibility

Only preferences persist, under `viewport.preferences.v1`, with `{ version: 1, preferences }`. Invalid fields fall back to defaults; unknown provider/topic values are discarded. Persistence failure produces a visible message while allowing use during the visit. Local settings are not tamper-resistant parental controls and have no PIN.

Use semantic buttons, label-associated inputs, switch roles, accessible live result counts, visible focus, a skip link, reduced-motion support, and native dialog focus/escape behavior. Provider links identify their website destination and new-tab behavior. A later tvOS interface must replace touch/keyboard interaction assumptions with focus-engine navigation and remote testing.

## Intentional boundaries

The prototype proves discovery and filtering. It does not prove native deep links, provider entitlement, up-to-date catalogs, automated classification, official promotional-art reuse, or parental enforcement. Provider names are destination labels; Viewport has no affiliation. Native development starts with the launch probe, before investment in a full Apple TV catalog UI.
