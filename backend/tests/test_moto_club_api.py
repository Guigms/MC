# Moto club API regression tests: auth, RBAC, members, events, RSVP, dues, settings, overview
import os
import uuid
import datetime
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "gms1@gmsolutionti.com.br"
ADMIN_PW = "Biker85@Admin"
NOW = datetime.datetime.now(datetime.timezone.utc)
YEAR, MONTH = NOW.year, NOW.month


def login(email, pw):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": pw})


@pytest.fixture(scope="module")
def admin_h():
    r = login(ADMIN_EMAIL, ADMIN_PW)
    if r.status_code != 200:
        pytest.skip(f"admin login failed {r.status_code} {r.text}")
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def member(admin_h):
    email = f"test_member_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{API}/members", headers=admin_h, json={"name": "TEST_Member", "email": email, "password": "senha123", "nickname": "TEST_Nick"})
    assert r.status_code == 200, r.text
    m = r.json()
    m["password"] = "senha123"
    tok = login(email, "senha123").json()["token"]
    m["h"] = {"Authorization": f"Bearer {tok}"}
    yield m
    requests.delete(f"{API}/members/{m['id']}", headers=admin_h)


# --- auth ---
class TestAuth:
    def test_login_admin_cookie_and_token(self):
        r = login(ADMIN_EMAIL, ADMIN_PW)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "admin" and isinstance(d["token"], str)
        assert "password_hash" not in d["user"] and "_id" not in d["user"]
        sc = r.headers.get("set-cookie", "").lower()
        assert "access_token=" in sc and "httponly" in sc

    def test_me_requires_auth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401

    def test_me_with_token(self, admin_h):
        r = requests.get(f"{API}/auth/me", headers=admin_h)
        assert r.status_code == 200 and r.json()["email"] == ADMIN_EMAIL

    def test_wrong_password_401(self):
        r = login(f"test_nouser_{uuid.uuid4().hex[:6]}@example.com", "x")
        assert r.status_code == 401

    def test_brute_force_lockout(self):
        email = f"test_bf_{uuid.uuid4().hex[:6]}@example.com"
        codes = [login(email, "bad").status_code for _ in range(6)]
        assert codes[:5] == [401] * 5 and codes[5] == 429, codes


# --- public / rbac ---
class TestPublicAndRBAC:
    def test_events_requires_auth(self):
        assert requests.get(f"{API}/events").status_code == 401

    def test_public_settings_and_stats(self):
        s = requests.get(f"{API}/settings").json()
        assert "club_name" in s and "monthly_fee" in s
        st = requests.get(f"{API}/public/stats").json()
        assert {"members", "events_year", "upcoming"} <= set(st)

    def test_member_forbidden_admin_endpoints(self, member):
        h = member["h"]
        assert requests.get(f"{API}/members", headers=h).status_code == 403
        assert requests.get(f"{API}/dues?year={YEAR}", headers=h).status_code == 403
        assert requests.put(f"{API}/settings", headers=h, json={"club_name": "hack"}).status_code == 403
        assert requests.post(f"{API}/events", headers=h, json={"title": "x", "date": "2030-01-01"}).status_code == 403
        assert requests.get(f"{API}/admin/overview", headers=h).status_code == 403
        assert requests.post(f"{API}/dues/toggle", headers=h, json={"user_id": member["id"], "year": YEAR, "month": 1, "paid": True}).status_code == 403


# --- members ---
class TestMembers:
    def test_duplicate_email_rejected(self, admin_h, member):
        r = requests.post(f"{API}/members", headers=admin_h, json={"name": "TEST_dup", "email": member["email"].upper(), "password": "senha123"})
        assert r.status_code == 400

    def test_short_password_rejected(self, admin_h):
        r = requests.post(f"{API}/members", headers=admin_h, json={"name": "TEST_x", "email": f"test_{uuid.uuid4().hex[:6]}@example.com", "password": "123"})
        assert r.status_code == 400

    def test_edit_member_persists(self, admin_h, member):
        body = {"name": "TEST_Member Edited", "email": member["email"], "motorcycle": "Harley 883", "role": "member", "active": True}
        r = requests.put(f"{API}/members/{member['id']}", headers=admin_h, json=body)
        assert r.status_code == 200 and r.json()["motorcycle"] == "Harley 883"
        lst = requests.get(f"{API}/members", headers=admin_h).json()
        m = next(x for x in lst if x["id"] == member["id"])
        assert m["name"] == "TEST_Member Edited"
        # password still valid after edit without password
        assert login(member["email"], "senha123").status_code == 200

    def test_admin_cannot_demote_self(self, admin_h):
        me = requests.get(f"{API}/auth/me", headers=admin_h).json()
        r = requests.put(f"{API}/members/{me['id']}", headers=admin_h, json={"name": me["name"], "email": me["email"], "role": "member", "active": True})
        assert r.status_code == 400
        assert requests.delete(f"{API}/members/{me['id']}", headers=admin_h).status_code == 400

    def test_inactive_member_cannot_login_and_token_revoked(self, admin_h):
        email = f"test_inact_{uuid.uuid4().hex[:6]}@example.com"
        m = requests.post(f"{API}/members", headers=admin_h, json={"name": "TEST_Inactive", "email": email, "password": "senha123"}).json()
        tok = login(email, "senha123").json()["token"]
        r = requests.put(f"{API}/members/{m['id']}", headers=admin_h, json={"name": "TEST_Inactive", "email": email, "role": "member", "active": False})
        assert r.status_code == 200 and r.json()["active"] is False
        assert login(email, "senha123").status_code == 403
        assert requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401
        requests.delete(f"{API}/members/{m['id']}", headers=admin_h)
        lst = requests.get(f"{API}/members", headers=admin_h).json()
        assert not any(x["id"] == m["id"] for x in lst)


