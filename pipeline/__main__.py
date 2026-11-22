import argparse
import json
import os
from pathlib import Path
import sys
from .core import ROOT, load_json
from .collect import collect
from .research import research, task_from_event
from .config import load_local_env

load_local_env()

parser = argparse.ArgumentParser(description="知更 · AI Daily 自动采集与调研")
subparsers = parser.add_subparsers(dest="command", required=True)
daily = subparsers.add_parser("collect")
daily.add_argument("--config", type=Path, default=ROOT / "config/sources.json")
daily.add_argument("--output", type=Path, default=ROOT / "public/data/index.json")
daily.add_argument("--no-ai", action="store_true")
report = subparsers.add_parser("research")
report.add_argument("--topic")
report.add_argument("--urls", nargs="*", default=[])
report.add_argument("--notes", default="")
report.add_argument("--web-search", action="store_true")
report.add_argument("--task-file", type=Path)
report.add_argument("--event-file", type=Path)
report.add_argument("--output", type=Path, default=ROOT / "public/data/index.json")
args = parser.parse_args()
try:
    if args.command == "collect":
        result = collect(args.config, args.output, args.no_ai)
        print(json.dumps({"status": result["collection"], "items": len(result["items"])}, ensure_ascii=False))
    else:
        task = task_from_event(args.event_file) if args.event_file else load_json(args.task_file) if args.task_file else {"topic": args.topic or os.environ.get("RESEARCH_TOPIC", ""), "urls": args.urls or os.environ.get("RESEARCH_URLS", "").splitlines(), "notes": args.notes or os.environ.get("RESEARCH_NOTES", ""), "webSearch": args.web_search or os.environ.get("RESEARCH_WEB_SEARCH") == "true"}
        result = research(task, args.output)
        print(json.dumps({"report": result["id"], "sources": result["sourceCount"]}, ensure_ascii=False))
except Exception as exc:
    # Do not print raw HTTP errors, URLs or environment values into workflow logs.
    print(str(exc) if isinstance(exc, (ValueError, RuntimeError)) else f"任务失败（{type(exc).__name__}），请检查网络与配置", file=sys.stderr)
    sys.exit(1)
