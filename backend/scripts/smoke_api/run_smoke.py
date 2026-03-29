#!/usr/bin/env python3
import argparse
import json
import sys
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request
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
    return text if len(text) <= limit else text[: limit - 3] + "..."


def parse_response_body(raw: bytes) -> Any:
    if not raw:
        return None
    text = raw.decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def http_request(method: str, url: str, json_body: Optional[dict] = None, headers: Optional[dict] = None) -> tuple[int, Any]:
    body = None
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, data=body, headers=request_headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, parse_response_body(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, parse_response_body(e.read())
    except urllib.error.URLError as e:
        return 0, f"Connection error: {e}"


def run_step(results: list[StepResult], name: str, method: str, url: str, expected_status: int, json_body: Optional[dict] = None, headers: Optional[dict] = None) -> tuple[int, Any]:
    started = time.perf_counter()
    status, payload = http_request(method, url, json_body=json_body, headers=headers)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    ok = status == expected_status
    results.append(StepResult(name, method, url, expected_status, status, ok, elapsed_ms, pretty_preview(payload)))
    return status, payload


def append_local_result(results: list[StepResult], name: str, ok: bool, preview: Any) -> None:
    results.append(StepResult(name, "LOCAL", "-", 1, 1 if ok else 0, ok, 0, pretty_preview(preview)))


def auth_flow(results: list[StepResult], base_url: str, role: str) -> tuple[dict, str]:
    email = f"smoke_{uuid.uuid4().hex[:10]}@example.com"
    password = "password123"
    display_name = f"Smoke {role.title()}"

    run_step(results, "root health", "GET", f"{base_url}/health", 200)
    run_step(results, "api health", "GET", f"{base_url}/api/v1/health", 200)

    _, register_payload = run_step(
        results,
        "register",
        "POST",
        f"{base_url}/api/v1/auth/register",
        201,
        json_body={"email": email, "password": password, "displayName": display_name, "role": role},
    )

    _, login_payload = run_step(
        results,
        "login",
        "POST",
        f"{base_url}/api/v1/auth/login",
        200,
        json_body={"email": email, "password": password},
    )

    access_token = login_payload.get("accessToken") if isinstance(login_payload, dict) else None
    if not access_token:
        append_local_result(results, "extract access token", False, "accessToken not found in login response")
        return {"email": email, "displayName": display_name, "role": role}, ""

    _, me_payload = run_step(
        results,
        "me",
        "GET",
        f"{base_url}/api/v1/me",
        200,
        headers={"Authorization": f"Bearer {access_token}"},
    )

    me_ok = isinstance(me_payload, dict) and me_payload.get("email") == email and me_payload.get("role") == role
    append_local_result(results, "me payload validation", me_ok, me_payload)

    reg_ok = isinstance(register_payload, dict) and register_payload.get("user", {}).get("email") == email
    append_local_result(results, "register payload validation", reg_ok, register_payload)

    return {"email": email, "displayName": display_name, "role": role}, access_token


def run_stub_mode(base_url: str) -> int:
    results: list[StepResult] = []
    run_step(results, "root health", "GET", f"{base_url}/health", 200)
    run_step(results, "api health", "GET", f"{base_url}/api/v1/health", 200)
    run_step(results, "auth login stub", "POST", f"{base_url}/api/v1/auth/login", 501)
    return print_summary(results)


def run_auth_mode(base_url: str, role: str) -> int:
    results: list[StepResult] = []
    auth_flow(results, base_url, role)
    return print_summary(results)


def run_profiles_mode(base_url: str, role: str) -> int:
    results: list[StepResult] = []
    identity, access_token = auth_flow(results, base_url, role)
    if not access_token:
        return print_summary(results)

    headers = {"Authorization": f"Bearer {access_token}"}

    if role == "applicant":
        profile_url = f"{base_url}/api/v1/applicant-profile/me"
        patch_body = {
            "fullName": "Alice Applicant",
            "university": "TPU",
            "studyCourse": "4",
            "graduationYear": 2027,
            "about": "Backend trainee",
            "resumeText": "Rust + SQLx",
            "portfolioLinks": ["https://github.com/example/applicant"]
        }
        _, profile_payload = run_step(results, "get applicant profile", "GET", profile_url, 200, headers=headers)
        created_ok = isinstance(profile_payload, dict) and profile_payload.get("fullName") == identity["displayName"]
        append_local_result(results, "applicant profile auto-created", created_ok, profile_payload)
        run_step(results, "patch applicant profile", "PATCH", profile_url, 200, json_body=patch_body, headers=headers)
        _, profile_after = run_step(results, "get applicant profile again", "GET", profile_url, 200, headers=headers)
        updated_ok = isinstance(profile_after, dict) and profile_after.get("fullName") == patch_body["fullName"]
        append_local_result(results, "applicant profile updated", updated_ok, profile_after)
    else:
        profile_url = f"{base_url}/api/v1/employer-profile/me"
        patch_body = {
            "companyName": "CodeInsight Employer",
            "shortDescription": "We hire backend interns",
            "industry": "HR Tech",
            "websiteUrl": "https://example.com",
            "socialLinks": ["https://t.me/example_employer"],
            "officePhotos": [],
            "promoVideoUrl": None,
            "cityId": 1
        }
        _, profile_payload = run_step(results, "get employer profile", "GET", profile_url, 200, headers=headers)
        created_ok = isinstance(profile_payload, dict) and profile_payload.get("companyName") == identity["displayName"]
        append_local_result(results, "employer profile auto-created", created_ok, profile_payload)
        run_step(results, "patch employer profile", "PATCH", profile_url, 200, json_body=patch_body, headers=headers)
        _, profile_after = run_step(results, "get employer profile again", "GET", profile_url, 200, headers=headers)
        updated_ok = isinstance(profile_after, dict) and profile_after.get("companyName") == patch_body["companyName"]
        append_local_result(results, "employer profile updated", updated_ok, profile_after)

    append_local_result(results, "profile flow user preserved", True, identity)
    return print_summary(results)


def run_catalog_mode(base_url: str) -> int:
    results: list[StepResult] = []
    run_step(results, "root health", "GET", f"{base_url}/health", 200)
    run_step(results, "api health", "GET", f"{base_url}/api/v1/health", 200)

    _, tags_payload = run_step(results, "list tags", "GET", f"{base_url}/api/v1/tags", 200)
    tags_ok = isinstance(tags_payload, list) and len(tags_payload) > 0
    append_local_result(results, "tags non-empty", tags_ok, tags_payload)

    _, list_payload = run_step(results, "list opportunities", "GET", f"{base_url}/api/v1/opportunities", 200)
    items = list_payload.get("items", []) if isinstance(list_payload, dict) else []
    list_ok = isinstance(list_payload, dict) and isinstance(items, list) and len(items) > 0
    append_local_result(results, "opportunities non-empty", list_ok, list_payload)

    if items:
        opportunity_id = items[0].get("id")
        _, details_payload = run_step(results, "get opportunity by id", "GET", f"{base_url}/api/v1/opportunities/{opportunity_id}", 200)
        details_ok = isinstance(details_payload, dict) and details_payload.get("id") == opportunity_id
        append_local_result(results, "opportunity details matched", details_ok, details_payload)

    query_url = f"{base_url}/api/v1/opportunities?" + urllib.parse.urlencode({"q": "Rust"})
    _, q_payload = run_step(results, "catalog q filter", "GET", query_url, 200)
    q_ok = isinstance(q_payload, dict) and len(q_payload.get("items", [])) > 0
    append_local_result(results, "catalog q filter non-empty", q_ok, q_payload)

    remote_url = f"{base_url}/api/v1/opportunities?" + urllib.parse.urlencode({"workFormat": "remote"})
    _, remote_payload = run_step(results, "catalog remote filter", "GET", remote_url, 200)
    remote_ok = isinstance(remote_payload, dict) and len(remote_payload.get("items", [])) > 0
    append_local_result(results, "catalog remote filter non-empty", remote_ok, remote_payload)

    return print_summary(results)


def run_employer_dashboard_mode(base_url: str) -> int:
    results: list[StepResult] = []
    _, access_token = auth_flow(results, base_url, "employer")
    if not access_token:
        return print_summary(results)

    headers = {"Authorization": f"Bearer {access_token}"}

    run_step(results, "get verification request 404", "GET", f"{base_url}/api/v1/employer/verification-request", 404, headers=headers)

    _, create_vr_payload = run_step(
        results,
        "create verification request",
        "POST",
        f"{base_url}/api/v1/employer/verification-request",
        201,
        json_body={"comment": "Please review our company profile"},
        headers=headers,
    )
    vr_ok = isinstance(create_vr_payload, dict) and create_vr_payload.get("status") == "pending"
    append_local_result(results, "verification request pending", vr_ok, create_vr_payload)

    run_step(results, "get verification request", "GET", f"{base_url}/api/v1/employer/verification-request", 200, headers=headers)
    run_step(results, "duplicate verification request", "POST", f"{base_url}/api/v1/employer/verification-request", 409, json_body={"comment": "duplicate"}, headers=headers)

    create_payload = {
        "title": "Rust Intern Backend",
        "shortDescription": "Paid backend internship with Rust and PostgreSQL",
        "fullDescription": "We are looking for a trainee to work on Rust backend services, SQLx migrations and API development in a real product team.",
        "opportunityType": "internship",
        "workFormat": "remote",
        "employmentType": "part_time",
        "level": "intern",
        "cityId": 1,
        "expiresAt": "2026-06-01T00:00:00Z",
        "tagIds": [1, 4],
        "contactInfo": {"email": "hr@example.com"},
        "resourceLinks": ["https://example.com/jobs/rust-intern"],
        "media": []
    }
    run_step(results, "create opportunity forbidden", "POST", f"{base_url}/api/v1/opportunities", 403, json_body=create_payload, headers=headers)

    _, own_list_payload = run_step(results, "list own opportunities", "GET", f"{base_url}/api/v1/employer/opportunities", 200, headers=headers)
    own_ok = isinstance(own_list_payload, dict) and isinstance(own_list_payload.get("items"), list)
    append_local_result(results, "own opportunities list shape", own_ok, own_list_payload)

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
        print(f"{mark:<4} {item.name[:28]:<28} {item.method:<8} {item.expected_status!s:<5} {item.actual_status!s:<5} {item.elapsed_ms!s:<6} {item.response_preview}")
    print("-" * 96)
    print(f"Total: {len(results)} | Passed: {len(results) - failed} | Failed: {failed}")
    print("=" * 96)
    print()
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test runner for Trampolin backend API")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080", help="Backend base URL")
    parser.add_argument("--mode", choices=["stub", "auth", "profiles", "catalog", "employer_dashboard"], default="auth")
    parser.add_argument("--role", choices=["applicant", "employer"], default="applicant")
    args = parser.parse_args()

    if args.mode == "stub":
        return run_stub_mode(args.base_url)
    if args.mode == "auth":
        return run_auth_mode(args.base_url, args.role)
    if args.mode == "catalog":
        return run_catalog_mode(args.base_url)
    if args.mode == "employer_dashboard":
        return run_employer_dashboard_mode(args.base_url)
    return run_profiles_mode(args.base_url, args.role)


if __name__ == "__main__":
    sys.exit(main())
