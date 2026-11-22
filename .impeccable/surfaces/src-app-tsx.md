---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css"]
---

# Reading space

Mode: Operate; document reader: Read. Target: src/App.tsx and src/styles.css.
The user requests a complete visual replacement and a new product name, with daily reading and deeper research equally important, and explicitly delegates the overall decision. Existing collection, research preparation, search, sources, citations, exports and published content remain product truth.

## Direction contract
THESIS: 知更 is a personal AI reading space: discover today's changes, then follow a question to its sources. Replace the centered blue masthead with a persistent light neutral navigation rail and a useful reading overview.
OWN-WORLD: Contemporary public-library wayfinding: neutral ink, cool white reading surfaces, muted blue selection, restrained warm ochre for research. Workhorse Chinese sans, clear weights, 12–16px corners, generous major-section spacing and compact metadata. A date spine anchors each current edition.
STORY: Open the latest digest, scan actual source availability, browse dates, and begin or return to a sourced research report. Never invent reports or collection status.
FIRST VIEWPORT: At 1440px, a 216px light neutral rail with bird wordmark, familiar navigation and research action; an 80px utility header; left-aligned 36px greeting with right-aligned new-research action. Below: an approximately 2:1 latest-edition/date-spine and reading-calendar split. The next research section starts within the first viewport. Source links close the overview. Mobile becomes a normal header and expandable navigation, with calendar retained below the digest.
FORM: Grounded candidate 6, public-library wayfinding. seed:c4c03d12db80f1f3. Code-led. Signature: the date spine ties the latest edition's date to the selected calendar day; actionable dates use the same pale blue field and slate-blue ink. Motion: one visible-by-default reading-space entrance, with reduced-motion support.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Grounded directions and judgment
Ordered candidates: 1 contemporary science-journal index; 2 botanical field-guide labeling; 3 cultural radio-program identity; 4 museum collection catalog; 5 Chinese modernist book-series identity; 6 public-library wayfinding; 7 university reading-room signage. These span publication, broadcast, exhibition and spatial identity systems. The roll assigned 6. The user delegated the complete choice, so no further taste-selection gate is required.
Catalog challengers: Ikeda data field declined (low familiarity and prose clarity), keeps rigorous data alignment; doujin catalog declined (thumbnail navigation conflicts with reading), keeps compact but legible metadata; Japanese high-density web competitive on familiarity, loses sustained-reading clarity, keeps useful first-screen density; jet-age ticket wallet declined (travel states are untrue), keeps visible state labels; zoo guide declined (map shapes obscure tasks), keeps clear differentiated region colors; orienteering declined (spatial controls are unnecessary), keeps consistent availability semantics. Raises: data-field alignment, catalog metadata economy, dense-web task visibility, ticket-wallet explicit states, guide-map region commitment, and orienteering consistent state meanings. These are disciplines, not borrowed visual motifs.

Physical use scene: a Chinese-speaking reader at a daylit desk, taking a short daily reading break and returning for longer research. Light reading fields reduce long-session fatigue; the light rail stays visually secondary to article text.
Documentation: replace obsolete blue-system guidance with the implemented light neutral and blue system as part of the user-authorized complete redesign. Preserve product constraints and local unrelated changes.

## Review and validation
Independent finish review disposition: ship, after resolving the sole material finding (skip-to-main must preserve the hash route and programmatically focus main). The final review scored this correction complete and found no regression in its scoped change. Validation: production build passes; 12 desktop/mobile end-to-end checks pass, including retained form values, retained reader route and keyboard focus progression. Screenshots cover 1440, 820, 390 and 360px widths with real collection data; no horizontal overflow or runtime errors were observed. Long-document captures settle at 4175px desktop and 6077px mobile and include references through S32 and the footer. Mechanical detector ran once with no findings. New visual documentation is required before closing the task.
Documentation handoff completed: PRODUCT.md, token-bearing DESIGN.md, schemaVersion 2 .impeccable/design.json with eight component previews, and the existing home surface brief now describe the implemented 知更 system. JSON/YAML, token references and component snippets were validated. No shipping raster assets were introduced. Final independent review disposition: ship (the listed accessibility correction resolved).

## User palette correction
The user explicitly rejected the dark green on 2026-11-22 (“那个墨绿色 属实有点丑”). This supersedes the initial green palette. The shell is now light grey-white, with low-saturation blue reserved for actions and selection; navigation, bird identity, date spine and layout remain. Current CSS, PRODUCT.md and DESIGN.md are the palette authority. Earlier green review evidence is historical.
