from __future__ import annotations

import json
import os
from pathlib import Path
import re
import tempfile
import subprocess
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

from .core import (ROOT, SYSTEM, ask_ai, empty_index, evidence_prompt, get_url, item_id,
                   load_json, now_iso, plain_text, public_url, references, validate_citations, write_json)


def video_text(url):
    public_url(url)
    with tempfile.TemporaryDirectory() as directory:
        # No shell; user input is always one argument. Download subtitles only.
        subprocess.run(["yt-dlp", "--ignore-config", "--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "zh.*,en.*", "--sub-format", "vtt/json3", "--no-playlist", "--socket-timeout", "15", "--retries", "1", "--max-filesize", "5M", "--output", str(Path(directory) / "video.%(ext)s"), "--", url], check=True, capture_output=True, timeout=100)
        paths = sorted(Path(directory).glob("*.vtt")) + sorted(Path(directory).glob("*.json3"))
        if not paths:
            raise ValueError("该视频没有可读取的公开字幕，请粘贴字幕或转录")
        path = paths[0]
        if path.suffix == ".json3":
            data = load_json(path)
            return " ".join(segment.get("utf8", "") for event in data.get("events", []) for segment in event.get("segs", []))
        text = path.read_text(encoding="utf-8")
        lines = [plain_text(line) for line in text.splitlines() if line.strip() and not re.match(r"^(WEBVTT|Kind:|Language:|\d+$|\d{2}:\d{2}:|NOTE)", line)]
        return " ".join(dict.fromkeys(lines))


def extract_source(url):
    host = (urlparse(url).hostname or "").lower()
    if host in ("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "bilibili.com", "www.bilibili.com", "m.bilibili.com", "b23.tv"):
        return {"title": "视频字幕 · " + host, "url": url, "text": video_text(url), "method": "subtitle"}
    html = get_url(url)
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else host
    body = soup.select_one("#js_content") or soup.select_one("article") or soup.select_one("main") or soup.body or soup
    text = plain_text(str(body))
    if len(text) < 100 or any(term in text[:300] for term in ("访问过于频繁", "安全验证", "请在微信客户端打开", "Access Denied", "Just a moment")):
        raise ValueError("未读取到可靠正文，请粘贴原文")
    return {"title": title[:180], "url": url, "text": text[:30_000], "method": "webpage"}


def search_web(query):
    key = os.environ.get("TAVILY_API_KEY", "")
    if not key:
        return []
    response = requests.post("https://api.tavily.com/search", json={"api_key": key, "query": query, "max_results": 5, "include_raw_content": True}, timeout=(10, 45))
    if not response.ok:
        raise RuntimeError(f"检索服务返回 HTTP {response.status_code}")
    return [{"title": result["title"], "url": result["url"], "text": (result.get("raw_content") or result.get("content") or "")[:20_000], "method": "search"} for result in response.json().get("results", []) if result.get("url")]


def validate_task(task):
    if not isinstance(task, dict) or not isinstance(task.get("topic"), str) or not 2 <= len(task["topic"].strip()) <= 200:
        raise ValueError("调研主题需要 2–200 个字符")
    urls = task.get("urls", [])
    if isinstance(urls, str):
        urls = [line.strip() for line in urls.splitlines() if line.strip()]
    if not isinstance(urls, list) or len(urls) > 8 or any(not isinstance(url, str) or len(url) > 2048 or urlparse(url).scheme not in ("http", "https") for url in urls):
        raise ValueError("请提供不超过 8 个 http/https 来源链接")
    notes = task.get("notes", "")
    if not isinstance(notes, str) or len(notes) > 30_000:
        raise ValueError("补充原文最多 30000 字符")
    if type(task.get("webSearch", False)) is not bool:
        raise ValueError("webSearch 必须是布尔值")
    return {"topic": task["topic"].strip(), "urls": list(dict.fromkeys(urls)), "notes": notes, "webSearch": task.get("webSearch", False)}


def task_from_event(path):
    event = load_json(path)
    issue = event.get("issue", {})
    if not issue.get("title", "").startswith("[Research]"):
        raise ValueError("不是调研任务")
    match = re.search(r"```json\s*([\s\S]*?)\s*```", issue.get("body", ""))
    if not match:
        raise ValueError("Issue 缺少 JSON 调研任务")
    task = validate_task(json.loads(match.group(1)))
    task["issueUrl"] = issue.get("html_url", "")
    task["issueNumber"] = issue.get("number")
    return task


def research(task, output=ROOT / "public/data/index.json"):
    validated = validate_task(task)
    topic, urls, notes = validated["topic"], validated["urls"], validated["notes"]
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("深度调研需要 OPENAI_API_KEY，请先设置仓库 Secret")
    evidence, failures = [], []
    for url in urls:
        try:
            evidence.append(extract_source(url))
        except Exception as exc:
            failures.append({"url": url, "message": "无法提取正文或公开字幕，请补充原文", "errorType": type(exc).__name__})
    if notes.strip():
        evidence.append({"title": "用户提供的原文与转录（未经独立核验）", "url": task.get("issueUrl") or "", "text": notes.strip(), "method": "supplied"})
    if validated["webSearch"]:
        if os.environ.get("TAVILY_API_KEY"):
            # Search the original question first, then independently cross-check the key claim.
            evidence.extend(search_web(topic))
            evidence.extend(search_web(topic + " limitations evaluation evidence"))
        else:
            failures.append({"url": "", "message": "未配置 TAVILY_API_KEY，本次未进行互联网检索"})
    seen = set()
    evidence = [item for item in evidence if len(item["text"].strip()) >= 80 and not (item["url"] in seen or seen.add(item["url"]))]
    if not evidence:
        raise ValueError("没有足够的可读取资料；请添加公开链接、字幕或原文，再重试")
    generated = ask_ai(SYSTEM, f"调研主题：{topic}\n请撰写深度调研报告，包含核心结论、证据与机制分析、观点交叉验证、应用建议、局限与待验证问题。不能将没有提供的视频画面或音频说成已经观看。资料提取方式和失败状态都需要在局限中体现。\n失败来源：{json.dumps(failures, ensure_ascii=False)}\n\n" + evidence_prompt(evidence, chars=14_000))
    validate_citations(generated, evidence)
    stamp = now_iso()
    # Re-running the same Issue replaces its report instead of creating duplicate reports.
    identifier = f"research-issue-{task['issueNumber']}" if task.get("issueNumber") else "research-" + item_id(topic + stamp)
    report = {"id": identifier, "date": stamp[:10], "createdAt": stamp, "mode": "ai", "topic": topic,
              "references": references(evidence), "sourceCount": len(evidence), "failures": failures,
              "methods": sorted({item["method"] for item in evidence}), **generated}
    index = load_json(output, empty_index())
    index["reports"] = [report] + [report for report in index.get("reports", []) if report["id"] != identifier]
    index["updatedAt"] = stamp
    index["repository"] = os.environ.get("GITHUB_REPOSITORY", index.get("repository", ""))
    write_json(output, index)
    return report
