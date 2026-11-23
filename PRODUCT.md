# 知更 · ZHIGENG

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User requires GitHub Pages hosting and an OpenAI-compatible AI service. Vite, React and TypeScript provide a static frontend; Python and GitHub Actions handle scheduled collection and report generation. No application server or database is required.

## Product Purpose
Aggregate Follow Builders, GitHub Trending and configurable RSS subscriptions into a daily digest. Research a topic using source links and supplied transcripts. Retain reports, citations, original source material and collection status.

## Users
Assumption: a Chinese-speaking individual following AI developments and researching multimedia material.

## Operating Context
GitHub Pages serves generated JSON and static assets. Actions runs daily at 08:17 Asia/Shanghai, with catch-up checks at 08:47, 09:17 and 10:17, and on demand. Every run checks the latest default branch under the shared generation lock: a completed real digest for the local date skips collection, model calls and publication. This includes original-text collections; only an explicit manual force overrides the guard. API credentials exist only in repository Secrets. The website submits research requests as GitHub issues; a repository owner or collaborator authorizes processing through their repository role.

## Capabilities and Constraints
Read digests, filter sources, search, browse the calendar, read Markdown research and export reports. Configure sources through a versioned JSON file. Public articles and available video subtitles are extractable; restricted pages require supplied text. Web search is optional through Tavily. Without an AI key, collection still works but is identified as an original-text collection. The destination repository is `xiaoxiaoqing-win/ai-daily`; deployments must continue to support its GitHub Pages subpath.

## Brand Commitments
Name: 知更 / ZHIGENG. Tagline: 日有所知，思有所进. A Chinese-language personal AI reading space where daily reading and deep research have equal importance. The identity uses public-library wayfinding: a light neutral navigation shell, grey-white reading fields and low-saturation blue accents with pale blue selection and restrained warm ochre research accents. A bird symbol accompanies the wordmark as an SVG icon. Clear source availability, citations and comfortable sustained reading are durable brand commitments; the implemented visual system is recorded in DESIGN.md.

## Product Principles
- Distinguish generated analysis, collected source material and examples.
- Preserve citations and expose failed or stale sources.
- Summarize incremental evidence only: exclude links already covered in earlier real editions and dated material older than the prior collection. With no new evidence, do not call the model or fabricate another edition; show the latest check state.
- Keep credentials outside the browser and repository content.
- Support repeatable deployment to a repository subpath.
