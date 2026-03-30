#!/usr/bin/env python3
import argparse
import json
import sys
import time
import uuid
import urllib.error
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


def http_request(
    method: str,
    url: str,
    json_body: Optional[dict] = None,
    headers: Optional[dict] = None,
) -> tuple[int, Any]:
    body = None
    request_headers = {"Accept": "application/json"}

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
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, parse_response_body(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, parse_response_body(e.read())
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


def append_local_result(results: list[StepResult], name: str, ok: bool, preview: Any) -> None:
    results.append(
        StepResult(
            name=name,
            method="LOCAL",
            url="-",
            expected_status=1,
            actual_status=1 if ok else 0,
            ok=ok,
            elapsed_ms=0,
            response_preview=pretty_preview(preview),
        )
    )


def auth_flow(results: list[StepResult], base_url: str, role: str = "applicant") -> tuple[dict, str]:
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
        json_body={
            "email": email,
            "password": password,
            "displayName": display_name,
            "role": role,
        },
    )

    _, login_payload = run_step(
        results,
        "login",
        "POST",
        f"{base_url}/api/v1/auth/login",
        200,
        json_body={
            "email": email,
            "password": password,
        },
    )

    access_token = login_payload.get("accessToken") if isinstance(login_payload, dict) else None
    if not access_token:
        append_local_result(results, "extract access token", False, login_payload)
        return {"email": email, "displayName": display_name, "role": role}, ""

    _, me_payload = run_step(
        results,
        "me",
        "GET",
        f"{base_url}/api/v1/me",
        200,
        headers={"Authorization": f"Bearer {access_token}"},
    )

    me_ok = (
        isinstance(me_payload, dict)
        and me_payload.get("email") == email
        and me_payload.get("role") == role
    )
    append_local_result(results, "me payload validation", me_ok, me_payload)

    reg_ok = (
        isinstance(register_payload, dict)
        and register_payload.get("user", {}).get("email") == email
        and register_payload.get("user", {}).get("role") == role
    )
    append_local_result(results, "register payload validation", reg_ok, register_payload)

    return {"email": email, "displayName": display_name, "role": role}, access_token


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


