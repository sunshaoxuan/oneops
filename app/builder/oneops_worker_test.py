from __future__ import annotations

import base64
import json
import os
import shutil
import sys
import unittest
import zipfile
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
    def test_rustfs_is_a_minio_style_exclusive_option(self) -> None:
        minio_position = console.INDEX_HTML.index('name="include_minio"')
        rustfs_position = console.INDEX_HTML.index('name="include_rustfs"')
        azure_position = console.INDEX_HTML.index('name="enable_azure_blob_storage"')
        self.assertLess(minio_position, rustfs_position)
        self.assertLess(rustfs_position, azure_position)
        self.assertIn(
            'data-middleware-product="rustfs" data-default-version="1.0.0-beta.11"',
            console.INDEX_HTML,
        )
        self.assertIn(
            "['nginx', 'redis', 'minio', 'rustfs']",
            console.APP_JS,
        )
        self.assertIn(
            "payload.include_rustfs = Boolean",
            console.APP_JS,
        )
        self.assertIn(
            "if (input.checked && otherInput) otherInput.checked = false",
            console.APP_JS,
        )

    def test_rustfs_release_catalog_reads_official_download_center(self) -> None:
        official_index = """
        <a href="https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-latest.zip">latest</a>
        <a href="https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.10-preview.3.zip">preview</a>
        <a href="https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.10.zip">beta 10</a>
        <a href="https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.12.zip">beta 12</a>
        <a href="https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.11.zip">beta 11</a>
        """

        with patch.object(packager, "_urlopen_text", return_value=official_index):
            releases = packager.fetch_rustfs_releases()

        self.assertEqual(
            releases,
            [
                packager.MiddlewareRelease(
                    "rustfs",
                    "1.0.0-beta.12",
                    "https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.12.zip",
                ),
                packager.MiddlewareRelease(
                    "rustfs",
                    "1.0.0-beta.11",
                    "https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.11.zip",
                ),
                packager.MiddlewareRelease(
                    "rustfs",
                    "1.0.0-beta.10",
                    "https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.10.zip",
                ),
                packager.MiddlewareRelease(
                    "rustfs",
                    "1.0.0-beta.10-preview.3",
                    "https://dl.rustfs.com/artifacts/rustfs/release/rustfs-windows-x86_64-v1.0.0-beta.10-preview.3.zip",
                ),
            ],
        )

    def test_rustfs_archive_and_installer_follow_minio_runtime_contract(self) -> None:
        work = TEST_ROOT / "rustfs-package"
        work.mkdir(parents=True, exist_ok=True)
        source_zip = work / "rustfs-source.zip"
        cached_zip = work / "rustfs.zip"
        template_zip = work / "template.zip"
        output_zip = work / "output.zip"
        with zipfile.ZipFile(source_zip, "w") as zf:
            zf.writestr("rustfs.exe", b"rustfs-binary")
        with zipfile.ZipFile(template_zip, "w") as zf:
            zf.writestr(
                packager.INSTALL_SCRIPT_IN_STANDALONE_ZIP,
                "Function Install-Mid-Minio {\r\n}\r\n\r\nFunction Install-Mid-Redis {\r\n}\r\n",
            )
            zf.writestr(
                packager.UTIL_SCRIPT_IN_STANDALONE_ZIP,
                '$MIDDLEWARES = @{"minio"=Get-Service-Name -FileName "mid-minio"; \r\n'
                '                 "redis"=Get-Service-Name -FileName "mid-redis"}\r\n'
                "Function Unzip-MiddleWare {\r\n"
                '  Expand-Archive -Path $SuiteHome"\\software\\minio.zip" -DestinationPath $WebPath -Force \r\n'
                "}\r\n",
            )
            zf.writestr(
                packager.SUITE_INSTALL_SCRIPT_IN_STANDALONE_ZIP,
                "Unzip-MiddleWare -SuiteHome $suiteHome -WebPath $webPath\r\n"
                "Install-Mid-Minio -SuiteHome $suiteHome -WebPath $webPath -Config $config\r\n",
            )
            zf.writestr(packager.MIDDLEWARE_IN_STANDALONE_ZIP["minio"], b"minio")

        with patch.object(packager, "_download_file", side_effect=lambda _url, target: target.write_bytes(source_zip.read_bytes())):
            packager._build_cached_middleware_zip(
                "rustfs",
                "1.0.0-beta.12",
                "https://example.invalid/rustfs.zip",
                cached_zip,
                template_zip,
            )

        with zipfile.ZipFile(cached_zip) as zf:
            self.assertEqual(zf.read("rustfs/rustfs.exe"), b"rustfs-binary")
            start_bat = zf.read("rustfs/start.bat").decode("utf-8")
            self.assertIn("rustfs.exe server", start_bat)
            self.assertIn("--console-enable", start_bat)
            self.assertNotIn("--console-enable true", start_bat)
            metadata = json.loads(zf.read("rustfs/.ohr-builder-version.json"))
            self.assertEqual(metadata["version"], "1.0.0-beta.12")

        packager._rebuild_standalone_zip(
            template_zip,
            output_zip,
            None,
            None,
            packager.StandaloneConfig(postgresql_host="localhost"),
            middleware_overrides={packager.MIDDLEWARE_IN_STANDALONE_ZIP["rustfs"]: cached_zip},
            include_minio=False,
            include_rustfs=True,
        )

        with zipfile.ZipFile(output_zip) as zf:
            names = set(zf.namelist())
            self.assertIn(packager.MIDDLEWARE_IN_STANDALONE_ZIP["rustfs"], names)
            self.assertNotIn(packager.MIDDLEWARE_IN_STANDALONE_ZIP["minio"], names)
            install = zf.read(packager.INSTALL_SCRIPT_IN_STANDALONE_ZIP).decode("utf-8")
            util = zf.read(packager.UTIL_SCRIPT_IN_STANDALONE_ZIP).decode("utf-8")
            suite = zf.read(packager.SUITE_INSTALL_SCRIPT_IN_STANDALONE_ZIP).decode("utf-8")
            self.assertIn("Function Install-Mid-RustFS", install)
            self.assertIn("RUSTFS_ACCESS_KEY", install)
            self.assertIn('"rustfs"=Get-Service-Name -FileName "mid-rustfs"', util)
            self.assertIn("software\\rustfs.zip", util)
            self.assertIn("Install-Mid-RustFS", suite)

    def test_job_validation_rejects_minio_and_rustfs_together(self) -> None:
        payload = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "2026080301",
            "backend_branch": "release_test",
            "include_minio": True,
            "include_rustfs": True,
        }
        _, error = console.validate_job_payload(payload)
        self.assertEqual(error, "MinIO と RustFS は同時に選択できません")

    def test_job_validation_requires_a_rustfs_version(self) -> None:
        payload = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "2026080301",
            "backend_branch": "release_test",
            "include_rustfs": True,
        }
        _, error = console.validate_job_payload(payload)
        self.assertEqual(error, "missing middleware_rustfs_version")

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
