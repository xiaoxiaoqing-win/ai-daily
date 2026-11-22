---
name: "知更 · ZHIGENG"
description: "日有所知，思有所进"
colors:
  ink: "#282d38"
  muted: "#657080"
  accent: "#526895"
  accent-hover: "#40547f"
  sidebar-bg: "#fafbfc"
  accent-soft: "#edf1f8"
  selection: "#e5ebf7"
  paper: "#ffffff"
  canvas: "#f7f8fa"
  line: "#e2e6ed"
  ochre: "#795a2c"
  focus: "#647eac"
  reading: "#3f4858"
  error: "#a23c31"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "clamp(28px, 2.6vw, 38px)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.035em"
  headline:
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  title:
    fontSize: "19px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontSize: "16px"
    lineHeight: 1.95
  label:
    fontSize: "12px"
  date:
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif'
    fontSize: "43px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.04em"
rounded:
  tag: "4px"
  compact: "6px"
  control: "7px"
  navigation: "8px"
  date: "9px"
  process: "12px"
  surface: "14px"
spacing:
  inline-tight: "8px"
  inline: "12px"
  control-x: "18px"
  mobile-gutter: "22px"
  panel: "24px"
  columns: "28px"
  section: "34px"
  gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  field:
    backgroundColor: "#fcfcfe"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  navigation-active:
    backgroundColor: "{colors.selection}"
    textColor: "#425b8c"
    rounded: "{rounded.navigation}"
    height: "47px"
  filter-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.compact}"
    padding: "8px 12px"
  digest-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "23px 24px"
  edition-date:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.date}"
    padding: "10px 12px"
---

# Design System: 知更 · ZHIGENG

## Overview

**Creative North Star: "The Public Library Reading Space"**

知更 is a personal AI reading space shaped by contemporary public-library wayfinding. Light neutral navigation gives the collection a stable address; grey-white reading fields, pale blue date markers and restrained blue selection make it easy to move from daily discovery into sourced research.

The interface is calm, practical and information-rich. Chinese system sans typography, compact metadata and clear document surfaces support both a short daily visit and a longer reading session. The bird wordmark is a lightweight SVG symbol; the identity does not depend on photographic or raster decoration.

**Key Characteristics:**

- Persistent light neutral navigation and grey-white reading surfaces.
- A date spine connects the latest edition to the availability calendar.
- Daily reading and deep research share the same document vocabulary.
- Color and explicit labels communicate source and generation states.

## Colors

### Primary

Low-saturation blue (`accent`) carries primary actions, links and date numerals. Its deeper hover partner supplies an immediate action response. The light neutral sidebar (`sidebar-bg`) is separated from the reading area by a fine line border.

### Secondary

Pale blue (`accent-soft`) groups dates and supporting explanations. The blue-tinted selection field (`selection`) marks the active navigation destination and text selection. These are purposeful wayfinding fields rather than general decoration.

### Tertiary

Warm ochre (`ochre`) accompanies extraction limitations and research-related warm surfaces. Error red (`error`) is reserved for failed status and form feedback.

### Neutral

Canvas and white paper separate the workspace from documents; ink establishes headings and reading color supplies long-form prose. Muted text handles metadata, while the line token supports restrained grouping. Focus blue is the shared keyboard outline.

**The Reading Field Rule.** Keep article text and navigation on light surfaces; use restrained blue for actions and selection.

## Typography

**Display and Body Font:** the native Chinese-capable system sans stack in the frontmatter. No external font download is required. **Date Font:** Avenir Next with Segoe UI and sans-serif fallbacks, with tabular numerals.

The type is workmanlike and quiet: weight, measure and spacing establish hierarchy. Homepage greeting uses the fluid display token; route titles use headline; section titles use title. Featured digest titles are 22px with 1.6 line-height, reducing to 20px at 1200px. Ordinary digest titles are 18px with 1.65 line-height.

Reader title uses `clamp(25px, 2.4vw, 35px)`, weight 600 and 1.6 line-height. Reader prose uses the body token, a maximum measure of 75ch and paragraph spacing; at 760px it becomes 15px. Reader summary is 16px with 1.9 line-height, becoming 14px on mobile. Most application copy is 12–14px; metadata is 10–12px, with 9px confined to compact secondary details. Do not apply metadata sizing to article prose.

## Layout

The desktop shell has a fixed 216px rail, an 80px utility header and 48px horizontal content gutters. Main children cap at 1280px; the header caps at 1440px. The main reading overview and daily archive use a fluid content column with a 286px aside and a 28px gap. Research cards use three columns with 19px gaps. New research pairs a fluid form with a 280px guide and a 32px gap. Reader paper caps at 920px with 44px vertical padding and `clamp(24px, 4vw, 70px)` horizontal padding.

The spacing vocabulary is observed rather than a rigid mathematical scale: 8–12px within controls, 18–24px within cards, 28px between overview columns, and 34px before research and source sections.

