from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from zoneinfo import ZoneInfo

from pipeline.schedule import daily_decision


class DailyScheduleTests(unittest.TestCase):
    # UTC still says Nov 22, but Beijing has already crossed into Nov 23.
    now = datetime(2026, 11, 22, 16, 30, tzinfo=timezone.utc)

    def digest(self, date="2026-11-23", mode="ai", **overrides):
        return {"date": date, "mode": mode, "title": "日报", "content": "已生成的正文", **overrides}

    def decide(self, digests, **options):
        return daily_decision({"digests": digests}, now=self.now, **options)

    def test_existing_ai_digest_skips_using_beijing_date(self):
        decision = self.decide([self.digest()])
        self.assertEqual(decision["date"], "2026-11-23")
        self.assertFalse(decision["should_collect"])

    def test_existing_original_collection_also_skips_to_avoid_repeated_ai_attempts(self):
        self.assertFalse(self.decide([self.digest(mode="collection")])["should_collect"])

    def test_yesterdays_digest_does_not_block_catch_up(self):
        self.assertTrue(self.decide([self.digest(date="2026-11-22")])["should_collect"])

    def test_demo_and_incomplete_digests_do_not_count_as_generated(self):
        for digest in (self.digest(mode="demo"), self.digest(content=""), self.digest(title=" ")):
            with self.subTest(digest=digest):
                self.assertTrue(self.decide([digest])["should_collect"])

    def test_checks_all_editions_not_only_the_first(self):
        self.assertFalse(self.decide([self.digest(date="2026-11-22"), self.digest()])["should_collect"])

    def test_explicit_force_can_regenerate(self):
        decision = self.decide([self.digest()], force=True)
        self.assertTrue(decision["should_collect"])
        self.assertEqual(decision["reason"], "forced")

    def test_invalid_index_or_naive_time_fails_closed(self):
        for index in ([], {"digests": "invalid"}):
            with self.subTest(index=index), self.assertRaises(ValueError):
                daily_decision(index, now=self.now)
        with self.assertRaises(ValueError):
            daily_decision({}, now=datetime(2026, 11, 23))

    def test_preflight_runs_without_installed_dependencies_and_leaves_content_untouched(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            config, index = root / "sources.json", root / "index.json"
            output, summary = root / "output", root / "summary"
            config.write_text(json.dumps({"timezone": "Asia/Shanghai"}), encoding="utf-8")
            today = datetime.now(ZoneInfo("Asia/Shanghai")).date().isoformat()
            original = json.dumps({"digests": [self.digest(date=today)]}, ensure_ascii=False)
            index.write_text(original, encoding="utf-8")
            env = {**os.environ, "FORCE_REGENERATE": "false", "GITHUB_OUTPUT": str(output), "GITHUB_STEP_SUMMARY": str(summary)}
            command = [sys.executable, "-S", "-m", "pipeline.schedule", "--config", str(config), "--index", str(index)]
            result = subprocess.run(command, env=env, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("should_collect=false\n", output.read_text())
            self.assertIn("跳过", result.stdout)
            self.assertIn("跳过", summary.read_text())
            self.assertEqual(index.read_text(encoding="utf-8"), original)

            # The string "false" must not accidentally act like a truthy force.
            output.unlink()
            result = subprocess.run(command, env={**env, "FORCE_REGENERATE": "true"}, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("should_collect=true\n", output.read_text())
            self.assertEqual(index.read_text(encoding="utf-8"), original)

    def test_missing_index_allows_first_run_but_corrupt_index_does_not(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            config, index, output = root / "sources.json", root / "index.json", root / "output"
            config.write_text('{"timezone":"Asia/Shanghai"}', encoding="utf-8")
            env = {**os.environ, "FORCE_REGENERATE": "false", "GITHUB_OUTPUT": str(output), "GITHUB_STEP_SUMMARY": str(root / "summary")}
            command = [sys.executable, "-S", "-m", "pipeline.schedule", "--config", str(config), "--index", str(index)]
            result = subprocess.run(command, env=env, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("should_collect=true\n", output.read_text())
            output.unlink()
            index.write_text('{"digests":', encoding="utf-8")
            result = subprocess.run(command, env=env, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())
