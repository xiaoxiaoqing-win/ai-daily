from __future__ import annotations

import calendar
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import os

from bs4 import BeautifulSoup
import feedparser

from .core import (ROOT, SYSTEM, ai_configured, ask_ai, canonical_url, deduplicate, empty_index, evidence_prompt, get_url, item_id,
                   load_json, now_iso, parse_date, plain_text, recent, references, today, validate_citations, write_json)


def make_item(source, title, url, text, author="", published=None, **extra):
    return {"id": item_id(url), "sourceId": source["id"], "source": source["name"], "kind": source["kind"],
            "title": plain_text(title)[:160], "url": url, "excerpt": plain_text(text)[:1800], "author": author,
            "publishedAt": published, "collectedAt": now_iso(), **extra}


def collect_builders(source):
    data = json.loads(get_url(source["url"]))
    items = []
    for person in data.get("x", []):
        for tweet in person.get("tweets", []):
            text = tweet.get("text", "")
            if text and tweet.get("url"):
                items.append(make_item(source, text.split("\n")[0][:110], tweet["url"], text, person.get("name", ""), tweet.get("createdAt"), likes=tweet.get("likes", 0), handle=person.get("handle", "")))
    if not items:
        raise ValueError("Follow Builders 未返回动态，请检查上游格式")
    return sorted(items, key=lambda item: item.get("likes", 0), reverse=True)


def collect_github(source):
    soup = BeautifulSoup(get_url(source["url"]), "html.parser")
    items = []
    for article in soup.select("article.Box-row"):
        anchor = article.select_one("h2 a")
        if not anchor:
            continue
        name = " / ".join(part.strip() for part in anchor.get_text().split("/") if part.strip())
        description = article.select_one("p")
        language = article.select_one('[itemprop="programmingLanguage"]')
        # Trending exposes observation time, not the project's publication date.
        items.append(make_item(source, name, "https://github.com" + anchor["href"], description.get_text(" ", strip=True) if description else "暂无项目描述", language=language.get_text(strip=True) if language else "", stars=article.select_one('a[href$="/stargazers"]').get_text(strip=True) if article.select_one('a[href$="/stargazers"]') else ""))
    if not items:
        raise ValueError("未读取到 GitHub Trending 项目，页面结构可能变化")
    return items


def collect_rss(source):
    feed = feedparser.parse(get_url(source["url"]))
    items = []
    for entry in feed.entries:
        if not entry.get("link"):
            continue
        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        published = datetime.fromtimestamp(calendar.timegm(stamp), timezone.utc).isoformat() if stamp else None
        items.append(make_item(source, entry.get("title", "未命名文章"), entry.link,
                               entry.get("summary", ""), entry.get("author", source["name"]), published))
    if not items:
        raise ValueError("未读取到 RSS/Atom 条目，请检查订阅地址")
    return items


def fetch_source(source, config):
    try:
        collector = {"builders": collect_builders, "github": collect_github, "rss": collect_rss}[source["kind"]]
        # Apply the per-source limit only after removing previously covered items.
        items = recent(collector(source), config.get("lookback_hours", 72))
        return items, {**source, "status": "ok" if items else "empty", "count": len(items), "lastCheckedAt": now_iso(),
                       "message": "采集成功" if items else "时间窗口内暂无新内容"}
    except Exception as exc:
        # Do not publish request URLs/headers or raw exception text that may contain credentials.
        return [], {**source, "status": "error", "count": 0, "lastCheckedAt": now_iso(), "message": f"采集失败（{type(exc).__name__}），请查看 Actions 或重试"}


def earlier_coverage(index, date):
    """Use earlier real editions; a deliberate same-day rerun can replace itself."""
    editions = [digest for digest in index.get("digests", [])
                if digest.get("mode") in ("ai", "collection")
                and isinstance(digest.get("date"), str) and digest["date"] < date
                and digest.get("content")]
    urls = {canonical_url(ref["url"]) for digest in editions
            for ref in digest.get("references", []) if ref.get("url")}
    ids = {item_id for digest in editions for item_id in digest.get("itemIds", [])}
    urls.update(canonical_url(item["url"]) for item in index.get("items", [])
                if item.get("id") in ids and item.get("url"))
    # New editions record the collection start, avoiding a gap while AI writes.
    # Older editions only have createdAt; use it as the migration watermark.
    stamps = [parse_date(digest.get("collectedAt") or digest.get("createdAt")) for digest in editions]
    return urls, max((stamp for stamp in stamps if stamp is not None), default=None)


