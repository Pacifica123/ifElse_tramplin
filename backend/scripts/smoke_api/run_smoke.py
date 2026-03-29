#!/usr/bin/env python3
import argparse
import json
import sys
import time
import uuid
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class StepResult:
    name: str
    method: str
    url: str
    expected_status: int
    actual_status: int
    ok: bool
    elapsed_ms: int
    response_preview: str


def pretty_preview(data: Any, limit: int = 220) -> str:
    if isinstance(data, (dict, list)):
        text = json.dumps(data, ensure_ascii=False)
    else:
        text = str(data)

    text = text.replace("\n", " ")
    if len(text) > limit:
        return text[: limit - 3] + "..."
    return text


def parse_response_body(raw: bytes) -> Any:
    if not raw:
        return None

    text = raw.decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def http_request(
    method: str,
    url: str,
    json_body: Optional[dict] = None,
    headers: Optional[dict] = None,
) -> tuple[int, Any]:
    body = None
    request_headers = {
        "Accept": "application/json",
    }

    if headers:
        request_headers.update(headers)

    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        url=url,
        data=body,
        headers=request_headers,
        method=method.upper(),
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            return resp.status, parse_response_body(raw)
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, parse_response_body(raw)
    except urllib.error.URLError as e:
        return 0, f"Connection error: {e}"


def run_step(
    results: list[StepResult],
    name: str,
    method: str,
    url: str,
    expected_status: int,
    json_body: Optional[dict] = None,
    headers: Optional[dict] = None,
) -> tuple[int, Any]:
    started = time.perf_counter()
    status, payload = http_request(method, url, json_body=json_body, headers=headers)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    ok = status == expected_status
    results.append(
        StepResult(
            name=name,
            method=method,
            url=url,
            expected_status=expected_status,
            actual_status=status,
            ok=ok,
            elapsed_ms=elapsed_ms,
            response_preview=pretty_preview(payload),
        )
    )

    return status, payload


def run_stub_mode(base_url: str) -> int:
    results: list[StepResult] = []

    run_step(
        results,
        name="root health",
        method="GET",
        url=f"{base_url}/health",
        expected_status=200,
    )

    run_step(
        results,
        name="api health",
        method="GET",
        url=f"{base_url}/api/v1/health",
        expected_status=200,
    )

    run_step(
        results,
        name="auth login stub",
        method="POST",
        url=f"{base_url}/api/v1/auth/login",
        expected_status=501,
    )

    return print_summary(results)


def run_auth_mode(base_url: str, role: str) -> int:
    results: list[StepResult] = []

    email = f"smoke_{uuid.uuid4().hex[:10]}@example.com"
    password = "password123"
    display_name = f"Smoke {role.title()}"

    run_step(
        results,
        name="root health",
        method="GET",
        url=f"{base_url}/health",
        expected_status=200,
    )

    run_step(
        results,
        name="api health",
        method="GET",
        url=f"{base_url}/api/v1/health",
        expected_status=200,
    )

    _, register_payload = run_step(
        results,
        name="register",
        method="POST",
        url=f"{base_url}/api/v1/auth/register",
        expected_status=201,
        json_body={
            "email": email,
            "password": password,
            "displayName": display_name,
            "role": role,
        },
    )

    _, login_payload = run_step(
        results,
        name="login",
        method="POST",
        url=f"{base_url}/api/v1/auth/login",
        expected_status=200,
        json_body={
            "email": email,
            "password": password,
        },
    )

    access_token = None
    if isinstance(login_payload, dict):
        access_token = login_payload.get("accessToken")

    if not access_token:
        results.append(
            StepResult(
                name="extract access token",
                method="LOCAL",
                url="-",
                expected_status=1,
                actual_status=0,
                ok=False,
                elapsed_ms=0,
                response_preview="accessToken not found in login response",
            )
        )
        return print_summary(results)

    _, me_payload = run_step(
        results,
        name="me",
        method="GET",
        url=f"{base_url}/api/v1/me",
        expected_status=200,
        headers={
            "Authorization": f"Bearer {access_token}",
        },
    )

    if isinstance(me_payload, dict):
        me_ok = (
            me_payload.get("email") == email
            and me_payload.get("role") == role
        )
        results.append(
            StepResult(
                name="me payload validation",
                method="LOCAL",
                url="-",
                expected_status=1,
                actual_status=1 if me_ok else 0,
                ok=me_ok,
                elapsed_ms=0,
                response_preview=pretty_preview(me_payload),
            )
        )
    else:
        results.append(
            StepResult(
                name="me payload validation",
                method="LOCAL",
                url="-",
                expected_status=1,
                actual_status=0,
                ok=False,
                elapsed_ms=0,
                response_preview="Response is not JSON object",
            )
        )

    if isinstance(register_payload, dict):
        user = register_payload.get("user", {})
        reg_ok = user.get("email") == email and user.get("role") == role
        results.append(
            StepResult(
                name="register payload validation",
                method="LOCAL",
                url="-",
                expected_status=1,
                actual_status=1 if reg_ok else 0,
                ok=reg_ok,
                elapsed_ms=0,
                response_preview=pretty_preview(register_payload),
            )
        )

    return print_summary(results)


def print_summary(results: list[StepResult]) -> int:
    print()
    print("=" * 96)
    print(f"{'OK':<4} {'STEP':<28} {'METHOD':<8} {'EXP':<5} {'ACT':<5} {'MS':<6} PREVIEW")
    print("-" * 96)

    failed = 0
    for item in results:
        mark = "PASS" if item.ok else "FAIL"
        if not item.ok:
            failed += 1

        print(
            f"{mark:<4} "
            f"{item.name[:28]:<28} "
            f"{item.method:<8} "
            f"{item.expected_status!s:<5} "
            f"{item.actual_status!s:<5} "
            f"{item.elapsed_ms!s:<6} "
            f"{item.response_preview}"
        )

    print("-" * 96)
    print(f"Total: {len(results)} | Passed: {len(results) - failed} | Failed: {failed}")
    print("=" * 96)
    print()

    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke test runner for Trampolin backend API"
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080",
        help="Backend base URL",
    )
    parser.add_argument(
        "--mode",
        choices=["stub", "auth"],
        default="auth",
        help="stub = health + 501 check, auth = register/login/me flow",
    )
    parser.add_argument(
        "--role",
        choices=["applicant", "employer"],
        default="applicant",
        help="Registration role for auth mode",
    )

    args = parser.parse_args()

    if args.mode == "stub":
        return run_stub_mode(args.base_url)

    return run_auth_mode(args.base_url, args.role)


if __name__ == "__main__":
    sys.exit(main())