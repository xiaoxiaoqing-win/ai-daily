from copy import deepcopy
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pipeline.collect import collect, collect_github, fetch_source
from pipeline.core import empty_index, item_id, load_json, write_json


class IncrementalDailyTests(unittest.TestCase):
    source = {"id": "rss", "name": "Test", "kind": "rss", "url": "https://example.com/feed", "enabled": True}

    def item(self, slug, published="2026-11-23T01:00:00Z", **values):
        url = f"https://example.com/{slug}"
        return {"id": item_id(url), "url": url, "title": f"Headline {slug}", "excerpt": f"Evidence {slug}",
                "sourceId": "rss", "source": "Test", "kind": "rss", "publishedAt": published, **values}

    def initial(self, old):
        index = empty_index()
        index["items"] = [old]
        index["digests"] = [{"id": "daily-2026-11-22", "date": "2026-11-22", "mode": "ai", "title": "Previous",
                             "createdAt": "2026-11-22T12:00:00Z", "collectedAt": "2026-11-22T11:59:00Z",
                             "content": "Previous evidence [S1]", "itemIds": [old["id"]],
                             "references": [{"id": "S1", "title": old["title"], "url": old["url"]}]}]
        return index

    def run_collect(self, initial, items, *, limit=12, ai=True):
        with tempfile.TemporaryDirectory() as folder:
            config, output = Path(folder) / "config.json", Path(folder) / "index.json"
            write_json(config, {"timezone": "Asia/Shanghai", "max_items_per_source": limit, "sources": [self.source]})
            write_json(output, initial)
            status = {**self.source, "status": "ok", "count": len(items)}
            generated = {"title": "New evidence", "summary": "New only", "content": "New evidence [S1]"}
            with patch("pipeline.collect.fetch_source", return_value=(items, status)), \
                 patch("pipeline.collect.today", return_value="2026-11-23"), \
                 patch("pipeline.collect.ai_configured", return_value=ai), \
                 patch("pipeline.collect.ask_ai", return_value=generated) as model:
                collect(config, output)
                return load_json(output), model

    def test_cross_day_dedup_happens_before_limit_and_rebuilds_citations(self):
        old, fresh = self.item("old"), self.item("fresh")
        result, model = self.run_collect(self.initial(old), [old, fresh], limit=1)
        self.assertEqual(result["digests"][0]["itemIds"], [fresh["id"]])
        self.assertEqual(result["digests"][0]["references"], [{"id": "S1", "title": fresh["title"], "url": fresh["url"]}])
        self.assertEqual(result["collection"]["duplicateCount"], 1)
        self.assertNotIn(old["title"], model.call_args.args[1])
        self.assertIn(fresh["title"], model.call_args.args[1])
        self.assertEqual(len(result["digests"]), 2)

    def test_no_new_items_does_not_call_model_or_create_another_edition(self):
        old = self.item("old")
        initial = self.initial(old)
        result, model = self.run_collect(initial, [old])
        model.assert_not_called()
        self.assertEqual(result["digests"], initial["digests"])
        self.assertEqual(result["collection"]["newItemCount"], 0)
        self.assertEqual(result["sources"][0]["status"], "empty")
        self.assertIn("未调用模型", result["collection"]["message"])

    def test_tracking_parameter_changes_do_not_turn_old_links_into_new_items(self):
        old = self.item("old")
        repeated = {**old, "url": old["url"] + "?utm_campaign=today"}
        result, model = self.run_collect(self.initial(old), [repeated])
        model.assert_not_called()
        self.assertEqual(result["collection"]["duplicateCount"], 1)

    def test_previously_unreported_but_old_posts_do_not_fill_the_next_day(self):
        old = self.item("old")
        stale = self.item("unreported-stale", published="2026-11-21T23:00:00Z")
        undated = self.item("first-discovered", published=None)
        result, model = self.run_collect(self.initial(old), [old, stale, undated])
        self.assertEqual(result["digests"][0]["itemIds"], [undated["id"]])
        self.assertEqual(result["collection"]["olderItemCount"], 1)
        self.assertNotIn(stale["title"], model.call_args.args[1])

    def test_collection_start_watermark_keeps_posts_arriving_while_ai_writes(self):
        old = self.item("old")
        fresh = self.item("between-fetch-and-generation", published="2026-11-22T11:59:30Z")
        result, model = self.run_collect(self.initial(old), [fresh])
        model.assert_called_once()
        self.assertEqual(result["digests"][0]["itemIds"], [fresh["id"]])

    def test_legacy_editions_use_created_at_when_no_collection_start_exists(self):
        old = self.item("old")
        initial = self.initial(old)
        del initial["digests"][0]["collectedAt"]
        stale = self.item("legacy-old", published="2026-11-22T11:59:30Z")
        result, model = self.run_collect(initial, [stale])
        model.assert_not_called()
        self.assertEqual(result["collection"]["olderItemCount"], 1)

    def test_deliberate_same_day_rerun_reuses_todays_new_items(self):
        old, fresh = self.item("old"), self.item("fresh")
        initial = self.initial(old)
        current = deepcopy(initial["digests"][0])
        current.update(id="daily-2026-11-23", date="2026-11-23", itemIds=[fresh["id"]],
                       references=[{"id": "S1", "title": fresh["title"], "url": fresh["url"]}])
        initial["digests"].insert(0, current)
        result, model = self.run_collect(initial, [old, fresh])
        model.assert_called_once()
        self.assertEqual(len(result["digests"]), 2)
        self.assertEqual(result["digests"][0]["itemIds"], [fresh["id"]])

    def test_demo_editions_do_not_block_the_first_real_collection(self):
        old = self.item("old", published="2026-11-21T10:00:00Z")
        initial = self.initial(old)
        initial["digests"][0]["mode"] = "demo"
        result, _ = self.run_collect(initial, [old], ai=False)
        self.assertEqual(result["digests"][0]["itemIds"], [old["id"]])
        self.assertEqual(result["digests"][0]["mode"], "collection")

    def test_fetch_does_not_truncate_before_historical_filtering(self):
        items = [self.item("old", published=None), self.item("fresh", published=None)]
        with patch("pipeline.collect.collect_rss", return_value=items):
            fetched, _ = fetch_source(self.source, {"max_items_per_source": 1})
        self.assertEqual(len(fetched), 2)

    def test_github_observation_time_is_not_a_publication_date(self):
        html = '<article class="Box-row"><h2><a href="/owner/repo">owner / repo</a></h2><p>A project</p></article>'
        with patch("pipeline.collect.get_url", return_value=html):
            items = collect_github({**self.source, "kind": "github"})
        self.assertIsNone(items[0]["publishedAt"])
        self.assertTrue(items[0]["collectedAt"])
