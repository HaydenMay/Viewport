# Viewport

A unified streaming discovery prototype: choose your subscriptions, browse one catalog, and control what surfaces in your household. Viewport is a working name and is not a kids-only app.

## Try the prototype

**Live:** [Open Viewport](https://haydenmay.github.io/Viewport/) · [Public repository](https://github.com/HaydenMay/Viewport)

Milestone **1.5** adds title-specific provider links.

Choose services in **Preferences**, search across them, or scope the catalog to one provider. **Hide Horror**, **Hide Halloween / seasonal**, and the maturity limit apply immediately to both the catalog and the featured title. Preferences also offer violence, sexual-content, and strong-language exclusions. **Use neutral artwork** replaces a promotional image independently of whether the title itself is acceptable. Preferences persist on this browser only.

This milestone includes 20 representative real movie/show names across Disney+, Hulu, Netflix, Prime Video, and Max. Metadata is manually entered sample data, with original summaries and original SVG illustrations. **Availability, content annotations, and promotional-art flags are illustrative, not verified current availability or comprehensive content advice.** No service is scraped, no API key is needed, and no official posters are included.

**Watch on [provider] uses an official title page for 17 sample destinations.** The button labels distinguish title pages from homepage fallbacks. Max’s four illustrative offers remain homepage fallbacks because no usable official title destination was confirmed. Native exact-title app launching on iOS, iPadOS, and tvOS remains unverified. Sign-in, region, and subscription restrictions may still intervene. This prototype does not alter provider home screens, advertisements, profiles, or recommendations after launching them.

## Develop

Use Node **22.18+** (or Node 24).

```sh
npm ci
npm run dev
```

```sh
npm test          # Node behavior tests
npm run build    # strict TypeScript check + Vite production build
npm run verify   # both
npm run preview  # serve the built output locally
npm run artwork  # regenerate original SVG illustrations from source
```

Vite uses relative asset paths so the build works at the GitHub Pages repository subpath `/Viewport/`, without hard-coded owner URLs. The app has one route; native dialogs keep navigation compatible with static hosting. Search and service-browse scope are transient. Versioned preferences are validated before loading.

## GitHub Pages

The included [.github/workflows/pages.yml](.github/workflows/pages.yml) installs locked dependencies, runs tests/type checking/production build, uploads `dist`, and deploys on pushes to `main`. Pull requests run validation without deployment.

1. Create a **public** repository named **Viewport** under the connected account, using `main` as its default branch.
2. Push these sources, including `package-lock.json` and `.github/workflows/pages.yml`.
3. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Confirm the workflow's `build` and `deploy` jobs pass, then use its emitted Pages URL.
5. On the deployed site, repeat search, service selection, immediate hide/show, details, reload persistence, and title-page and homepage-fallback link checks. Check the browser console and asset responses. A successful local build is not proof of deployed-site correctness.

Publication status and actual validation evidence are in [docs/verification.md](docs/verification.md). Title URL provenance and limitations are in [docs/title-link-evidence.md](docs/title-link-evidence.md).

## Architecture and next milestone

- [Architecture and product decisions](docs/architecture.md)
- [Fixture provenance and future TMDB/availability architecture](docs/data-sources.md)
- [Disney+, Hulu, Netflix, Prime Video, and Max deep-link validation matrix](docs/deep-link-validation.md)
- [Smallest native Apple launch probe](docs/native-probe.md)
- [Implementation design](docs/superpowers/specs/2026-10-05-viewport-design.md)

There are no accounts, payments, production backend, AI classifiers, telemetry, or commercial API subscriptions. No open-source license is selected by this prototype; third-party tools retain their own licenses. Original artwork sources and exports are preserved for future work.
