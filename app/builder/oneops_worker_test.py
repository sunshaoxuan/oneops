from __future__ import annotations

import base64
import json
import os
import shutil
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


TEST_ROOT = Path(__file__).resolve().parents[1] / ".test-work" / "builder-worker"
shutil.rmtree(TEST_ROOT, ignore_errors=True)
sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ["HOST_STANDALONE_DATA_DIR"] = str(TEST_ROOT / "jobs")
os.environ["STANDALONE_OUTPUT_DIR"] = str(TEST_ROOT / "deliveries")
os.environ["HOST_STANDALONE_MANAGEMENT_TOKEN"] = "test-management-token"

import host_standalone_console as console
import oneops_worker as worker
import standalone_packager as packager


class OneOpsWorkerTest(unittest.TestCase):
    def test_new_build_uses_requested_middleware_defaults_without_changing_bundled(self) -> None:
        self.assertIn(
            'data-middleware-product="nginx" data-default-version="1.30.2"',
            console.INDEX_HTML,
        )
        self.assertIn(
            'data-middleware-product="redis" data-default-version="8.8.0"',
            console.INDEX_HTML,
        )
        self.assertGreaterEqual(
            console.INDEX_HTML.count(
                '<option value="bundled" data-i18n="middlewareBundled">同梱版</option>'
            ),
            3,
        )
        self.assertIn(
            ": (select.dataset.defaultVersion || 'bundled')",
            console.APP_JS,
        )
        self.assertIn(
            "select.dataset.middlewareCatalogLoaded = 'true'",
            console.APP_JS,
        )

    def test_redis_releases_use_descending_numeric_version_order(self) -> None:
        versions = ["8.10.0", "8.8.1", "8.6.5", "6.2.23", "8.8.0", "7.4.10"]
        api_releases = [
            {
                "tag_name": version,
                "assets": [
                    {
                        "name": f"Redis-{version}-Windows-x64-with-Service.zip",
                        "browser_download_url": f"https://example.invalid/redis-{version}.zip",
                    }
                ],
            }
            for version in versions
        ]

        with patch.object(packager, "_urlopen_json", return_value=api_releases):
            releases = packager.fetch_redis_releases()

        self.assertEqual(
            [release.version for release in releases],
            ["8.10.0", "8.8.1", "8.8.0", "8.6.5", "7.4.10", "6.2.23"],
        )

    def test_migrated_page_prefills_context_without_locking_the_field(self) -> None:
        self.assertIn("applyOneOpsOrganisationContext", console.APP_JS)
        self.assertIn(
            "input.value = contextName",
            console.APP_JS,
        )
        function_body = console.APP_JS.split(
            "function applyOneOpsOrganisationContext() {",
            1,
        )[1].split("\n}", 1)[0]
        self.assertNotIn(
            "input.readOnly = true",
            function_body,
        )
        self.assertNotIn(
            "input.disabled = true",
            function_body,
        )

    def test_worker_serves_original_page_without_a_tcp_listener(self) -> None:
        response = worker.dispatch(
            {
                "method": "GET",
                "path": "/?organisation_name=%E7%AD%91%E6%B3%A2%E5%A4%A7%E5%AD%A6",
                "headers": {},
                "bodyBase64": "",
            }
        )
        self.assertEqual(response["status"], 200)
        body = base64.b64decode(response["bodyBase64"]).decode("utf-8")
        self.assertIn("庶務事務システム構造器", body)
        self.assertIn('<body class="">', body)

    def test_oneops_page_uses_native_workspace_chrome_and_full_width(self) -> None:
        response = worker.dispatch(
            {
                "method": "GET",
                "path": (
                    "/?embedded=oneops&locale=zh-CN"
                    "&organisation_name=%E7%AD%91%E6%B3%A2%E5%A4%A7%E5%AD%A6"
                ),
                "headers": {},
                "bodyBase64": "",
            }
        )
        self.assertEqual(response["status"], 200)
        body = base64.b64decode(response["bodyBase64"]).decode("utf-8")
        self.assertIn('<body class="oneops-embedded">', body)
        self.assertIn("body.oneops-embedded .brand-bar", console.STYLE_CSS)
        self.assertIn("body.oneops-embedded .hero-actions", console.STYLE_CSS)
        self.assertIn("max-width: none", console.STYLE_CSS)
        self.assertIn(
            "const oneOpsLocale = oneOpsPageParameters.get('locale')",
            console.APP_JS,
        )

    def test_oneops_mutations_send_csrf_and_format_api_errors(self) -> None:
        self.assertIn(
            "const oneOpsCsrfToken = cookieValue('oneops_csrf')",
            console.APP_JS,
        )
        self.assertIn(
            "headers['X-OneOps-CSRF'] = oneOpsCsrfToken",
            console.APP_JS,
        )
        self.assertIn(
            (
                "fetch('/api/jobs', {method: 'POST', "
                "headers: authHeaders({'Content-Type': 'application/json'})"
            ),
            console.APP_JS,
        )
        self.assertIn("if (!res.ok || job.error)", console.APP_JS)
        self.assertIn(
            "alert(apiErrorMessage(job.error, res.status))",
            console.APP_JS,
        )
        self.assertIn(
            "if (message && code) return `${message} (${code})`",
            console.APP_JS,
        )

    def test_worker_keeps_existing_jobs_api_contract(self) -> None:
        response = worker.dispatch(
            {
                "method": "GET",
                "path": "/api/jobs",
                "headers": {"Accept": "application/json"},
                "bodyBase64": "",
            }
        )
        self.assertEqual(response["status"], 200)
        body = json.loads(base64.b64decode(response["bodyBase64"]))
        self.assertEqual(body, {"jobs": []})


def tearDownModule() -> None:
    shutil.rmtree(TEST_ROOT, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
