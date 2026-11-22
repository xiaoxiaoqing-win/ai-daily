# 第二号 · AI Daily

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
GitHub Pages serves generated JSON and static assets. Actions runs daily at 08:17 Asia/Shanghai and on demand. API credentials exist only in repository Secrets. The website submits research requests as GitHub issues; a repository owner or collaborator authorizes processing through their repository role.

## Capabilities and Constraints
Read digests, filter sources, search, browse the calendar, read Markdown research and export reports. Configure sources through a versioned JSON file. Public articles and available video subtitles are extractable; restricted pages require supplied text. Web search is optional through Tavily. Without an AI key, collection still works but is identified as an original-text collection. Hosting destination repository is pending.

## Brand Commitments
Reference image: Chinese interface, name 第二号, white and light gray surfaces, blue emphasis, homepage with a compact masthead, daily digest list with calendar, and research report list.

## Product Principles
- Distinguish generated analysis, collected source material and examples.
- Preserve citations and expose failed or stale sources.
- Keep credentials outside the browser and repository content.
- Support repeatable deployment to a repository subpath.
