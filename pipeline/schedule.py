"""Decide whether to collect a daily digest, without dependencies or API calls."""

import argparse
from datetime import datetime
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]


def daily_decision(index, timezone="Asia/Shanghai", *, now=None, force=False):
    if not isinstance(index, dict) or not isinstance(index.get("digests", []), list):
        raise ValueError("日报索引格式无效，停止补跑以避免重复调用模型")
    zone = ZoneInfo(timezone)
    current = now if now is not None else datetime.now(zone)
    if current.tzinfo is None:
        raise ValueError("日报日期检查需要带时区的时间")
    date = current.astimezone(zone).date().isoformat()
    generated = any(
        isinstance(digest, dict)
        and digest.get("date") == date
        and digest.get("mode") in ("ai", "collection")
        and all(
            isinstance(digest.get(field), str) and digest[field].strip()
            for field in ("title", "content")
        )
        for digest in index.get("digests", [])
    )
    return {
        "date": date,
        "should_collect": force or not generated,
        "reason": "forced" if force else "already_generated" if generated else "missing",
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="日报补跑预检（不采集、不调用模型）")
    parser.add_argument("--config", type=Path, default=ROOT / "config/sources.json")
    parser.add_argument("--index", type=Path, default=ROOT / "public/data/index.json")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args(argv)
    config = json.loads(args.config.read_text(encoding="utf-8"))
    # A missing index is a first run; malformed JSON fails closed rather than
    # treating an unreadable existing digest as absent and spending quota again.
    index = json.loads(args.index.read_text(encoding="utf-8")) if args.index.exists() else {}
    decision = daily_decision(
        index,
        config.get("timezone", "Asia/Shanghai"),
        force=args.force or os.environ.get("FORCE_REGENERATE") == "true",
    )
    messages = {
        "forced": "已明确要求强制重新生成，将重新采集并生成日报。",
        "already_generated": "当天已有正式日报，跳过采集、模型调用和重复发布。",
        "missing": "当天尚无正式日报，开始采集和生成。",
    }
    message = f"日期 {decision['date']}：{messages[decision['reason']]}"
    print(message)
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with Path(output).open("a", encoding="utf-8") as stream:
            stream.write(f"should_collect={str(decision['should_collect']).lower()}\n")
            stream.write(f"date={decision['date']}\n")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with Path(summary).open("a", encoding="utf-8") as stream:
            stream.write(f"## 日报补跑预检\n\n{message}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
