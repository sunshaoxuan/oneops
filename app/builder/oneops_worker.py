#!/usr/bin/env python3
from __future__ import annotations

import base64
import io
import json
import os
import sys
import threading
import traceback
from email.message import Message
from http import HTTPStatus
from pathlib import Path
from typing import Any


def load_local_environment() -> None:
    root = Path(__file__).resolve().parent
    for name in ("vm-access.env", "git-access.env"):
        path = root / name
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip()
            if (
                len(value) >= 2
                and value[0] == value[-1]
                and value[0] in {"'", '"'}
            ):
                value = value[1:-1]
            os.environ.setdefault(key.strip(), value)


load_local_environment()

import host_standalone_console as console


class CapturedHandler(console.Handler):
    def __init__(self, request: dict[str, Any]) -> None:
        self.path = str(request.get("path") or "/")
        self.command = str(request.get("method") or "GET").upper()
        self.request_version = "HTTP/1.1"
        self.close_connection = False
        self.rfile = io.BytesIO(
            base64.b64decode(str(request.get("bodyBase64") or ""))
        )
        self.wfile = io.BytesIO()
        self.headers = Message()
        for key, value in dict(request.get("headers") or {}).items():
            self.headers[str(key)] = str(value)
        self.headers["X-Management-Token"] = console.MANAGEMENT_TOKEN
        if self.headers.get("Content-Length") is None:
            self.headers["Content-Length"] = str(len(self.rfile.getbuffer()))
        self.response_status = int(HTTPStatus.OK)
        self.response_headers: list[tuple[str, str]] = []

    def send_response(
        self,
        code: int | HTTPStatus,
        message: str | None = None,
    ) -> None:
        self.response_status = int(code)

    def send_header(self, keyword: str, value: str) -> None:
        if keyword.lower() != "set-cookie":
            self.response_headers.append((keyword, value))

    def end_headers(self) -> None:
        return

    def send_error(
        self,
        code: int | HTTPStatus,
        message: str | None = None,
        explain: str | None = None,
    ) -> None:
        self.send_json(
            {"error": message or HTTPStatus(int(code)).phrase},
            HTTPStatus(int(code)),
        )


def file_response(request: dict[str, Any]) -> dict[str, Any] | None:
    path = str(request.get("path") or "").split("?", 1)[0]
    parts = path.strip("/").split("/")
    if (
        str(request.get("method") or "GET").upper() == "GET"
        and len(parts) == 5
        and parts[:2] == ["api", "jobs"]
        and parts[3:] == ["download-package", "file"]
    ):
        job_id = parts[2]
        try:
            job = console.read_job(job_id)
        except FileNotFoundError:
            return json_response(HTTPStatus.NOT_FOUND, {"error": "not_found"})
        info = console.delivery_download_info(job)
        if not info.get("available"):
            status = HTTPStatus.GONE if info.get("expired") else HTTPStatus.NOT_FOUND
            return json_response(
                status,
                {
                    "error": "download_package_unavailable",
                    "download_package": info,
                },
            )
        package_path = console.delivery_download_path(job).resolve()
        if not package_path.is_file():
            return json_response(
                HTTPStatus.NOT_FOUND,
                {"error": "download_package_unavailable"},
            )
        return {
            "status": int(HTTPStatus.OK),
            "headers": {
                "Content-Type": "application/zip",
                "Content-Disposition": (
                    "attachment; filename*=UTF-8''"
                    + console.urllib.parse.quote(
                        str(info.get("filename") or package_path.name)
                    )
                ),
                "Cache-Control": "no-store, max-age=0, must-revalidate",
                "Content-Length": str(package_path.stat().st_size),
            },
            "filePath": str(package_path),
        }
    return None


def json_response(
    status: int | HTTPStatus,
    value: dict[str, Any],
) -> dict[str, Any]:
    body = json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")
    return {
        "status": int(status),
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": str(len(body)),
        },
        "bodyBase64": base64.b64encode(body).decode("ascii"),
    }


def dispatch(request: dict[str, Any]) -> dict[str, Any]:
    direct = file_response(request)
    if direct is not None:
        return direct
    handler = CapturedHandler(request)
    method = handler.command
    if method == "GET":
        handler.do_GET()
    elif method == "POST":
        handler.do_POST()
    elif method == "DELETE":
        handler.do_DELETE()
    else:
        handler.send_error(HTTPStatus.METHOD_NOT_ALLOWED)
    headers: dict[str, str] = {}
    for key, value in handler.response_headers:
        if key.lower() not in {"content-length", "connection"}:
            headers[key] = value
    body = handler.wfile.getvalue()
    headers["Content-Length"] = str(len(body))
    return {
        "status": handler.response_status,
        "headers": headers,
        "bodyBase64": base64.b64encode(body).decode("ascii"),
    }


write_lock = threading.Lock()


def write_response(request_id: str, response: dict[str, Any]) -> None:
    response["id"] = request_id
    line = json.dumps(response, ensure_ascii=False, separators=(",", ":"))
    with write_lock:
        sys.stdout.write(line + "\n")
        sys.stdout.flush()


def handle(request: dict[str, Any]) -> None:
    request_id = str(request.get("id") or "")
    try:
        write_response(request_id, dispatch(request))
    except Exception as error:
        traceback.print_exc(file=sys.stderr)
        write_response(
            request_id,
            json_response(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {
                    "error": "builder_worker_failed",
                    "message": str(error),
                },
            ),
        )


def main() -> int:
    console.DATA_DIR.mkdir(parents=True, exist_ok=True)
    console.resume_unfinished_jobs()
    sys.stdout.write(
        json.dumps(
            {
                "event": "ready",
                "appVersion": console.APP_VERSION,
                "dataDir": str(console.DATA_DIR.resolve()),
                "outputDir": str(console.configured_output_dir().resolve()),
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + "\n"
    )
    sys.stdout.flush()
    for raw in sys.stdin:
        try:
            request = json.loads(raw)
        except json.JSONDecodeError:
            continue
        threading.Thread(target=handle, args=(request,), daemon=True).start()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
