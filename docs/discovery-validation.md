# Discovery feedback and catalog validation

## Filtering explanations

Discovery reports one reason per hidden title, in priority order: missing rating, above maturity limit, horror/scary, seasonal, other blocked content. Each reason is counted only within the selected services/provider scope. A title affected by several filters is counted once, so totals agree with the visible result count.

Explicit search applies service and maturity restrictions but permits content-hidden matches with their existing warning. Search summaries describe only matches for that query, not hidden titles elsewhere in the catalog. If matches are blocked by maturity settings, the empty state explains this without displaying names, artwork, IDs or launch actions. A query with no loaded matches gets a different message that explains the prototype searches its loaded catalog, not the whole streaming universe. Preferences remain locally editable; this is not PIN-protected parental control.

## Availability dates

Normalized offers retain their original `checkedAt`, independently of when a snapshot was generated. Imported title details use the oldest check date among the selected providers displayed there. At seven days or more, details say availability may be out of date. Missing, invalid or future dates are described as unavailable rather than fresh. Seven days is an informational threshold, not a guarantee that younger data is correct and not a reason to disable a checked launch URL. Prototype offers retain their illustrative label.

## Automated checks

The suite tests scoped explanations, overlap between maturity/content controls, search exceptions, unknown and wrong-media ratings, duplicate record/provider-offer merging, missing year/description/genres/art, and old availability timestamps. The browser QA tests the distinction between a maturity-blocked search and no matches, and existing destination/navigation preservation.

All catalog edge cases use synthetic test fixtures. No new API records are published and no API requests are needed for these checks. Live data publication remains pending licensing clarification.

## Quick iPhone check

1. Search **Scream** with Paramount+ selected and All rated titles. Its search card should carry the content-preference warning when Hide Horror is on.
2. Set the maturity limit to **Up to PG-13 / TV-14**. Scream should disappear and the empty state should say **Matches hidden by maturity settings**. No title card or Watch action should remain.
3. Search **no-such-loaded-title-zzzz**. The message should say **No matches in your selected services**, rather than blaming maturity settings.
4. Clear search and change Hide Horror / Hide seasonal. The result count and reason counts should update immediately. Return to your preferred settings afterward.
5. Open a familiar Disney+, Hulu, Netflix or Paramount+ title and confirm the existing title-specific Watch action still opens correctly. Prime/Peacock remain optional web destinations.

## Checklist for future imported title links

For each selected title/provider, record: title and media type, IMDb/TheTVDB ID from opt-in diagnostics, destination URL, iPhone/iPad model, OS/app version, login state, and whether it opened the correct title in the native app or browser. Test the normal Watch action first. If it fails, return and test the web fallback. Record wrong-title and homepage results separately; a valid URL shape is not native verification. Provider-level results do not verify every imported link.

Current native provider observations remain Netflix, Disney+, Hulu and Paramount+. Prime/Peacock are web-only based on the user's tests. The validation pass does not change those capabilities or any fixture URL.
