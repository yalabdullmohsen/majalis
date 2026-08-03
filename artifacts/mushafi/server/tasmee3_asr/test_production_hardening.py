"""Lightweight unit tests for production hardening helpers (no Whisper download)."""

import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock

# Ensure local package imports resolve when run from repo root or this folder.
sys.path.insert(0, os.path.dirname(__file__))


class ArabicUtilsTests(unittest.TestCase):
    def test_normalize_and_tokenize(self):
        from arabic_utils import normalize_arabic, tokenize

        self.assertEqual(normalize_arabic("بِسْمِ"), "بسم")
        self.assertEqual(tokenize("قُلْ هُوَ"), ["قل", "هو"])


class AudioUtilsTests(unittest.TestCase):
    def test_safe_remove_and_temp_cleanup(self):
        from audio_utils import safe_remove, temp_file_path, write_pcm_to_wav

        path = temp_file_path(".bin")
        with open(path, "wb") as handle:
            handle.write(b"abc")
        self.assertTrue(os.path.exists(path))
        safe_remove(path)
        self.assertFalse(os.path.exists(path))

        wav = write_pcm_to_wav(b"\x00\x00" * 1600, sample_rate=16000)
        self.assertTrue(os.path.exists(wav))
        safe_remove(wav)
        self.assertFalse(os.path.exists(wav))


class SecurityTests(unittest.TestCase):
    def test_auth_optional_when_no_key(self):
        import settings as settings_mod
        from security import check_auth_header

        # settings is frozen from import-time env; monkeypatch attribute via object
        object.__setattr__(settings_mod.settings, "api_key", "")
        check_auth_header(None)  # should not raise

    def test_rate_limit_trips(self):
        from fastapi import HTTPException
        import settings as settings_mod
        from security import check_rate_limit, _request_log

        object.__setattr__(settings_mod.settings, "rate_limit_per_minute", 2)
        _request_log.clear()

        request = MagicMock()
        request.headers.get.return_value = None
        request.client.host = "127.0.0.1"

        check_rate_limit(request)
        check_rate_limit(request)
        with self.assertRaises(HTTPException) as ctx:
            check_rate_limit(request)
        self.assertEqual(ctx.exception.status_code, 429)


class HealthRouteTests(unittest.TestCase):
    def test_health_payload(self):
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "4.0.0")
        self.assertIn("rate_limiting", data["features"])
        self.assertIn("pcm_streaming", data["features"])


if __name__ == "__main__":
    unittest.main()
