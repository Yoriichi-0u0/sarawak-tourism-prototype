# Visual direction and design system

Reference: `design-concept.png`, generated with the built-in imagegen tool before implementation. It presents a desktop discovery screen and mobile continuation. The concept is an internal working design selected under the user's request to design and build autonomously; it is not described as user-approved.

## System

White page background, dark pine-green type and controls, a quieter pale-green selection surface, thin neutral borders, and generous breathing room. Lora provides editorial headings; DM Sans handles navigation, labels, and forms. The compass brand mark and outline icons form a consistent visual language.

- Primary pine: `#154c3b`; heading: `#102f27`; body: `#213630`.
- Muted copy: `#64716c`; border: `#dce3df`; selected category: `#e1efe7`.
- Main container: up to 1440 px, 48 px desktop gutters; 20 px phone gutters.
- Buttons: 44 px default height, restrained 9 px radius, outline secondary action.
- Photography: stable crops and rounded frames; subtle bottom gradient only to make photo copy readable.
- Catalogue: three columns on desktop, two on tablet, one on phones; no nested dashboard cards.
- Mobile: separate heading phrases, stacked search/region/action, horizontally scrolling interests, fixed bottom navigation with safe-area spacing.
- Detail dialogs: two columns on desktop, vertically stacked photo and content on mobile; Escape closes and focus returns to the previous control.

## Comparison ledger

| Aspect                   | Concept evidence                                                               | Implementation comparison and action                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Primary copy             | Discovery headline, supporting sentence, scenic-route photo copy               | Preserved exact headline, subtitle, photo heading, and action labels; split the headline into sensible phrases on mobile |
| Information architecture | Discover, Stays, Getting around, Food & drink, Saved, My trip                  | Preserved; management reached through footer/mobile menu, as required by the SRS                                         |
| Typography               | Editorial serif heading, crisp sans-serif controls                             | Self-hosted Lora/DM Sans; explicitly styled controls and captions; checked mobile line breaks                            |
| Palette                  | White background, dark forest green, pale-green selected interest              | Matched code tokens; no cream page background or extraneous gradients                                                    |
| Header and icons         | Compass mark, outlined heart/map, selected nav underline                       | Replaced initial simple Lucide compass brand with a custom cardinal compass mark; retained consistent outline controls   |
| Containers and spacing   | Open catalogue, wide scenic photo, one search control band                     | Kept the same hierarchy; reduced desktop hero/header spacing to bring more catalogue content into the first viewport     |
| Assets                   | Rainforest river, sandstone coast, traditional architecture, orangutan         | Separate original illustrative images generated for implementation; concept bitmap is not embedded as the UI             |
| Responsive behavior      | Compact heading, stacked search, horizontally scrollable interests, bottom nav | Implemented and inspected at 390 px; overflow checks cover 320, 390, 768 and 1440 px                                     |

Intentional differences: imagery was separately generated and therefore is not pixel-identical to the concept. The concept board's illustrated mobile column has different proportions from a real 390×844 browser viewport; real content is allowed to continue below the fold. A small comparison action supports the SRS. Downstream itinerary, transport, reports and management forms were extended using the same design system. Accurate prototype/privacy/provider notes are included in context and the footer.

The discovery surface was compared with the concept through `view_image`. Functional checks were performed in the in-app browser. Its large-viewport screenshots were clipped/incorrectly composited, so final screenshots use Playwright with a separate headless Microsoft Edge session. Temporary in-app viewport/CDP overrides were cleared.
