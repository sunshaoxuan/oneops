from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


PROGRESS_STEPS = (
    "terminal_check",
    "terminal_dispatch",
    "terminal_build",
    "download_artifacts",
    "sql_assets",
    "data_sync_assets",
    "account_sql",
    "help_sql",
    "standalone_zip",
    "complete",
)


def safe_component(value: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", str(value))
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return (cleaned or "共通")[:80].strip(" .") or "共通"


def delivery_name(request: dict[str, Any], job_id: str) -> str:
    if str(request.get("product_variant") or "").lower() == "nho":
        customer = "NHO"
    elif str(request.get("standard_build_mode") or "").lower() == "standard_release":
        customer = "標準発版"
    else:
        customer = str(
            request.get("organisation_name")
            or request.get("material_number")
            or "共通"
        )
    return f"{safe_component(customer)} {job_id}"


def numeric(raw: str, name: str, fallback: int) -> int:
    match = re.search(rf'"{re.escape(name)}"\s*:\s*(\d+)', raw)
    return int(match.group(1)) if match else fallback


def string_value(raw: str, name: str) -> str:
    match = re.search(rf'"{re.escape(name)}"\s*:\s*"([^"]*)"', raw)
    return match.group(1) if match else ""


def job_timestamp(job_id: str) -> int:
    parsed = datetime.strptime(job_id, "%Y%m%d%H%M%S")
    return int(parsed.replace(tzinfo=ZoneInfo("Asia/Tokyo")).timestamp())


def build_outputs(
    job_dir: Path,
    delivery_dir: Path,
) -> dict[str, Any]:
    outputs: dict[str, Any] = {"product_dir": str(delivery_dir)}
    candidates = {
        "common_zip": delivery_dir / "共通.zip",
        "standalone_zip": delivery_dir / "製品" / "OneHrStandalone.zip",
        "version_txt": delivery_dir / "製品" / "version.txt",
        "package_zip": delivery_dir / "package.zip",
        "web_zip": delivery_dir / "web.zip",
        "help_sql": delivery_dir / "ohr_help.sql",
    }
    if not candidates["version_txt"].is_file():
        candidates["version_txt"] = delivery_dir / "version.txt"
    for key, path in candidates.items():
        if path.is_file():
            outputs[key] = str(path)
    for name, key in (
        ("package.zip", "package_zip"),
        ("web.zip", "web_zip"),
        ("nho_database_assets.zip", "database_assets_zip"),
    ):
        path = job_dir / name
        if path.is_file() and key not in outputs:
            outputs[key] = str(path)
    outputs["size"] = sum(
        path.stat().st_size
        for path in candidates.values()
        if path.is_file()
    )
    return outputs


def build_progress(
    request: dict[str, Any],
    created_at: int,
    updated_at: int,
) -> list[dict[str, Any]]:
    skipped: set[str] = set()
    if str(request.get("product_variant") or "").lower() == "nho":
        skipped.update({"data_sync_assets", "account_sql", "help_sql"})
    if str(request.get("standard_build_mode") or "").lower() == "standard_release":
        skipped.update(
            {
                "sql_assets",
                "data_sync_assets",
                "account_sql",
                "standalone_zip",
            }
        )
    return [
        {
            "id": step,
            "status": "skipped" if step in skipped else "success",
            "started_at": created_at,
            "finished_at": updated_at,
        }
        for step in PROGRESS_STEPS
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--builds",
        default=r"D:\nginx\app\builder-data\standalone-builds",
    )
    parser.add_argument(
        "--deliveries",
        default=r"D:\nginx\app\builder-data\deliveries",
    )
    parser.add_argument(
        "--backup",
        default=r"D:\nginx\backups\onebuild-metadata-encoding-20260724",
    )
    args = parser.parse_args()
    builds = Path(args.builds).resolve()
    deliveries = Path(args.deliveries).resolve()
    backup = Path(args.backup).resolve()
    if builds != Path(r"D:\nginx\app\builder-data\standalone-builds"):
        raise ValueError(f"unexpected builds directory: {builds}")
    if deliveries != Path(r"D:\nginx\app\builder-data\deliveries"):
        raise ValueError(f"unexpected deliveries directory: {deliveries}")
    backup.mkdir(parents=True, exist_ok=True)
    repaired: list[str] = []
    for config_path in sorted((builds / "config-history").glob("*.json")):
        config = json.loads(config_path.read_text(encoding="utf-8"))
        job_id = str(config["job_id"])
        metadata_path = builds / job_id / "metadata.json"
        raw = metadata_path.read_text(encoding="utf-8", errors="replace")
        try:
            json.loads(raw)
            continue
        except json.JSONDecodeError:
            pass
        shutil.copy2(metadata_path, backup / f"{job_id}.metadata.corrupt.json")
        request = dict(config.get("request") or {})
        delivery_dir = deliveries / delivery_name(request, job_id)
        if not delivery_dir.is_dir():
            raise FileNotFoundError(f"delivery directory missing: {delivery_dir}")
        fallback = job_timestamp(job_id)
        created_at = numeric(raw, "created_at", fallback)
        updated_at = numeric(
            raw,
            "updated_at",
            int(metadata_path.stat().st_mtime),
        )
        job = {
            "id": job_id,
            "status": "success",
            "created_at": created_at,
            "updated_at": updated_at,
            "remote_build_id": string_value(raw, "remote_build_id"),
            "remote_log_offset": numeric(raw, "remote_log_offset", 0),
            "request": request,
            "log": [],
            "outputs": build_outputs(builds / job_id, delivery_dir),
            "progress": build_progress(request, created_at, updated_at),
            "remote_build_status": string_value(raw, "remote_build_status")
            or "success",
            "heartbeat_at": numeric(raw, "heartbeat_at", updated_at),
        }
        metadata_path.write_text(
            json.dumps(job, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        repaired.append(job_id)
    print(
        json.dumps(
            {
                "repaired": repaired,
                "count": len(repaired),
                "backup": str(backup),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
