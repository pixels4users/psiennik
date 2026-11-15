"""Browser registration regression suite against the running app.

Run: python3 scripts/signup-role.e2e.py
Auth providers and backend responses are intercepted; no real accounts are created.
The form, OAuth redirect, session hydration and role-claim caller are real app code.
"""

import base64
import json
import os
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright, expect


ORIGIN = os.environ.get("E2E_BASE_URL", "http://localhost:8080").rstrip("/")
if urlparse(ORIGIN).hostname not in ("localhost", "127.0.0.1"):
    raise ValueError("Run this intercepted suite only against a local development server")
SCREENSHOTS = Path("/tmp/browser/signup-role/screenshots")
PENDING_ROLE = "psiennik.pending-role"
USER_ID = "00000000-0000-4000-8000-000000000001"


class SignupRoleE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
        SCREENSHOTS.mkdir(parents=True, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1280, "height": 1800})
        self.page = self.context.new_page()
        self.role = "owner"
        self.claims = 0
        self.signup_payloads = []
        self.email_redirect = None
        self.oauth_requests = []
        self.unexpected = []
        self.errors = []
        self.provider = "email"
        self.user = {
            "id": USER_ID, "aud": "authenticated", "role": "authenticated",
            "email": "signup-e2e@example.test", "created_at": "2026-11-15T00:00:00Z",
            "app_metadata": {"provider": "email"}, "user_metadata": {"display_name": "Test E2E"},
        }
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.context.route("**/*", self.handle_request)
        self.page.goto(ORIGIN + "/auth", wait_until="networkidle")

    def tearDown(self):
        self.page.screenshot(path=str(SCREENSHOTS / (self._testMethodName + ".png")))
        self.context.close()
        self.assertEqual(self.unexpected, [], "Unexpected backend calls must not reach real services")
        self.assertEqual(self.errors, [], "The registration flow must not produce browser errors")

    def callback_url(self, redirect):
        # Synthetic, non-secret JWT; only mocked auth endpoints accept this token.
        payload = base64.urlsafe_b64encode(json.dumps({"sub": USER_ID, "exp": 4102444800}).encode()).decode().rstrip("=")
        token = "eyJhbGciOiJIUzI1NiJ9." + payload + ".e2e"
        return redirect + "#access_token=" + token + "&refresh_token=e2e&token_type=bearer&expires_in=3600"

    def handle_request(self, route):
        request = route.request
        parsed = urlparse(request.url)
        path = parsed.path
        if path == "/~oauth/initiate":
            params = parse_qs(parsed.query)
            self.provider = params["provider"][0]
            self.user["app_metadata"] = {"provider": self.provider}
            redirect = params["redirect_uri"][0]
            self.oauth_requests.append((self.provider, redirect))
            # Redirect inside the same tab, retaining sessionStorage as a real OAuth round trip does.
            route.fulfill(content_type="text/html", body="<script>location.replace(" + json.dumps(self.callback_url(redirect)) + ")</script>")
            return
        if path.startswith("/auth/v1/"):
            if path.endswith("/signup"):
                payload = request.post_data_json
                self.signup_payloads.append(payload)
                self.email_redirect = parse_qs(parsed.query)["redirect_to"][0]
                self.role = payload["data"]["role"]
                route.fulfill(json={"user": self.user, "session": None})
            elif path.endswith("/user"):
                route.fulfill(json=self.user)
            else:
                self.unexpected.append(path)
                route.abort()
            return
        if path.startswith("/rest/v1/"):
            table = path.rsplit("/", 1)[-1]
            headers = {"content-range": "*/0"}
            if table == "profiles":
                data = {"id": USER_ID, "display_name": "Test E2E", "terms_version": "2026-09-14"}
            elif table == "user_roles":
                data = [{"user_id": USER_ID, "role": self.role}]
            else:
                data = []
            route.fulfill(json=data, headers=headers)
            return
        if "/_serverFn/" in path:
            encoded = path.rsplit("/", 1)[-1]
            try:
                fn = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
            except (ValueError, UnicodeDecodeError):
                fn = {}
            if "claimBehavioristRole" in fn.get("export", ""):
                self.claims += 1
                self.role = "behaviorist"
                route.fulfill(json={"result": {"ok": True, "changed": True}})
            else:
                self.unexpected.append("server function: " + fn.get("export", "unknown"))
                route.abort()
            return
        if parsed.netloc != urlparse(ORIGIN).netloc:
            # No third-party network calls, including analytics, in this suite.
            route.abort()
            return
        route.continue_()

    def choose_role(self, role):
        self.page.get_by_role("tab", name="Rejestracja", exact=True).click()
        # Also test switching from behaviorist back to owner, not just the default.
        self.page.get_by_role("button", name="Behawiorysta", exact=True).click()
        label = "Behawiorysta" if role == "behaviorist" else "Właściciel psa"
        self.page.get_by_role("button", name=label, exact=True).click()
        expect(self.page.get_by_role("button", name=label, exact=True)).to_have_attribute("aria-pressed", "true")

    def assert_return(self, role, claims):
        self.page.wait_for_url(ORIGIN + "/psy", timeout=15000)
        self.page.wait_for_load_state("networkidle")
        self.assertEqual(self.role, role)
        self.assertEqual(self.claims, claims)
        self.assertIsNone(self.page.evaluate("sessionStorage.getItem('psiennik.pending-role')"))
        # Role is read back through the app's authenticated UI, not just the request payload.
        badge = self.page.get_by_role("link", name="Psy pod opieką", exact=True)
        if role == "behaviorist":
            expect(badge).to_be_visible()
        else:
            expect(badge).to_have_count(0)
        self.page.reload(wait_until="networkidle")
        self.assertEqual(self.claims, claims, "Reload must not assign the role again")

    def oauth_signup(self, provider, role):
        self.choose_role(role)
        self.page.get_by_role("button", name="Kontynuuj z " + provider.capitalize(), exact=True).click()
        self.assert_return(role, 1 if role == "behaviorist" else 0)
        self.assertEqual(len(self.oauth_requests), 1)
        self.assertEqual(self.oauth_requests[0][0], provider)

    def email_signup(self, role):
        self.choose_role(role)
        self.page.get_by_label("Imię", exact=True).fill("Test E2E")
        self.page.get_by_label("E-mail", exact=True).fill("signup-e2e@example.test")
        self.page.get_by_label("Hasło", exact=True).fill("E2e-not-a-real-password")
        self.page.get_by_role("button", name="Załóż konto", exact=True).click()
        expect(self.page.get_by_role("heading", name="Potwierdź adres e-mail")).to_be_visible()
        self.assertEqual(len(self.signup_payloads), 1)
        self.assertEqual(self.signup_payloads[0]["data"], {"display_name": "Test E2E", "role": role})
        self.assertIsNotNone(self.email_redirect)
        self.page.goto(self.callback_url(self.email_redirect))
        self.assert_return(role, 0)

    def test_google_behaviorist(self): self.oauth_signup("google", "behaviorist")
    def test_google_owner_after_switch(self): self.oauth_signup("google", "owner")
    def test_apple_behaviorist(self): self.oauth_signup("apple", "behaviorist")
    def test_apple_owner_after_switch(self): self.oauth_signup("apple", "owner")
    def test_email_behaviorist(self): self.email_signup("behaviorist")
    def test_email_owner_after_switch(self): self.email_signup("owner")


if __name__ == "__main__":
    unittest.main(verbosity=2)