- At **1700px and wider**, main gutters expand to center the 1280px content field after the rail.
- At **1200px and below**, the rail becomes 192px, gutters become 30px, the aside becomes 260px with a 22px gap, research becomes two columns, and the new-report card spans both columns. Sources become two columns. The form guide becomes 225px.
- At **1000px and below**, overview and archive become one column. The homepage calendar is hidden in the intermediate tablet range; the archive calendar remains below the list beside its support panel. The research invitation and new-research form become single-column; the form guide uses three horizontal steps. Settings omit the source-type column.
- At **760px and below**, the rail is replaced by a sticky 64px header and an expandable light navigation drawer. Gutters become 22px, research cards become one column, and the homepage calendar returns beneath the digest. Archive support and form-guide steps stack. Reader paper uses 25px × 20px padding. Featured date and title share a grid row; the summary spans the card width.
- At **380px and below**, gutters become 16px and the greeting, date spine and featured card compact further.

## Elevation & Depth

Resting documents and cards have no shadow. White paper, muted blue-grey regions and one-pixel borders establish depth. Overlays carry the only structural shadows: search dialog (`0 22px 80px #202b4038`) and mobile navigation (`18px 16px 40px #202b4033`). The search backdrop uses a translucent blue-grey field (`#202b4070`).

**The Quiet Depth Rule.** Use borders and tonal fields for resting content; reserve shadows for overlays.

## Shapes

The reusable surface radius is softly rounded (14px). Controls use 7px; navigation uses 8px; date spines and source icon fields use 9px; compact filters use 6px; tags use 4px. The process diagram uses 12px icon tiles. Cards rely on a single border and generous internal spacing, while source shelves use open rows between horizontal rules. The bird mark and interface icons are SVG line symbols from the existing icon vocabulary.

## Components

### Buttons

Primary controls are compact blue rectangles with white text, 10px × 18px padding, a 42px minimum height and 7px corners. Hover uses deeper blue. Secondary controls are white with blue text and a line border; hover uses a pale blue field and a stronger border. Small controls use 8px × 13px padding and a 35px minimum height. Disabled controls use 0.55 opacity and a default cursor.

### Inputs / Fields

Research fields use an almost-white fill, a pale blue-grey border, 7px corners and 12px × 14px padding. Focus strengthens the border and turns the field white; keyboard focus retains the shared 3px outline with a 4px offset. The report-search wrapper uses its own 2px focus-within outline. Placeholders stay visible and multiline fields resize vertically.

### Navigation

The light neutral rail uses muted slate labels and 47px-tall destinations. Hover adds a pale neutral field with blue text; the active destination uses a pale blue selection field with blue ink and stronger weight. Mobile destinations grow to a 50px minimum height inside the expandable drawer. The skip link appears on focus and moves focus into the main content without changing routes.

### Chips / Filters

Filters use 6px corners and 8px × 12px padding. Unselected filters use muted text and gain pale blue on hover; selected filters use blue with white text. Generation tags are smaller 4px badges; their label distinguishes examples, AI output and original-text collections independently of color.

### Cards / Containers

Digest cards use white paper, a line border, 14px corners and 23px × 24px padding; hover strengthens the border and lightly tints the surface. The featured edition has a pale blue date spine and a separated footer. Report cards use the same silhouette with a colored source-cover strip and 22px content padding; warm covers distinguish research material. New-research invitations use a pale blue-grey field rather than a paper-card shadow.

### Calendar and Date Spine

The date spine uses a vertically stacked month, large tabular day and weekday on pale blue. Calendar cells repeat the blue/pale blue vocabulary: only published dates are enabled; hover turns an available date blue with white numerals. Today has a fine inset outline; an available today is blue-filled. Calendar and date labels remain real content rather than decorative numbers.

### Search and Reader

Search opens on a blue-grey backdrop in a white dialog capped at 640px; result rows gain a pale blue hover field. Reader paper carries a clear title, summary, generation notice, Markdown body, limitations and references. Links underline on hover or within prose, and tables/code scroll within their own width.

### Focus and Motion

Interactive controls share the global focus-visible outline. State transitions last 0.18s for background, color and border. The homepage greeting has one visible-by-default 0.55s entrance, moving upward by 6px using `cubic-bezier(0.16, 1, 0.3, 1)`. Loading uses a 1s linear spinner. Reduced-motion preference disables animations and transitions and restores automatic scrolling. No repeated card entrance sequence is implemented.

## Do's and Don'ts

### Do:

- **Do** use low-saturation blue for primary actions and a pale blue field for the active navigation item.
- **Do** keep date availability, source failures and generation modes explicit.
- **Do** preserve a visible keyboard focus treatment and reduced-motion behavior.
- **Do** keep reader prose at its implemented comfortable measure and allow long links and tables to wrap or scroll.

### Don't:

- **Don't** use a dark forest navigation shell; keep navigation in the light neutral surface system.
- **Don't** add resting card shadows where borders and tonal fields already establish grouping.
- **Don't** turn unavailable calendar dates into actionable controls.
- **Don't** replace real content or collection status with invented activity.