def collect(config_path=ROOT / "config/sources.json", output=ROOT / "public/data/index.json", no_ai=False):
    config = load_json(config_path)
    index = load_json(output, empty_index())
    date = today(config)
    started_at = now_iso()
    covered_urls, covered_through = earlier_coverage(index, date)
    sources = [source for source in config["sources"] if source.get("enabled", True)]
    if not sources:
        raise ValueError("请至少启用一个信息源")
    items, statuses = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_source, source, config): source["id"] for source in sources}
        for future in as_completed(futures):
            fetched, status = future.result()
            candidates = deduplicate(fetched)
            unseen = [item for item in candidates if canonical_url(item["url"]) not in covered_urls]
            fresh = [item for item in unseen if not covered_through
                     or not parse_date(item.get("publishedAt"))
                     or parse_date(item["publishedAt"]) > covered_through]
            selected = fresh[:config.get("max_items_per_source", 12)]
            status.update(count=len(selected), fetchedCount=len(candidates),
                          duplicateCount=len(candidates) - len(unseen), olderItemCount=len(unseen) - len(fresh))
            if status["status"] != "error":
                status["status"] = "ok" if selected else "empty"
                status["message"] = (f"新增 {len(selected)} 条；跳过历史重复 {status['duplicateCount']} 条、上期前旧内容 {status['olderItemCount']} 条"
                                     if candidates else "时间窗口内暂无新内容")
            items.extend(selected)
            statuses.append(status)
    order = {source["id"]: i for i, source in enumerate(sources)}
    items = deduplicate(sorted(items, key=lambda item: (order[item["sourceId"]], item.get("publishedAt") or ""), reverse=False))
    index["sources"] = sorted(statuses, key=lambda source: order[source["id"]])
    index["repository"] = os.environ.get("GITHUB_REPOSITORY", index.get("repository", ""))
    index["updatedAt"] = now_iso()
    errors = sum(source["status"] == "error" for source in statuses)
    duplicates = sum(source["duplicateCount"] for source in statuses)
    older = sum(source["olderItemCount"] for source in statuses)
    index["collection"] = {"status": "error" if errors == len(sources) else "partial" if errors else "ok",
                           "message": f"{len(sources) - errors}/{len(sources)} 个来源完成采集；新增 {len(items)} 条，跳过历史重复 {duplicates} 条、上期前旧内容 {older} 条",
                           "aiEnabled": ai_configured(), "lastAttemptAt": now_iso(), "date": date,
                           "newItemCount": len(items), "duplicateCount": duplicates, "olderItemCount": older}
    if not items:
        index["collection"]["message"] += "；本次没有新增条目，保留已有日报，未调用模型"
        write_json(output, index)
        if errors == len(sources):
            raise RuntimeError("全部来源采集失败，已有日报未被覆盖")
        return index
    mode = "ai" if ai_configured() and not no_ai else "collection"
    generated = {"title": "AI 信息速递 · 原文汇编", "summary": f"汇集 {len(items)} 条 Builder 动态、开源项目与订阅更新。尚未进行 AI 分析。",
                 "content": "\n\n".join(f"## {item['title']}\n\n{item['excerpt']}\n\n来源：{item['source']} [S{i}]" for i, item in enumerate(items, 1))}
    if mode == "ai":
        try:
            generated = ask_ai(SYSTEM, "请仅根据本次新增条目整理中文 AI 日报。按资料实际内容选择今日重点、Builder 动态、开源趋势、值得阅读和观察等栏目，无对应新增内容就省略，不要补写昨日热点或无实质内容的闲聊。GitHub Trending 的首次收录不代表项目今天创建或发布；没有发布时间的资料不得称为今天发布。\n\n" + evidence_prompt(items))
            validate_citations(generated, items)
        except Exception as exc:
            mode = "collection"
            index["collection"]["aiError"] = str(exc) if isinstance(exc, RuntimeError) else "AI 请求失败，请在 Actions 检查配置后重试"
    digest = {"id": "daily-" + date, "date": date, "createdAt": now_iso(), "collectedAt": started_at, "mode": mode, "itemCount": len(items),
              "sourceCount": sum(s["status"] == "ok" for s in statuses), "references": references(items), "itemIds": [item["id"] for item in items], **generated}
    index["digests"] = [digest] + [d for d in index.get("digests", []) if d["id"] != digest["id"]]
    index["digests"] = sorted(index["digests"], key=lambda d: d["date"], reverse=True)[:90]
    # Retain only material cited by the 90 retained daily editions.
    retained = {item_id for daily in index["digests"] for item_id in daily.get("itemIds", [])}
    index["items"] = deduplicate(items + [item for item in index.get("items", []) if item["id"] in retained])
    write_json(output, index)
    return index
