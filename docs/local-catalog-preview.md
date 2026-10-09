# Local catalog preview

The source pipeline can fetch and normalize up to 300 US Big 6 movie/show records for local development. It uses TheTVDB metadata, Movie of the Night subscription availability, and conservative Wikidata movie-rating supplementation. No posters are downloaded; neutral artwork is used. Fewer titles can be visible because selected providers, maturity limits and accepted exact-title links determine admission.

## Run on your computer

Use Node 22.18+ and run `npm ci` in this checkout. Privately supply `TVDB_API_KEY` and `STREAMING_AVAILABILITY_API_KEY` as environment variables, then:

```sh
npm run catalog:local
npm run dev:catalog
```

Open `http://127.0.0.1:4173`. Run `catalog:local` again to refresh, then restart the preview if needed. This requires a computer; it does not update the iPhone-accessible public Pages site. The preview deliberately binds only to loopback.

GitHub repository secrets cannot be read back. Those existing secrets still power the manual aggregate evaluation workflows; this local command needs credentials supplied privately on the computer running it. Do not paste keys into chat, source files, browser code, or command arguments. The command does not automatically read `.env` files.

## Storage and publication

`src/generated/catalog.json` is a normalized snapshot, saved with owner-only permissions and ignored by git. No raw API responses, credentials or source images are saved. A failed evaluation does not overwrite the last usable snapshot. A partial evaluation may save usable records; missing ratings remain unknown. CI refuses local export before making API requests. Existing Actions evaluations remain aggregate-only.

`catalog.config.ts` separates local selection from publication permission:

| Setting | Default | Meaning |
| --- | --- | --- |
| `catalogMode` | `prototype` | Normal builds use existing fixture titles; `dev:catalog` explicitly selects the local API preview. |
| `publicCatalogApproved` | `false` | API preview builds fail until public distribution approval is recorded. Local development does not require this flag. |

Normal `npm run build` excludes the private snapshot entirely, even when it exists. GitHub Pages continues serving the prototype catalog. The Boolean records an approval decision; it does not establish licensing rights. Do not set it true solely because testing is unpaid or the URL has not been shared. Public catalog distribution remains pending supplier clarification.

Provider URL handling and household defaults are unchanged. Imported links are validated candidates, not newly device-verified native links. Prime Video and Peacock remain off for new households. Unknown maturity ratings are excluded whenever a maturity limit is selected. Explicit search can reveal content-hidden titles but continues respecting maturity and provider limits. Genre-only classification cannot certify scary imagery, seasonal themes, violence, sexual content, or language.

The browser makes no supplier API requests. Only preferences are stored in browser local storage; the catalog remains the local generated file. Do not commit, publish or share that file while distribution permission is pending.

## Verification

83 automated tests, strict TypeScript and the production build passed. A synthetic 300-title snapshot loaded through the local Vite mode, supported partial search and batched rendering on a 390px viewport, and was absent from the ordinary production bundle. An API-mode build was rejected with public approval false. Production browser QA retained all 24 fixture Watch actions and passed desktop, iPad and mobile layouts without page errors. Real source data was not fetched during this implementation: credentials are retained in repository secrets rather than readable in this workspace.
