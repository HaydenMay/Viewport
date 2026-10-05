# Viewport prototype design

The binding brief is the user's first milestone: a public GitHub repository and GitHub Pages discovery prototype, with household controls across normal streaming catalogs. Viewport is a codename and is for all audiences, not exclusively children.

## Product

Use one searchable catalog of 20 representative real titles. Choose subscriptions in Preferences; browse all selected services or one service. Hide Horror and Hide Halloween / seasonal controls remain prominent, with immediate result changes. Default both on, allow all rated maturity levels, and replace disturbing/unknown artwork by default. These are editable starting preferences, not an asserted parental-control guarantee. Show title details and one Watch on action for each illustrative subscribed offer. Preference edits close a now-excluded title, and the feature panel always uses the filtered catalog.

Metadata facts, original summaries, simulated provider availability, and illustrative content/art annotations are clearly distinguished. All artwork is original SVG illustration, not official posters. Promotional-art eligibility is independent of underlying-title eligibility; a neutral replacement never removes an otherwise allowed title. Unknown maturity is hidden under a restricted ceiling, with an explicit preference to permit unrated titles.

## Architecture

Vite + strict TypeScript, native semantic HTML and CSS, no application framework or backend. Pure filtering consumes a normalized Title and Preferences. CatalogSource, AvailabilitySource, and ProviderLauncher interfaces isolate fixture adapters. Only versioned, validated preferences persist in localStorage; search and provider browse scope are transient. Storage failure leaves the app usable and shows that saving failed. A single page and native dialogs avoid Pages route rewrites.

## Experience

Dark cinema surfaces, mint accents, generous touch controls, original landscape/space/city illustrations, and visible household controls. Responsive poster grid: desktop, iPad landscape/portrait, and mobile. Keyboard focus, native modal focus management, reduced motion, accessible labels, clear empty states. No accounts, payments, AI classification, scraped data, commercial APIs, or native-launch claims.

## Launching

The fixture launcher returns only official provider homepage HTTPS links. Every action states that it opens the provider website, requires finding the title there, and does not validate an exact native-title launch. Platform-specific launch capability remains unverified in the matrix. Do not construct undocumented URL schemes.

## Validation and handoff

Test filtering, artwork independence, corrupted preference storage, subscriptions, query/provider combinations, and honest launch targets. Type-check and build static assets. Visually inspect desktop, iPad, mobile, and enlarged text. Document TMDB attribution/licensing, country/offer distinctions, availability freshness, independently sourced content annotations, and a five-provider iOS/iPadOS/tvOS deep-link matrix. Propose one small SwiftUI launch probe on real Apple devices before native catalog implementation.

GitHub connector confirms HaydenMay but cannot create repositories or enable Pages. Finish concrete tested sources first; request permission for browser fallback only if no existing repository is available. Do not substitute Sites hosting for the requested GitHub Pages destination.
