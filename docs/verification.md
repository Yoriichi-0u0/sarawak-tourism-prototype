# Verification evidence

Verified on 27 September 2026. These checks establish prototype behavior, not production security, live booking operations, SRS performance targets, or representative-user usability validation.

## Build and domain checks

`npm test` passes six tests covering combined search filters and unpublished listings, Unicode trip links and deduplication, malformed/oversized shared payloads and invalid dates, dates crossing month boundaries, reordering with interleaved days, and HTTPS-only provider links.

`npm run build` passes strict TypeScript checks (including unused locals/parameters) and the Vite production build. Initial installation reported zero dependency vulnerabilities. Fonts are self-hosted Latin subsets; images are WebP.

## Browser behavior

The in-app browser was used first to exercise saved places, attraction details, adding to a trip, transport suggestions, creating/editing/archiving/restoring listings, and actual browser-local activity counts. The in-app browser produced clipped/composited screenshots at large viewport overrides, so Playwright CLI with a separate headless Microsoft Edge session was used for screenshot and responsive verification. No user browser profile was reused.

| Check                                                      | Result                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Search with no matches and clear-filters recovery          | Passed                                                                                            |
| Miri region filter and nature interest filter              | Passed                                                                                            |
| Two-place comparison and clear comparison                  | Passed                                                                                            |
| Accommodation detail provider handoff link                 | Passed; external booking not performed                                                            |
| Add a place, rename trip, start date, move to Day 2, notes | Passed                                                                                            |
| Day labels for a trip beginning 2 October                  | Correctly show 2, 3, and 4 October                                                                |
| Share URL, explicit import, reload persistence             | Passed                                                                                            |
| Itinerary text export                                      | Downloaded; trip dates, day grouping, and note verified                                           |
| Local activity CSV export                                  | Downloaded; rows and columns verified                                                             |
| Management create, edit, archive, restore                  | Passed in the in-app browser                                                                      |
| Management idle expiry                                     | Active at 14 minutes; expired after 15 minutes plus interval tick using a simulated browser clock |
| Browser console                                            | Zero errors or warnings in the verification session                                               |

The initial idle-timeout harness installed its clock after existing timers were running. Installing before the page reload and new management session corrected that instrumentation; the isolated check passes. Two actual itinerary issues found during development were fixed: dates now advance per day, and reordering searches for the next item in the same day even when another day is interleaved.

## Responsive and visual verification

All seven screens (Discover, Stays, Food & drink, Getting around, Saved, My trip, Management demo) were checked at 1440, 768, 390, and 320 px widths: 28 checks, zero horizontal page overflow, all image assets decoded successfully. Mobile management uses adaptive listing rows with visible actions rather than requiring horizontal table scrolling.

Screenshots were captured at 1440×1080 and 390×844. Additional 1157×1024 desktop and 379×1024 mobile captures approximate the two panels of the native 1536×1024 generated concept board. The concept and browser screenshots were inspected with `view_image`; copy, navigation, typography, palette, photo treatment, spacing, and responsive behavior were compared. See `design.md` for the fidelity ledger. Original photos differ intentionally from the concept; downstream screens extend its design system.

No physical phone acceptance, formal accessibility audit, stakeholder acceptance, production authorization test, load test, or live-provider booking test is claimed.

## Publishing

The application is deployed as a static Vite site on Vercel at [sarawak-tourism-prototype.vercel.app](https://sarawak-tourism-prototype.vercel.app/). An unauthenticated HTTPS request returned **HTTP 200**, and a fresh browser session opened the actual prototype without a login page. Vercel reported production state **READY**.

[The public GitHub repository](https://github.com/Yoriichi-0u0/sarawak-tourism-prototype) contains only the prototype and its project notes, not the supplied course PDFs/DOCX files. Its `main` branch is connected to Vercel for future deployments. Supabase is not used for this local UI/UX demonstrator.

The public deployment repeated all **28 responsive checks** at 1440, 768, 390 and 320 px: no page overflow and all image assets loaded. On the live site, saving/adding a place, itinerary date labels, sharing, explicit import, reload persistence, and mobile management editing passed. Public browser verification recorded zero console errors or warnings. A test selector initially expected an entry-specific Edit name; the actual row contains an Edit button, and the corrected row-scoped check passed. The final native mobile capture explicitly loaded lazy images to avoid waiting for offscreen image decoding.

The final deployed [desktop](screenshots/desktop.png), [mobile](screenshots/mobile.png), and [mobile management](screenshots/management-mobile.png) previews were visually inspected. The design concept and native-size comparisons were also inspected. All temporary browser viewport overrides were reset; the public site is kept as the user-facing output.
