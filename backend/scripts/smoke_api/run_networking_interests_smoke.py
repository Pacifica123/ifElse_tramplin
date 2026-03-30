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


def run_networking_interests_mode(base_url: str) -> int:
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

    # applicant A profile id
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

    # applicant B user id
    _, me_b = run_step(
        results,
        "me applicant b",
        "GET",
        f"{base_url}/api/v1/me",
        200,
        headers=headers_b,
    )
    user_id_b = me_b.get("id") if isinstance(me_b, dict) else None
    append_local_result(results, "resolve applicant b user id", user_id_b is not None, me_b)
    if user_id_b is None:
        return print_summary(results)

    # allow contacts to see career interests
    run_step(
        results,
        "patch privacy settings a",
        "PATCH",
        f"{base_url}/api/v1/privacy-settings/me",
        200,
        json_body={
            "resumeVisibleToContacts": True,
            "resumeVisibleToAllAuth": False,
            "applicationsVisibleToContacts": True,
            "applicationsVisibleToAllAuth": False,
            "profileVisibleToAllAuth": True,
        },
        headers=headers_a,
    )

    # need at least one opportunity
    _, opportunities_payload = run_step(
        results,
        "list opportunities",
        "GET",
        f"{base_url}/api/v1/opportunities",
        200,
    )
    items = opportunities_payload.get("items", []) if isinstance(opportunities_payload, dict) else []
    if not items:
        append_local_result(results, "catalog has opportunities", False, opportunities_payload)
        return print_summary(results)

    opportunity_id = items[0].get("id")
    append_local_result(results, "resolve opportunity id", opportunity_id is not None, items[0])
    if opportunity_id is None:
        return print_summary(results)

    # applicant A creates application
    _, application_payload = run_step(
        results,
        "create application",
        "POST",
        f"{base_url}/api/v1/opportunities/{opportunity_id}/applications",
        201,
        json_body={"coverLetter": "I want to join this opportunity"},
        headers=headers_a,
    )
    application_ok = (
        isinstance(application_payload, dict)
        and application_payload.get("opportunityId") == opportunity_id
    )
    append_local_result(results, "application created", application_ok, application_payload)

    # applicant A adds favorite
    run_step(
        results,
        "add favorite opportunity",
        "POST",
        f"{base_url}/api/v1/favorites/opportunities/{opportunity_id}",
        204,
        headers=headers_a,
    )

    # before contact B must get 403
    run_step(
        results,
        "career interests forbidden before contact",
        "GET",
        f"{base_url}/api/v1/contacts/applicant-profiles/{applicant_profile_id_a}/career-interests",
        403,
        headers=headers_b,
    )

    # create contact request A -> B
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
    append_local_result(results, "resolve contact id", contact_id is not None, create_contact_payload)
    if contact_id is None:
        return print_summary(results)

    # B accepts
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

    # after contact B must see interests
    _, interests_payload = run_step(
        results,
        "career interests visible",
        "GET",
        f"{base_url}/api/v1/contacts/applicant-profiles/{applicant_profile_id_a}/career-interests",
        200,
        headers=headers_b,
    )

    interests_ok = isinstance(interests_payload, list) and len(interests_payload) > 0
    append_local_result(results, "career interests non-empty", interests_ok, interests_payload)

    has_applied = isinstance(interests_payload, list) and any(
        item.get("type") == "applied" for item in interests_payload
    )
    append_local_result(results, "career interests has applied", has_applied, interests_payload)

    has_favorited = isinstance(interests_payload, list) and any(
        item.get("type") == "favorited" for item in interests_payload
    )
    append_local_result(results, "career interests has favorited", has_favorited, interests_payload)

    return print_summary(results)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Networking interests smoke test for Trampolin backend API"
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080",
        help="Backend base URL",
    )
    args = parser.parse_args()

    return run_networking_interests_mode(args.base_url)


if __name__ == "__main__":
    sys.exit(main())