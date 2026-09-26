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

The application is deployed as a static Vite site on Vercel. GitHub contains only the prototype and its project notes, not the supplied course PDFs/DOCX files. The production URL and final post-deployment checks are recorded in the README after deployment. Supabase is not used for this local UI/UX demonstrator.
