import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pipeline.config import load_local_env


class LocalConfigurationTests(unittest.TestCase):
    def test_shell_overrides_local_and_local_overrides_default(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / '.env').write_text('OPENAI_API_KEY=default\nOPENAI_MODEL=default-model\n', encoding='utf-8')
            (root / '.env.local').write_text('OPENAI_API_KEY=local\nOPENAI_MODEL=local-model\n', encoding='utf-8')
            with patch.dict(os.environ, {'OPENAI_API_KEY': 'shell'}, clear=True):
                load_local_env(root)
                self.assertEqual(os.environ['OPENAI_API_KEY'], 'shell')
                self.assertEqual(os.environ['OPENAI_MODEL'], 'local-model')

    def test_secrets_are_literal_not_interpolated(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {}, clear=True):
            root = Path(folder)
            (root / '.env.local').write_text("OPENAI_API_KEY='test-${UNSET}-literal'\n", encoding='utf-8')
            load_local_env(root)
            self.assertEqual(os.environ['OPENAI_API_KEY'], 'test-${UNSET}-literal')

    def test_missing_local_files_are_optional(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {}, clear=True):
            load_local_env(folder)
            self.assertNotIn('OPENAI_API_KEY', os.environ)
