# 第二号 design system

Reference: user-provided screenshot; preserve its light editorial product interface, centered Chinese masthead, blue emphasis, daily list with a calendar, and report previews.

## Tokens

- Canvas: `#f7f8fa`; paper: `#ffffff`; foreground: `#232832`.
- Primary: `#2861ee`; primary hover: `#164bce`; primary tint: `#eaf0ff`.
- Secondary text: `#596a82`; reading text: `#4f5e73`; line: `#e5e8ee`.
- System Chinese sans stack: Apple system, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif. Preserve native Chinese rendering from the reference.
- Masthead 43px desktop / 33px phone; page heading 30px / 23px; article body 15px; UI body 12–15px; metadata 10–12px. Small text is limited to secondary details and is a known visual validation target.
- Content max-width: 1160px including 40px gutters. Desktop aside: 276px; gap: 27px. Article max-width: 960px.
- Card radius: 10–12px; control radius: 6–7px; one-pixel border; shadows reserved for search dialog and small brand mark.

## Components

Header with current-route navigation and Cmd/Ctrl-K search. Centered homepage masthead. Latest daily edition and two compact previous editions. Availability calendar: only published dates are actionable. Three-column research area: two editorial previews and a new-task entry. Safe Markdown article reader with deterministic citations and export. Source configuration links to the actual repository file.

## Responsive

760px: one-column daily layout; calendar removed from homepage, reports retain two columns. 440px: menu toggle, one-column reports, centered new-report entry. Hash routes avoid GitHub Pages deep-link failures.

## States and motion

Explicit demonstration banner, collection-only labels, source error/empty states, loading, search with no results, unavailable article, research validation and prepared task state. Keyboard focus, themed selection and reduced-motion support. One masthead reveal uses clip-path and blur; no repeated card entrances.
