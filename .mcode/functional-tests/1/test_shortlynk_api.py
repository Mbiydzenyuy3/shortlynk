"""
Functional tests for the Shortlynk backend API.
Tests cover: auth (register/login/logout), URL shortening (guest/auth),
URL management (list/update/delete), redirect, and analytics (stats/sources).
"""
import uuid
import time
import requests
import pytest
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "http://localhost:4000"
NS = f"ftrun_{uuid.uuid4().hex[:8]}"

# Use a session with retry logic for rate-limited requests
session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=2,
    status_forcelist=[429],
    allowed_methods=["HEAD", "GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
)
adapter = HTTPAdapter(max_retries=retries)
session.mount("http://", adapter)
session.mount("https://", adapter)


@pytest.fixture(autouse=True)
def health_check():
    """Confirm the app is reachable before running tests."""
    for attempt in range(5):
        resp = session.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            return
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 5))
            time.sleep(min(wait, 10))
        else:
            break
    assert resp.status_code == 200, f"Health check failed with status {resp.status_code}"


@pytest.fixture(autouse=True)
def rate_limit_pause():
    """Small pause between tests to avoid rate limiting."""
    yield
    time.sleep(0.5)


# ──────────────────────────────────────────────────────────
# Auth fixtures
# ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def registered_user():
    """Register a user for the test module and return credentials + token."""
    email = f"{NS}_user@example.com"
    username = f"{NS}_user"
    password = "TestP@ss1!"
    payload = {"username": username, "email": email, "password": password}
    for attempt in range(5):
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 5))
            time.sleep(min(wait, 10))
            continue
        break
    resp.raise_for_status()
    body = resp.json()
    return {
        "email": email,
        "username": username,
        "password": password,
        "token": body["token"],
        "user_id": body["data"]["id"],
    }


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────────────────
# 1. Auth - Register
# ──────────────────────────────────────────────────────────

class TestRegister:
    """POST /api/auth/register"""

    def test_register_success(self):
        email = f"{NS}_reg@example.com"
        payload = {"username": f"{NS}_reg", "email": email, "password": "Strong@1"}
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert "token" in body
        assert body["data"]["email"] == email

    def test_register_duplicate_email(self):
        email = f"{NS}_dup@example.com"
        payload = {"username": f"{NS}_dup", "email": email, "password": "Strong@1"}
        resp1 = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp1.status_code == 201
        payload2 = {"username": f"{NS}_dup2", "email": email, "password": "Strong@2"}
        resp2 = session.post(f"{BASE_URL}/api/auth/register", json=payload2, timeout=10)
        assert resp2.status_code == 409

    def test_register_missing_email(self):
        payload = {"username": f"{NS}_noemail", "password": "Strong@1"}
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_register_missing_password(self):
        payload = {"username": f"{NS}_nopw", "email": f"{NS}_nopw@example.com"}
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_register_weak_password_no_special_char(self):
        payload = {
            "username": f"{NS}_weak",
            "email": f"{NS}_weak@example.com",
            "password": "NoSpecial1",
        }
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_register_short_username(self):
        payload = {
            "username": "ab",
            "email": f"{NS}_shortu@example.com",
            "password": "Strong@1",
        }
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_register_invalid_email_format(self):
        payload = {
            "username": f"{NS}_bademail",
            "email": "not-an-email",
            "password": "Strong@1",
        }
        resp = session.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert resp.status_code == 400


# ──────────────────────────────────────────────────────────
# 2. Auth - Login
# ──────────────────────────────────────────────────────────

class TestLogin:
    """POST /api/auth/login"""

    def test_login_success(self, registered_user):
        payload = {"email": registered_user["email"], "password": registered_user["password"]}
        resp = session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "token" in body

    def test_login_wrong_password(self, registered_user):
        payload = {"email": registered_user["email"], "password": "WrongP@ss1"}
        resp = session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        assert resp.status_code == 401

    def test_login_nonexistent_email(self):
        payload = {"email": "nobody@example.com", "password": "Some@Pass1"}
        resp = session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        assert resp.status_code == 401

    def test_login_missing_email(self):
        payload = {"password": "Something@1"}
        resp = session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_login_missing_password(self):
        payload = {"email": "someone@example.com"}
        resp = session.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        assert resp.status_code == 400


# ──────────────────────────────────────────────────────────
# 3. Auth - Logout
# ──────────────────────────────────────────────────────────

