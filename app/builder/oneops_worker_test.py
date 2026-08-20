from __future__ import annotations

import base64
import io
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
    def test_https_requires_certificate_and_key_uploads(self) -> None:
        payload = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "20260820",
            "backend_branch": "release_backend",
            "frontend_release_branch": "release_frontend",
            "build_help": False,
            "build_conf_prod": True,
            "conf_server_host": "customer.example.test",
            "postgresql_host": "192.0.2.10",
            "conf_enable_https": True,
        }

        _, missing_certificate = console.validate_job_payload(dict(payload))
        _, missing_key = console.validate_job_payload(
            {**payload, "tls_certificate_base64": base64.b64encode(b"certificate").decode("ascii")}
        )
        accepted, accepted_error = console.validate_job_payload(
            {
                **payload,
                "tls_certificate_base64": base64.b64encode(b"certificate").decode("ascii"),
                "tls_private_key_base64": base64.b64encode(b"private-key").decode("ascii"),
            }
        )

        self.assertEqual(missing_certificate, "missing tls_certificate_file")
        self.assertEqual(missing_key, "missing tls_private_key_file")
        self.assertIsNone(accepted_error)
        self.assertEqual(accepted["conf_web_port"], 80)

    def test_tls_upload_is_stored_outside_job_metadata(self) -> None:
        certificate = b"-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----\n"
        private_key = b"-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n"
        payload = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "20260820",
            "backend_branch": "release_backend",
            "frontend_release_branch": "release_frontend",
            "build_help": False,
            "build_conf_prod": True,
            "conf_server_host": "customer.example.test",
            "postgresql_host": "192.0.2.10",
            "conf_enable_https": True,
            "tls_certificate_base64": base64.b64encode(certificate).decode("ascii"),
            "tls_private_key_base64": base64.b64encode(private_key).decode("ascii"),
        }

        with patch.object(console.ssl, "SSLContext") as ssl_context, patch.object(
            console.threading.Thread, "start"
        ):
            job = console.create_job(payload)

        ssl_context.return_value.load_cert_chain.assert_called_once()
        job_root = console.job_dir(job["id"])
        metadata = console.job_metadata_path(job["id"]).read_text(encoding="utf-8")
        history = console.config_history_path(job["id"]).read_text(encoding="utf-8")
        self.assertNotIn("tls_certificate_base64", metadata)
        self.assertNotIn("tls_private_key_base64", metadata)
        self.assertNotIn("BEGIN PRIVATE KEY", metadata)
        self.assertNotIn("BEGIN PRIVATE KEY", history)
        self.assertEqual((job_root / "tls" / "server.crt").read_bytes(), certificate)
        self.assertEqual((job_root / "tls" / "server.key").read_bytes(), private_key)
        self.assertEqual(job["request"]["web_cert_name"], "server.crt")
        self.assertEqual(job["request"]["web_key_name"], "server.key")
        with console.LOCK:
            console.JOBS.pop(job["id"], None)
        shutil.rmtree(job_root)
        console.config_history_path(job["id"]).unlink(missing_ok=True)

    def test_tls_assets_are_embedded_and_referenced_by_web_configuration(self) -> None:
        work = TEST_ROOT / "tls-web-zip"
        work.mkdir(parents=True, exist_ok=True)
        web_zip = work / "web.zip"
        nginx = "server { listen 443 ssl; ssl_certificate old.pem; ssl_certificate_key old.key; }"
        with zipfile.ZipFile(web_zip, "w") as zf:
            zf.writestr("ohr-cicd/conf_prod/nginx.conf", nginx)
            zf.writestr("ohr-cicd/conf_prod/nginx_https.conf", nginx)
            zf.writestr("ohr-cicd/web_prod/index.html", "ok")

        packager.inject_tls_assets_into_web_zip(web_zip, b"certificate", b"private-key")

        with zipfile.ZipFile(web_zip) as zf:
            self.assertEqual(zf.read(packager.TLS_CERTIFICATE_IN_WEB_ZIP), b"certificate")
            self.assertEqual(zf.read(packager.TLS_PRIVATE_KEY_IN_WEB_ZIP), b"private-key")
            for name in packager.TLS_CONFIGS_IN_WEB_ZIP:
                text = zf.read(name).decode("utf-8")
                self.assertIn("ssl_certificate server.crt;", text)
                self.assertIn("ssl_certificate_key server.key;", text)

        template_zip = work / "template.zip"
        final_zip = work / "OneHrStandalone.zip"
        with zipfile.ZipFile(template_zip, "w") as zf:
            zf.writestr("OneHrStandalone/readme.txt", "template")
        packager._rebuild_standalone_zip(
            template_zip,
            final_zip,
            None,
            web_zip,
            packager.StandaloneConfig(postgresql_host="localhost"),
        )
        with zipfile.ZipFile(final_zip) as outer:
            embedded_web = outer.read(packager.WEB_IN_STANDALONE_ZIP)
        with zipfile.ZipFile(io.BytesIO(embedded_web)) as embedded:
            self.assertEqual(embedded.read(packager.TLS_CERTIFICATE_IN_WEB_ZIP), b"certificate")
            self.assertEqual(embedded.read(packager.TLS_PRIVATE_KEY_IN_WEB_ZIP), b"private-key")

    def test_https_upload_controls_are_part_of_the_oneops_form(self) -> None:
        self.assertIn('name="tls_certificate_file" type="file"', console.INDEX_HTML)
        self.assertIn('name="tls_private_key_file" type="file"', console.INDEX_HTML)
        self.assertIn("payload.tls_certificate_base64 = await fileToBase64", console.APP_JS)
        self.assertIn("payload.tls_private_key_base64 = await fileToBase64", console.APP_JS)

    def test_storage_backends_are_exclusive_and_azure_fields_are_required(self) -> None:
        base = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "20260820",
            "backend_branch": "release_backend",
            "frontend_release_branch": "release_frontend",
            "build_help": False,
            "build_conf_prod": True,
            "conf_server_host": "customer.example.test",
            "postgresql_host": "192.0.2.10",
        }
        _, exclusive_error = console.validate_job_payload(
            {**base, "include_minio": True, "enable_azure_blob_storage": True}
        )
        _, missing_error = console.validate_job_payload(
            {**base, "enable_azure_blob_storage": True}
        )
        accepted, accepted_error = console.validate_job_payload(
            {
                **base,
                "enable_azure_blob_storage": True,
                "azure_account_name": "examplestorage",
                "azure_account_key": base64.b64encode(b"test-key").decode("ascii"),
                "azure_container_name": "example-container",
                "azure_endpoint": "10.0.103.9",
            }
        )

        self.assertEqual(exclusive_error, "MinIO、RustFS、Azure Blob Storage は同時に選択できません")
        self.assertEqual(missing_error, "missing azure_account_name")
        self.assertIsNone(accepted_error)
        self.assertEqual(accepted["azure_endpoint"], "https://10.0.103.9")
        self.assertEqual(accepted["azure_blob_host"], "examplestorage.blob.core.windows.net")
        self.assertIn("AccountName=examplestorage", accepted["azure_connection_string"])

    def test_azure_credentials_are_stored_outside_job_metadata(self) -> None:
        payload = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "20260820",
            "backend_branch": "release_backend",
            "frontend_release_branch": "release_frontend",
            "build_help": False,
            "build_conf_prod": True,
            "conf_server_host": "customer.example.test",
            "postgresql_host": "192.0.2.10",
            "enable_azure_blob_storage": True,
            "azure_account_name": "examplestorage",
            "azure_account_key": base64.b64encode(b"secret-account-key").decode("ascii"),
            "azure_connection_string": (
                "DefaultEndpointsProtocol=https;AccountName=examplestorage;AccountKey="
                + base64.b64encode(b"secret-account-key").decode("ascii")
                + ";EndpointSuffix=core.windows.net"
            ),
            "azure_container_name": "example-container",
            "azure_blob_host": "examplestorage.blob.core.windows.net",
            "azure_endpoint": "https://10.0.103.9",
        }
        with patch.object(console.threading.Thread, "start"):
            job = console.create_job(payload)

        job_root = console.job_dir(job["id"])
        metadata = console.job_metadata_path(job["id"]).read_text(encoding="utf-8")
        history = console.config_history_path(job["id"]).read_text(encoding="utf-8")
        credentials = json.loads((job_root / "azure-credentials.json").read_text(encoding="utf-8"))
        encoded_key = base64.b64encode(b"secret-account-key").decode("ascii")
        self.assertNotIn(encoded_key, metadata)
        self.assertNotIn("DefaultEndpointsProtocol", metadata)
        self.assertNotIn(encoded_key, history)
        self.assertNotIn("DefaultEndpointsProtocol", history)
        self.assertEqual(credentials["account_key"], encoded_key)
        self.assertTrue(job["request"]["azure_credentials_configured"])
        with console.LOCK:
            console.JOBS.pop(job["id"], None)
        shutil.rmtree(job_root)
        console.config_history_path(job["id"]).unlink(missing_ok=True)

    def test_storage_proxy_and_installer_config_follow_azure_selection(self) -> None:
        source = """location ~ ^/minio/(.*)$ {
\tproxy_pass http://localhost:19000;
}
location ~ ^/rustfs/(.*)$ {
\tproxy_pass http://127.0.0.1:12345;
}
location ~ ^/azure/(.*)$ {
\trewrite ^/azure/(.*)$ /$1 break;
\tproxy_pass undefined;
\tproxy_set_header Host undefined;
}
"""
        config = packager.StandaloneConfig(
            postgresql_host="localhost",
            storage_backend="azure",
            azure_account_name="examplestorage",
            azure_account_key="secret-key",
            azure_connection_string="connection-string",
            azure_container_name="example-container",
            azure_blob_host="examplestorage.blob.core.windows.net",
            azure_endpoint="https://10.0.103.9",
        )
        rewritten = source
        for backend in ("minio", "rustfs", "azure"):
            rewritten = packager._set_storage_proxy_enabled(
                rewritten, backend, config.storage_backend == backend
            )
        rewritten = packager._set_azure_proxy_parameters(rewritten, config)
        config_ini = packager.update_config_ini(
            "POSTGRESQL_HOST=x\nPOSTGRESQL_PORT=1\nPOSTGRESQL_USER=x\nPOSTGRESQL_PASS=x\nOHR_HOST_ADDRESS=x\nOHR_SERVICE_PORT=1\n",
            config,
        )

        self.assertIn("# location ~ ^/minio/", rewritten)
        self.assertIn("# location ~ ^/rustfs/", rewritten)
        self.assertIn("location ~ ^/azure/", rewritten)
        self.assertIn("rewrite ^/azure/(.*)$ /example-container/$1 break;", rewritten)
        self.assertIn("proxy_pass https://10.0.103.9;", rewritten)
        self.assertIn("proxy_set_header Host examplestorage.blob.core.windows.net;", rewritten)
        self.assertIn("proxy_ssl_name examplestorage.blob.core.windows.net;", rewritten)
        self.assertIn("AZURE_STORAGE_ACCOUNT_KEY=secret-key", config_ini)
        self.assertIn("AZURE_STORAGE_CONNECTION_STRING=connection-string", config_ini)

        work = TEST_ROOT / "azure-final-package"
        work.mkdir(parents=True, exist_ok=True)
        web_zip = work / "web.zip"
        template_zip = work / "template.zip"
        final_zip = work / "OneHrStandalone.zip"
        with zipfile.ZipFile(web_zip, "w") as zf:
            for name in (
                "ohr-cicd/conf_prod/api-proxy.conf",
                "ohr-cicd/conf_prod/api-proxy-debug.conf",
            ):
                zf.writestr(name, source)
        with zipfile.ZipFile(template_zip, "w") as zf:
            zf.writestr(packager.CONFIG_IN_STANDALONE_ZIP, (
                "POSTGRESQL_HOST=x\nPOSTGRESQL_PORT=1\nPOSTGRESQL_USER=x\n"
                "POSTGRESQL_PASS=x\nOHR_HOST_ADDRESS=x\nOHR_SERVICE_PORT=1\n"
            ))
        packager._rebuild_standalone_zip(template_zip, final_zip, None, web_zip, config)
        with zipfile.ZipFile(final_zip) as outer:
            final_config = outer.read(packager.CONFIG_IN_STANDALONE_ZIP).decode("utf-8")
            final_web_bytes = outer.read(packager.WEB_IN_STANDALONE_ZIP)
        with zipfile.ZipFile(io.BytesIO(final_web_bytes)) as final_web:
            for name in (
                "ohr-cicd/conf_prod/api-proxy.conf",
                "ohr-cicd/conf_prod/api-proxy-debug.conf",
            ):
                proxy = final_web.read(name).decode("utf-8")
                self.assertIn("# location ~ ^/minio/", proxy)
                self.assertIn("# location ~ ^/rustfs/", proxy)
                self.assertIn("proxy_pass https://10.0.103.9;", proxy)
                self.assertIn("proxy_ssl_name examplestorage.blob.core.windows.net;", proxy)
        self.assertIn("AZURE_STORAGE_ACCOUNT_KEY=secret-key", final_config)
        self.assertIn("AZURE_STORAGE_CONTAINER_NAME=example-container", final_config)

    def test_storage_proxy_selection_is_exclusive_and_idempotent(self) -> None:
        source = """location ~ ^/minio/(.*)$ {
\tproxy_pass http://localhost:19000;
}
location ~ ^/rustfs/(.*)$ {
\tproxy_pass http://127.0.0.1:12345;
}
location ~ ^/azure/(.*)$ {
\trewrite ^/azure/(.*)$ /$1 break;
\tproxy_pass undefined;
\tproxy_set_header Host undefined;
}
"""
        expected = {
            "minio": {"minio": True, "rustfs": False, "azure": False},
            "rustfs": {"minio": False, "rustfs": True, "azure": False},
            "azure": {"minio": False, "rustfs": False, "azure": True},
            "none": {"minio": False, "rustfs": False, "azure": False},
        }
        for selection, states in expected.items():
            rewritten = source
            for backend in ("minio", "rustfs", "azure"):
                rewritten = packager._set_storage_proxy_enabled(
                    rewritten, backend, selection == backend
                )
            repeated = rewritten
            for backend in ("minio", "rustfs", "azure"):
                repeated = packager._set_storage_proxy_enabled(
                    repeated, backend, selection == backend
                )
            self.assertEqual(repeated, rewritten)
            for backend, enabled in states.items():
                marker = f"location ~ ^/{backend}/"
                self.assertEqual(marker in rewritten and f"# {marker}" not in rewritten, enabled)

    def test_azure_config_update_replaces_existing_values_without_duplicates(self) -> None:
        config = packager.StandaloneConfig(
            postgresql_host="localhost",
            storage_backend="azure",
            azure_account_name="newaccount",
            azure_account_key="new-key",
            azure_connection_string="new-connection",
            azure_container_name="new-container",
            azure_blob_host="newaccount.blob.core.windows.net",
            azure_endpoint="https://192.0.2.20",
        )
        template = (
            "POSTGRESQL_HOST=x\nPOSTGRESQL_PORT=1\nPOSTGRESQL_USER=x\nPOSTGRESQL_PASS=x\n"
            "OHR_HOST_ADDRESS=x\nOHR_SERVICE_PORT=1\n"
            "AZURE_STORAGE_ACCOUNT_NAME=old\nAZURE_STORAGE_ACCOUNT_NAME=duplicate\n"
            "AZURE_STORAGE_ACCOUNT_KEY=old-key\n"
        )
        updated = packager.update_config_ini(template, config)
        repeated = packager.update_config_ini(updated, config)
        for key in (
            "AZURE_STORAGE_ACCOUNT_NAME",
            "AZURE_STORAGE_ACCOUNT_KEY",
            "AZURE_STORAGE_CONNECTION_STRING",
            "AZURE_STORAGE_CONTAINER_NAME",
            "AZURE_STORAGE_BLOB_HOST",
            "AZURE_STORAGE_ENDPOINT",
        ):
            self.assertEqual(repeated.count(f"{key}="), 1)
        self.assertIn("AZURE_STORAGE_ACCOUNT_NAME=newaccount", repeated)
        self.assertIn("AZURE_STORAGE_ACCOUNT_KEY=new-key", repeated)

    def test_azure_validation_rejects_invalid_or_mismatched_credentials(self) -> None:
        base = {
            "product_variant": "standard",
            "standard_build_mode": "institution_package",
            "material_number": "20260820",
            "backend_branch": "release_backend",
            "build_help": False,
            "build_conf_prod": True,
            "conf_server_host": "customer.example.test",
            "enable_azure_blob_storage": True,
            "azure_account_name": "examplestorage",
            "azure_container_name": "example-container",
            "azure_endpoint": "192.0.2.20",
        }
        _, invalid_error = console.validate_job_payload(
            {**base, "azure_account_key": "not base64"}
        )
        encoded_key = base64.b64encode(b"current-key").decode("ascii")
        _, mismatch_error = console.validate_job_payload(
            {
                **base,
                "azure_account_key": encoded_key,
                "azure_connection_string": (
                    "DefaultEndpointsProtocol=https;AccountName=anotheraccount;"
                    f"AccountKey={encoded_key};EndpointSuffix=core.windows.net;"
                ),
            }
        )
        self.assertEqual(invalid_error, "invalid azure_account_key")
        self.assertEqual(mismatch_error, "azure_connection_string does not match account credentials")

    def test_azure_proxy_configuration_does_not_contain_credentials(self) -> None:
        source = """location ~ ^/azure/(.*)$ {
\trewrite ^/azure/(.*)$ /$1 break;
\tproxy_pass undefined;
\tproxy_set_header Host undefined;
\tproxy_ssl_server_name off;
\tproxy_ssl_name old.example.test;
}
"""
        config = packager.StandaloneConfig(
            postgresql_host="localhost",
            storage_backend="azure",
            azure_account_key="private-key-value",
            azure_connection_string="private-connection-value",
            azure_container_name="example-container",
            azure_blob_host="examplestorage.blob.core.windows.net",
            azure_endpoint="https://192.0.2.20",
        )
        rewritten = packager._set_azure_proxy_parameters(source, config)
        self.assertNotIn(config.azure_account_key, rewritten)
        self.assertNotIn(config.azure_connection_string, rewritten)
        self.assertIn("proxy_ssl_server_name on;", rewritten)
        self.assertIn("proxy_ssl_name examplestorage.blob.core.windows.net;", rewritten)

    def test_azure_fields_are_shown_only_for_the_selected_backend(self) -> None:
        for name in (
            "azure_account_name",
            "azure_account_key",
            "azure_connection_string",
            "azure_container_name",
            "azure_blob_host",
            "azure_endpoint",
        ):
            self.assertIn(f'name="{name}"', console.INDEX_HTML)
        self.assertIn("syncStorageBackendInputs", console.APP_JS)
        self.assertIn("[includeMinioInput, includeRustfsInput, enableAzureBlobStorageInput]", console.APP_JS)

    def test_standard_release_accepts_independent_frontend_or_backend_targets(self) -> None:
        base = {
            "product_variant": "standard",
            "standard_build_mode": "standard_release",
            "material_number": "20260814",
            "build_help": False,
        }

        frontend, frontend_error = console.validate_job_payload(
            {**base, "backend_branch": "", "frontend_release_branch": "release_frontend"}
        )
        backend, backend_error = console.validate_job_payload(
            {**base, "backend_branch": "release_backend", "frontend_release_branch": ""}
        )
        _, missing_error = console.validate_job_payload(
            {**base, "backend_branch": "", "frontend_release_branch": ""}
        )

        self.assertIsNone(frontend_error)
        self.assertEqual(frontend["frontend_release_branch"], "release_frontend")
        self.assertIsNone(backend_error)
        self.assertEqual(backend["backend_branch"], "release_backend")
        self.assertEqual(missing_error, "missing build target")

    def test_standard_release_copies_only_selected_artifacts(self) -> None:
        work = TEST_ROOT / "standard-release-independent-targets"
        work.mkdir(parents=True, exist_ok=True)
        package_zip = work / "package.zip"
        web_zip = work / "web.zip"
        package_zip.write_bytes(b"backend")
        web_zip.write_bytes(b"frontend")

        backend_outputs = console.build_standard_release_artifacts(
            output_root=work / "output",
            build_id="backend-build",
            delivery_name="backend-only",
            package_zip=package_zip,
            web_zip=None,
        )
        frontend_outputs = console.build_standard_release_artifacts(
            output_root=work / "output",
            build_id="frontend-build",
            delivery_name="frontend-only",
            package_zip=None,
            web_zip=web_zip,
        )

        self.assertEqual(Path(backend_outputs["package_zip"]).read_bytes(), b"backend")
        self.assertNotIn("web_zip", backend_outputs)
        self.assertEqual(Path(frontend_outputs["web_zip"]).read_bytes(), b"frontend")
        self.assertNotIn("package_zip", frontend_outputs)

    def test_help_only_custom_package_creates_the_tenant_product_directory(self) -> None:
        work = TEST_ROOT / "help-only-custom-package"
        work.mkdir(parents=True, exist_ok=True)
        web_zip = work / "web.zip"
        doc_path = "ohr-cicd/web_prod/help/docs/12345678-1234-1234-1234-123456789abc/page/index.html"
        sql_path = packager.HELP_SQL_IN_WEB_ZIP
        with zipfile.ZipFile(web_zip, "w") as zf:
            zf.writestr(doc_path, "<html></html>")
            zf.writestr(
                sql_path,
                "INSERT INTO ohr_help (path) VALUES "
                "('docs/12345678-1234-1234-1234-123456789abc/page/');",
            )

        outputs = packager.build_custom_package(
            template_zip=work / "missing-template.zip",
            sql_template_dir=work / "missing-sql-template",
            output_root=work / "output",
            delivery_name="help-only",
            package_zip=None,
            web_zip=web_zip,
            selection=packager.CustomPackageSelection(
                backend=False,
                frontend=False,
                help=True,
                conf_prod=False,
                sql_assets=False,
                data_sync=False,
                import_plan=False,
                runtime=False,
            ),
            version=packager.BuildVersion(
                build_id="202608120001",
                material_number="",
                backend_branch="",
                frontend_branch="",
            ),
            config=packager.StandaloneConfig(postgresql_host="localhost"),
            sql_config=packager.ProductSqlConfig(
                organisation_name="検証機関",
                organisation_dstart="2026-08-01",
            ),
        )

        product_root = Path(outputs["product_dir"])
        help_sql = product_root / "製品" / "1.tenant" / "ohr_help.sql"
        self.assertEqual(outputs["help_sql"], str(help_sql))
        self.assertTrue(help_sql.is_file())
        self.assertTrue((help_sql.parent / "all.sql").is_file())
        self.assertTrue(help_sql.read_text(encoding="utf-8").startswith("DELETE FROM ohr_help;\n"))
        self.assertFalse((product_root / "製品" / "2.ohr").exists())

    def test_selected_sql_assets_still_require_complete_source_templates(self) -> None:
        work = TEST_ROOT / "missing-complete-sql-assets"
        work.mkdir(parents=True, exist_ok=True)

        with self.assertRaisesRegex(FileNotFoundError, "missing SQL templates"):
            packager.build_custom_package(
                template_zip=work / "missing-template.zip",
                sql_template_dir=work / "missing-sql-template",
                output_root=work / "output",
                delivery_name="sql-assets",
                package_zip=None,
                web_zip=None,
                selection=packager.CustomPackageSelection(
                    backend=False,
                    frontend=False,
                    help=False,
                    conf_prod=False,
                    sql_assets=True,
                    data_sync=False,
                    import_plan=False,
                    runtime=False,
                ),
                version=packager.BuildVersion(
                    build_id="202608120003",
                    material_number="",
                    backend_branch="",
                    frontend_branch="",
                ),
                config=packager.StandaloneConfig(postgresql_host="localhost"),
                sql_config=packager.ProductSqlConfig(
                    organisation_name="検証機関",
                    organisation_dstart="2026-08-01",
                ),
            )

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
            "[includeMinioInput, includeRustfsInput, enableAzureBlobStorageInput]",
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
        self.assertEqual(error, "MinIO、RustFS、Azure Blob Storage は同時に選択できません")

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

    def test_stopped_build_terminal_status_is_served_by_the_host_worker(self) -> None:
        stopped = {
            "status": "stopped",
            "configured": True,
            "reachable": False,
        }
        with patch.object(console, "build_terminal_status", return_value=stopped):
            response = worker.dispatch(
                {
                    "method": "GET",
                    "path": "/api/build-terminal/status",
                    "headers": {},
                    "bodyBase64": "",
                }
            )

        self.assertEqual(response["status"], 200)
        body = json.loads(base64.b64decode(response["bodyBase64"]))
        self.assertEqual(body, stopped)

    def test_build_terminal_action_accepts_the_hyperv_success_contract(self) -> None:
        with patch.dict(
            os.environ,
            {"HV_HYPERV_VM_NAME": "test-build-terminal"},
        ), patch.object(
            console.hyperv_host,
            "vm_action",
            return_value=(True, "ok"),
        ):
            result = console.build_terminal_action("start")

        self.assertEqual(
            result,
            {"status": "requested", "ok": True, "result": "ok"},
        )


def tearDownModule() -> None:
    shutil.rmtree(TEST_ROOT, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