def run_networking_profile_mode(base_url: str) -> int:
    results: list[StepResult] = []

    # applicant A
    _, token_a = auth_flow(results, base_url, "applicant")
    if not token_a:
        return print_summary(results)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # applicant B
    _, token_b = auth_flow(results, base_url, "applicant")
    if not token_b:
        return print_summary(results)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # fill applicant A profile so visibility checks are meaningful
    profile_patch_a = {
        "fullName": "Networking Applicant A",
        "university": "TPU",
        "studyCourse": "4",
        "graduationYear": 2027,
        "about": "Interested in backend internships",
        "resumeText": "Rust backend trainee with SQLx and Axum experience",
        "portfolioLinks": ["https://github.com/example/networking-a"],
    }
    run_step(
        results,
        "patch applicant profile a",
        "PATCH",
        f"{base_url}/api/v1/applicant-profile/me",
        200,
        json_body=profile_patch_a,
        headers=headers_a,
    )

    # current profile of A
    _, profile_a_me = run_step(
        results,
        "get applicant profile a me",
        "GET",
        f"{base_url}/api/v1/applicant-profile/me",
        200,
        headers=headers_a,
    )
    applicant_profile_id_a = profile_a_me.get("id") if isinstance(profile_a_me, dict) else None
    append_local_result(results, "resolve applicant a profile id", applicant_profile_id_a is not None, profile_a_me)
    if applicant_profile_id_a is None:
        return print_summary(results)

    # current user B
    _, me_b_payload = run_step(
        results,
        "me applicant b",
        "GET",
        f"{base_url}/api/v1/me",
        200,
        headers=headers_b,
    )
    user_id_b = me_b_payload.get("id") if isinstance(me_b_payload, dict) else None
    append_local_result(results, "resolve applicant b user id", user_id_b is not None, me_b_payload)
    if user_id_b is None:
        return print_summary(results)

    # 1) current default behavior: profile is already visible to authorized users
    _, visible_default = run_step(
        results,
        "get applicant profile by id default",
        "GET",
        f"{base_url}/api/v1/applicant-profiles/{applicant_profile_id_a}",
        200,
        headers=headers_b,
    )

    scope_default_ok = (
        isinstance(visible_default, dict)
        and visible_default.get("visibilityScope") == "all_authorized"
    )
    append_local_result(results, "default visibility scope all_authorized", scope_default_ok, visible_default)

    resume_hidden_default_ok = (
        isinstance(visible_default, dict)
        and visible_default.get("resumeText") is None
        and visible_default.get("portfolioLinks") == []
    )
    append_local_result(results, "resume hidden for all_authorized", resume_hidden_default_ok, visible_default)

    # 2) explicitly set privacy for A
    privacy_patch = {
        "resumeVisibleToContacts": True,
        "resumeVisibleToAllAuth": False,
        "applicationsVisibleToContacts": True,
        "applicationsVisibleToAllAuth": False,
        "profileVisibleToAllAuth": True,
    }
    run_step(
        results,
        "patch privacy settings a",
        "PATCH",
        f"{base_url}/api/v1/privacy-settings/me",
        200,
        json_body=privacy_patch,
        headers=headers_a,
    )

    _, visible_before_contact = run_step(
        results,
        "get applicant profile by id open",
        "GET",
        f"{base_url}/api/v1/applicant-profiles/{applicant_profile_id_a}",
        200,
        headers=headers_b,
    )

    scope_before_ok = (
        isinstance(visible_before_contact, dict)
        and visible_before_contact.get("visibilityScope") == "all_authorized"
    )
    append_local_result(results, "visibility scope all_authorized", scope_before_ok, visible_before_contact)

    resume_hidden_ok = (
        isinstance(visible_before_contact, dict)
        and visible_before_contact.get("resumeText") is None
        and visible_before_contact.get("portfolioLinks") == []
    )
    append_local_result(results, "resume hidden before contact", resume_hidden_ok, visible_before_contact)

    # 3) create contact A -> B
    _, create_contact_payload = run_step(
        results,
        "create contact request",
        "POST",
        f"{base_url}/api/v1/contacts/requests",
        200,
        json_body={"addresseeUserId": user_id_b},
        headers=headers_a,
    )

    contact_id = create_contact_payload.get("id") if isinstance(create_contact_payload, dict) else None
    create_pending_ok = (
        isinstance(create_contact_payload, dict)
        and create_contact_payload.get("status") == "pending"
    )
    append_local_result(results, "contact request pending", create_pending_ok, create_contact_payload)
    if contact_id is None:
        return print_summary(results)

    # 4) B accepts
    _, accept_payload = run_step(
        results,
        "accept contact request",
        "PATCH",
        f"{base_url}/api/v1/contacts/{contact_id}",
        200,
        json_body={"status": "accepted"},
        headers=headers_b,
    )
    accept_ok = (
        isinstance(accept_payload, dict)
        and accept_payload.get("status") == "accepted"
    )
    append_local_result(results, "contact accepted", accept_ok, accept_payload)

    # 5) now B should see richer profile as contact
    _, visible_after_contact = run_step(
        results,
        "get applicant profile by id contact",
        "GET",
        f"{base_url}/api/v1/applicant-profiles/{applicant_profile_id_a}",
        200,
        headers=headers_b,
    )

    scope_contact_ok = (
        isinstance(visible_after_contact, dict)
        and visible_after_contact.get("visibilityScope") == "contact"
    )
    append_local_result(results, "visibility scope contact", scope_contact_ok, visible_after_contact)

    resume_visible_ok = (
        isinstance(visible_after_contact, dict)
        and visible_after_contact.get("resumeText") == profile_patch_a["resumeText"]
        and visible_after_contact.get("portfolioLinks") == profile_patch_a["portfolioLinks"]
    )
    append_local_result(results, "resume visible for contact", resume_visible_ok, visible_after_contact)

    career_flag_ok = (
        isinstance(visible_after_contact, dict)
        and visible_after_contact.get("careerInterestsVisible") is True
    )
    append_local_result(results, "career interests visible flag", career_flag_ok, visible_after_contact)

    return print_summary(results)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Networking profile smoke test for Trampolin backend API"
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080",
        help="Backend base URL",
    )
    args = parser.parse_args()

    return run_networking_profile_mode(args.base_url)


if __name__ == "__main__":
    sys.exit(main())