class TestLogout:
    """POST /api/auth/logout"""

    def test_logout_success(self, registered_user):
        resp = session.post(
            f"{BASE_URL}/api/auth/logout",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        assert "Logout" in resp.json().get("message", "")

    def test_logout_no_token(self):
        resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 4. Guest URL Shortening
# ──────────────────────────────────────────────────────────

class TestGuestShorten:
    """POST /api/shorten/guest"""

    def test_guest_shorten_success(self):
        payload = {"longUrl": "https://www.example.com/guest-test"}
        resp = session.post(f"{BASE_URL}/api/shorten/guest", json=payload, timeout=10)
        assert resp.status_code == 201
        body = resp.json()
        assert "shortened_URL" in body
        assert "short_code" in body
        assert body["shortened_URL"].startswith("http://localhost:4000/s/")

    def test_guest_shorten_invalid_url(self):
        payload = {"longUrl": "not-a-valid-url"}
        resp = session.post(f"{BASE_URL}/api/shorten/guest", json=payload, timeout=10)
        assert resp.status_code == 400

    def test_guest_shorten_missing_url(self):
        resp = session.post(f"{BASE_URL}/api/shorten/guest", json={}, timeout=10)
        assert resp.status_code == 400


# ──────────────────────────────────────────────────────────
# 5. Authenticated URL Shortening
# ──────────────────────────────────────────────────────────

class TestAuthShorten:
    """POST /api/shorten"""

    def test_auth_shorten_success(self, registered_user):
        payload = {"longUrl": f"https://www.example.com/{NS}-auth-test"}
        resp = session.post(
            f"{BASE_URL}/api/shorten",
            json=payload,
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "shortCode" in body or "short_code" in body
        assert "shortUrl" in body or "short_url" in body

    def test_auth_shorten_custom_code(self, registered_user):
        custom = f"{NS}cust"[:30]
        payload = {"longUrl": f"https://www.example.com/{NS}-custom", "shortCode": custom}
        resp = session.post(
            f"{BASE_URL}/api/shorten",
            json=payload,
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body.get("shortCode") == custom or body.get("short_code") == custom

    def test_auth_shorten_with_expiry(self, registered_user):
        payload = {
            "longUrl": f"https://www.example.com/{NS}-expire",
            "expiresAt": "2099-12-31",
        }
        resp = session.post(
            f"{BASE_URL}/api/shorten",
            json=payload,
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 201

    def test_auth_shorten_no_token(self):
        payload = {"longUrl": "https://www.example.com/noauth"}
        resp = session.post(f"{BASE_URL}/api/shorten", json=payload, timeout=10)
        assert resp.status_code == 401

    def test_auth_shorten_invalid_url(self, registered_user):
        payload = {"longUrl": "bad-url"}
        resp = session.post(
            f"{BASE_URL}/api/shorten",
            json=payload,
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 400


# ──────────────────────────────────────────────────────────
# 6. List User URLs
# ──────────────────────────────────────────────────────────

class TestMyUrls:
    """GET /api/shorten/my-urls"""

    def test_my_urls_success(self, registered_user):
        # Create a URL first
        session.post(
            f"{BASE_URL}/api/shorten",
            json={"longUrl": f"https://www.example.com/{NS}-list"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        resp = session.get(
            f"{BASE_URL}/api/shorten/my-urls",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "urls" in body
        assert isinstance(body["urls"], list)
        assert len(body["urls"]) >= 1

    def test_my_urls_no_token(self):
        resp = session.get(f"{BASE_URL}/api/shorten/my-urls", timeout=10)
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 7. URL Redirect
# ──────────────────────────────────────────────────────────

class TestRedirect:
    """GET /s/:shortCode"""

    def test_redirect_success(self):
        # Create a guest URL to redirect
        create_resp = session.post(
            f"{BASE_URL}/api/shorten/guest",
            json={"longUrl": "https://www.example.com/redirect-target"},
            timeout=10,
        )
        assert create_resp.status_code == 201
        short_code = create_resp.json()["short_code"]
        resp = session.get(
            f"{BASE_URL}/s/{short_code}", timeout=10, allow_redirects=False
        )
        assert resp.status_code == 302
        assert "example.com/redirect-target" in resp.headers.get("Location", "")

    def test_redirect_not_found(self):
        resp = session.get(f"{BASE_URL}/s/nonexistent_code_xyz", timeout=10, allow_redirects=False)
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────
# 8. URL Update (PATCH)
# ──────────────────────────────────────────────────────────

class TestUpdateUrl:
    """PATCH /api/shorten/:shortCode"""

    def test_update_expiry_success(self, registered_user):
        # Create URL first
        create_resp = session.post(
            f"{BASE_URL}/api/shorten",
            json={"longUrl": f"https://www.example.com/{NS}-update"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert create_resp.status_code == 201
        body = create_resp.json()
        short_code = body.get("shortCode") or body.get("short_code")
        resp = session.patch(
            f"{BASE_URL}/api/shorten/{short_code}",
            json={"expireAt": "2099-06-15"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

    def test_update_not_found(self, registered_user):
        resp = session.patch(
            f"{BASE_URL}/api/shorten/nonexistent_xyz",
            json={"expireAt": "2099-06-15"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 404

    def test_update_no_token(self):
        resp = session.patch(
            f"{BASE_URL}/api/shorten/anycode",
            json={"expireAt": "2099-06-15"},
            timeout=10,
        )
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 9. URL Delete
# ──────────────────────────────────────────────────────────

class TestDeleteUrl:
    """DELETE /api/shorten/:shortCode"""

    def test_delete_success(self, registered_user):
        # Create URL to delete
        create_resp = session.post(
            f"{BASE_URL}/api/shorten",
            json={"longUrl": f"https://www.example.com/{NS}-delete"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert create_resp.status_code == 201
        body = create_resp.json()
        short_code = body.get("shortCode") or body.get("short_code")
        resp = session.delete(
            f"{BASE_URL}/api/shorten/{short_code}",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True
        # Verify it's gone
        resp2 = session.get(
            f"{BASE_URL}/s/{short_code}", timeout=10, allow_redirects=False
        )
        assert resp2.status_code == 404

    def test_delete_not_found(self, registered_user):
        resp = session.delete(
            f"{BASE_URL}/api/shorten/nonexistent_xyz",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 404

    def test_delete_no_token(self):
        resp = session.delete(f"{BASE_URL}/api/shorten/anycode", timeout=10)
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 10. Analytics - Stats
# ──────────────────────────────────────────────────────────

class TestUrlStats:
    """GET /s/:shortCode/stats"""

    def test_stats_success(self, registered_user):
        # Create URL and trigger a click
        create_resp = session.post(
            f"{BASE_URL}/api/shorten",
            json={"longUrl": f"https://www.example.com/{NS}-stats"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert create_resp.status_code == 201
        body = create_resp.json()
        short_code = body.get("shortCode") or body.get("short_code")
        # Trigger a redirect to generate click data
        session.get(
            f"{BASE_URL}/s/{short_code}", timeout=10, allow_redirects=False
        )
        resp = session.get(
            f"{BASE_URL}/s/{short_code}/stats",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        stats = resp.json()
        assert "clickCount" in stats or "click_count" in stats
        assert "longUrl" in stats or "long_url" in stats

    def test_stats_not_found(self, registered_user):
        resp = session.get(
            f"{BASE_URL}/s/nonexistent_xyz/stats",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 404

    def test_stats_no_token(self):
        resp = session.get(f"{BASE_URL}/s/anycode/stats", timeout=10)
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 11. Analytics - Sources
# ──────────────────────────────────────────────────────────

class TestClickSources:
    """GET /s/:shortCode/sources"""

    def test_sources_success(self, registered_user):
        # Create URL and trigger a click
        create_resp = session.post(
            f"{BASE_URL}/api/shorten",
            json={"longUrl": f"https://www.example.com/{NS}-sources"},
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert create_resp.status_code == 201
        body = create_resp.json()
        short_code = body.get("shortCode") or body.get("short_code")
        # Trigger a click
        session.get(
            f"{BASE_URL}/s/{short_code}", timeout=10, allow_redirects=False
        )
        resp = session.get(
            f"{BASE_URL}/s/{short_code}/sources",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True
        data = body.get("data", {})
        assert "referrers" in data
        assert "countries" in data
        assert "devices" in data
        assert "browsers" in data

    def test_sources_not_found(self, registered_user):
        resp = session.get(
            f"{BASE_URL}/s/nonexistent_xyz/sources",
            headers=auth_headers(registered_user["token"]),
            timeout=10,
        )
        assert resp.status_code == 404

    def test_sources_no_token(self):
        resp = session.get(f"{BASE_URL}/s/anycode/sources", timeout=10)
        assert resp.status_code == 401


# ──────────────────────────────────────────────────────────
# 12. Auth backward compatibility (/api/oauth)
# ──────────────────────────────────────────────────────────

class TestAuthBackwardCompat:
    """Auth routes also work under /api/oauth prefix."""

    def test_login_via_oauth_prefix(self, registered_user):
        payload = {"email": registered_user["email"], "password": registered_user["password"]}
        resp = session.post(f"{BASE_URL}/api/oauth/login", json=payload, timeout=10)
        assert resp.status_code == 200
        assert resp.json().get("success") is True
