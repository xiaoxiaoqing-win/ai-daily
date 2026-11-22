import json
import os
from pathlib import Path
import socket
import tempfile
import unittest
from unittest.mock import patch
from pipeline.core import canonical_url, deduplicate, empty_index, public_url, validate_citations, write_json, load_json
from pipeline.collect import collect, collect_builders, collect_rss
from pipeline.research import research, task_from_event, validate_task


class PipelineTests(unittest.TestCase):
    def test_canonical_deduplication_preserves_first_source(self):
        self.assertEqual(canonical_url('https://EXAMPLE.com/a/?utm_source=x&v=1#anchor'), 'https://example.com/a?v=1')
        result = deduplicate([{'url':'https://example.com/a?utm_campaign=x','source':'first'}, {'url':'https://example.com/a','source':'second'}])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['source'], 'first')

    def test_refuses_private_network_and_credentials(self):
        with patch('socket.getaddrinfo', return_value=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('127.0.0.1',80))]):
            with self.assertRaises(ValueError):
                public_url('http://localhost/secrets')
        with self.assertRaises(ValueError):
            public_url('https://user:password@example.com')

    def test_builders_feed_parser(self):
        feed = {'x':[{'name':'Builder','handle':'builder','tweets':[{'url':'https://x.com/b/status/1','text':'Hello AI','likes':5,'createdAt':'2026-11-22T00:00:00Z'}]}]}
        with patch('pipeline.collect.get_url',return_value=json.dumps(feed)):
            items=collect_builders({'id':'builders','name':'Follow Builders','kind':'builders','url':'https://example.com/feed'})
        self.assertEqual(items[0]['author'],'Builder')
        self.assertEqual(items[0]['likes'],5)

    def test_atom_parser_supports_dates_and_strips_html(self):
        atom='''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>A test</title><link href="https://example.com/article"/><updated>2026-11-22T00:00:00Z</updated><summary type="html">&lt;b&gt;Readable&lt;/b&gt;</summary></entry></feed>'''
        with patch('pipeline.collect.get_url',return_value=atom):
            items=collect_rss({'id':'rss','name':'Test','kind':'rss','url':'https://example.com/feed'})
        self.assertEqual(items[0]['excerpt'],'Readable')
        self.assertIn('2026-11-22',items[0]['publishedAt'])

    def test_collection_retains_other_reports_and_deduplicates_same_day(self):
        with tempfile.TemporaryDirectory() as folder:
            config=Path(folder)/'sources.json'; output=Path(folder)/'index.json'
            write_json(config,{'sources':[{'id':'a','enabled':True}],'timezone':'Asia/Shanghai'})
            initial=empty_index(); initial['reports']=[{'id':'existing'}]; write_json(output,initial)
            item={'id':'i1','title':'A source','url':'https://example.com/a','excerpt':'Body','sourceId':'a','source':'Test'}
            with patch('pipeline.collect.fetch_source',return_value=([item],{'id':'a','status':'ok','count':1})), patch('pipeline.collect.ai_configured',return_value=False):
                collect(config,output); value=collect(config,output)
            self.assertEqual(len(value['digests']),1)
            self.assertEqual(value['reports'][0]['id'],'existing')
            self.assertEqual(value['digests'][0]['mode'],'collection')
            self.assertEqual(value['digests'][0]['references'][0]['url'],item['url'])

    def test_all_failed_sources_preserve_prior_digest(self):
        with tempfile.TemporaryDirectory() as folder:
            config=Path(folder)/'sources.json'; output=Path(folder)/'index.json'
            write_json(config,{'sources':[{'id':'a'}]})
            value=empty_index(); value['digests']=[{'id':'old'}]; write_json(output,value)
            with patch('pipeline.collect.fetch_source',return_value=([],{'id':'a','status':'error'})):
                with self.assertRaises(RuntimeError): collect(config,output)
            stored=load_json(output)
            self.assertEqual(stored['digests'],[{'id':'old'}])
            self.assertEqual(stored['collection']['status'],'error')

    def test_ai_failure_degrades_to_explicit_collection(self):
        with tempfile.TemporaryDirectory() as folder:
            config=Path(folder)/'sources.json'; output=Path(folder)/'index.json'
            write_json(config,{'sources':[{'id':'a'}]})
            item={'id':'i1','title':'Source','url':'https://example.com/a','excerpt':'Evidence','sourceId':'a','source':'Test'}
            with patch('pipeline.collect.fetch_source',return_value=([item],{'id':'a','status':'ok'})), patch('pipeline.collect.ai_configured',return_value=True), patch('pipeline.collect.ask_ai',side_effect=RuntimeError('AI unavailable')):
                value=collect(config,output)
            self.assertEqual(value['digests'][0]['mode'],'collection')
            self.assertIn('AI unavailable',value['collection']['aiError'])

    def test_validate_task_rejects_bad_payloads(self):
        for task in [{'topic':'x'}, {'topic':'Valid','urls':['file:///etc/passwd']}, {'topic':'Valid','urls':['https://a.com']*9}, {'topic':'Valid','notes':12}, {'topic':'Valid','webSearch':'false'}]:
            with self.subTest(task=task), self.assertRaises(ValueError): validate_task(task)

    def test_generated_citations_must_use_existing_evidence(self):
        with self.assertRaises(RuntimeError):
            validate_citations({'content':'Unsupported claim [S9]'},[{}])
        with self.assertRaises(RuntimeError):
            validate_citations({'content':'No references'},[{}])
        validate_citations({'content':'Grounded claim [S1]'},[{}])

    def test_issue_json_is_parsed_as_data(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'event.json'
            write_json(path,{'issue':{'title':'[Research] Valid','body':'```json\n{"topic":"$(echo no-shell)","urls":[]}\n```','html_url':'https://github.com/u/r/issues/1','number':1}})
            task=task_from_event(path)
            self.assertEqual(task['topic'],'$(echo no-shell)')
            self.assertEqual(task['issueNumber'],1)

    def test_research_records_failures_and_uses_supplied_text(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}):
            output=Path(folder)/'index.json'
            task={'topic':'Grounded research','urls':['https://example.com/unavailable'],'notes':'User supplied material. '*20,'issueNumber':8,'issueUrl':'https://github.com/u/r/issues/8'}
            with patch('pipeline.research.extract_source',side_effect=ValueError()), patch('pipeline.research.ask_ai',return_value={'title':'Report','summary':'Summary','content':'Evidence [S1]'}):
                report=research(task,output); research(task,output)
            self.assertEqual(report['methods'],['supplied'])
            self.assertEqual(len(report['failures']),1)
            self.assertEqual(len(load_json(output)['reports']),1)
            self.assertEqual(report['references'][0]['url'],task['issueUrl'])

    def test_research_fails_without_evidence(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}), patch('pipeline.research.extract_source',side_effect=ValueError()):
            with self.assertRaises(ValueError): research({'topic':'Test topic','urls':['https://example.com/no']})

if __name__=='__main__':
    unittest.main()