# --- events + rsvp ---
class TestEvents:
    def test_event_crud_and_rsvp(self, admin_h, member):
        date = (NOW + datetime.timedelta(days=5)).strftime("%Y-%m-%dT20:00")
        r = requests.post(f"{API}/events", headers=admin_h, json={"title": "TEST_Encontro", "type": "encontro", "date": date, "location": "Posto X"})
        assert r.status_code == 200
        ev = r.json()
        assert ev["type"] == "encontro" and ev["rsvps"] == []
        # member sees it
        evs = requests.get(f"{API}/events", headers=member["h"]).json()
        mine = next(e for e in evs if e["id"] == ev["id"])
        assert mine["going"] is False and "rsvps" not in mine
        # rsvp toggle
        assert requests.post(f"{API}/events/{ev['id']}/rsvp", headers=member["h"]).json()["going"] is True
        evs = requests.get(f"{API}/events", headers=member["h"]).json()
        mine = next(e for e in evs if e["id"] == ev["id"])
        assert mine["going"] is True and mine["rsvp_count"] == 1
        adm = next(e for e in requests.get(f"{API}/events", headers=admin_h).json() if e["id"] == ev["id"])
        assert member["id"] in adm["rsvps"]
        assert requests.post(f"{API}/events/{ev['id']}/rsvp", headers=member["h"]).json()["going"] is False
        # update
        r = requests.put(f"{API}/events/{ev['id']}", headers=admin_h, json={"title": "TEST_Evento Edit", "type": "evento", "date": date})
        assert r.status_code == 200 and r.json()["title"] == "TEST_Evento Edit"
        # delete
        assert requests.delete(f"{API}/events/{ev['id']}", headers=admin_h).status_code == 200
        evs = requests.get(f"{API}/events", headers=admin_h).json()
        assert not any(e["id"] == ev["id"] for e in evs)

    def test_update_missing_event_404(self, admin_h):
        r = requests.put(f"{API}/events/0123456789abcdef01234567", headers=admin_h, json={"title": "x", "date": "2030-01-01"})
        assert r.status_code == 404


# --- dues ---
class TestDues:
    def test_toggle_paid_and_overview(self, admin_h, member):
        ov1 = requests.get(f"{API}/admin/overview", headers=admin_h).json()
        fee = requests.get(f"{API}/settings").json()["monthly_fee"]
        r = requests.post(f"{API}/dues/toggle", headers=admin_h, json={"user_id": member["id"], "year": YEAR, "month": MONTH, "paid": True})
        assert r.status_code == 200
        grid = requests.get(f"{API}/dues?year={YEAR}", headers=admin_h).json()
        row = next(x for x in grid["rows"] if x["id"] == member["id"])
        assert str(MONTH) in row["months"] and row["months"][str(MONTH)]["amount"] == fee
        me = requests.get(f"{API}/dues/me?year={YEAR}", headers=member["h"]).json()
        assert str(MONTH) in me["months"]
        ov2 = requests.get(f"{API}/admin/overview", headers=admin_h).json()
        assert ov2["revenue_month"] == ov1["revenue_month"] + fee
        assert ov2["paid_this_month"] == ov1["paid_this_month"] + 1
        # unpay
        requests.post(f"{API}/dues/toggle", headers=admin_h, json={"user_id": member["id"], "year": YEAR, "month": MONTH, "paid": False})
        me = requests.get(f"{API}/dues/me?year={YEAR}", headers=member["h"]).json()
        assert str(MONTH) not in me["months"]

    def test_invalid_month(self, admin_h, member):
        r = requests.post(f"{API}/dues/toggle", headers=admin_h, json={"user_id": member["id"], "year": YEAR, "month": 13, "paid": True})
        assert r.status_code == 400


# --- profile ---
class TestProfile:
    def test_profile_update_and_password_change(self, member):
        h = member["h"]
        r = requests.put(f"{API}/auth/profile", headers=h, json={"nickname": "TEST_Rider", "motorcycle": "CB500"})
        assert r.status_code == 200 and r.json()["nickname"] == "TEST_Rider"
        r = requests.put(f"{API}/auth/profile", headers=h, json={"current_password": "wrong", "new_password": "novaSenha1"})
        assert r.status_code == 400
        r = requests.put(f"{API}/auth/profile", headers=h, json={"current_password": "senha123", "new_password": "novaSenha1"})
        assert r.status_code == 200
        assert login(member["email"], "novaSenha1").status_code == 200


# --- settings ---
class TestSettings:
    def test_settings_update_and_restore(self, admin_h):
        orig = requests.get(f"{API}/settings").json()
        r = requests.put(f"{API}/settings", headers=admin_h, json={"club_name": "TEST_Club", "primary_color": "#00ff00", "monthly_fee": 45})
        assert r.status_code == 200 and r.json()["club_name"] == "TEST_Club"
        assert requests.get(f"{API}/settings").json()["monthly_fee"] == 45
        r = requests.put(f"{API}/settings", headers=admin_h, json={"club_name": "Biker 85 Girls", "primary_color": "#e85a9b", "accent_color": "#ff2a85", "monthly_fee": 30, "logo_url": "/logo.png"})
        s = r.json()
        assert s["club_name"] == "Biker 85 Girls" and s["monthly_fee"] == 30 and s["primary_color"] == "#e85a9b"
