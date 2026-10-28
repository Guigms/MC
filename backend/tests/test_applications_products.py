# Iteration 2: applications (inscrições) workflow + club products (quero/não quero) API tests
import os
import uuid
import datetime
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "gms1@gmsolutionti.com.br"
ADMIN_PW = "Biker85@Admin"


def login(email, pw):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": pw})


def app_payload(email, **kw):
    d = {"name": "TEST_Applicant", "email": email, "whatsapp": "11999998888", "age": 30, "height": "1.65",
         "city": "TEST_City", "profession": "Dev", "instagram": "@test", "has_motorcycle": True,
         "motorcycle_model": "TEST_Moto 300", "riding_since": "3 anos", "styles": ["estrada", "trilhas"],
         "frequency": "3", "other_group": False, "reason": "TEST_ reason long enough text", "commit_events": True, "has_cnh_a": True}
    d.update(kw)
    return d


@pytest.fixture(scope="module")
def admin_h():
    r = login(ADMIN_EMAIL, ADMIN_PW)
    if r.status_code != 200:
        pytest.skip(f"admin login failed {r.status_code}")
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def cleanup(admin_h):
    state = {"apps_emails": [], "user_ids": [], "product_ids": []}
    yield state
    apps = requests.get(f"{API}/applications", headers=admin_h).json()
    for a in apps:
        if a["email"] in state["apps_emails"] or a["name"].startswith("TEST_"):
            requests.delete(f"{API}/applications/{a['id']}", headers=admin_h)
    for uid in state["user_ids"]:
        requests.delete(f"{API}/members/{uid}", headers=admin_h)
    for pid in state["product_ids"]:
        requests.delete(f"{API}/products/{pid}", headers=admin_h)


@pytest.fixture(scope="module")
def member(admin_h, cleanup):
    email = f"test_pm_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{API}/members", headers=admin_h, json={"name": "TEST_ProdMember", "email": email, "password": "senha123"})
    assert r.status_code == 200, r.text
    cleanup["user_ids"].append(r.json()["id"])
    tok = login(email, "senha123").json()["token"]
    return {"id": r.json()["id"], "email": email, "h": {"Authorization": f"Bearer {tok}"}}


def find_app(admin_h, email):
    return next((a for a in requests.get(f"{API}/applications", headers=admin_h).json() if a["email"] == email), None)


# --- applications ---
class TestApplications:
    def test_rbac(self, member):
        assert requests.get(f"{API}/applications").status_code == 401
        assert requests.get(f"{API}/applications", headers=member["h"]).status_code == 403
        assert requests.post(f"{API}/applications/{'0'*24}/approve", headers=member["h"]).status_code == 403
        assert requests.post(f"{API}/applications/{'0'*24}/reject", json={}, headers=member["h"]).status_code == 403
        assert requests.delete(f"{API}/applications/{'0'*24}", headers=member["h"]).status_code == 403
        assert requests.post(f"{API}/applications/{'0'*24}/approve").status_code == 401

    def test_validation(self):
        r = requests.post(f"{API}/applications", json=app_payload("bad-email"))
        assert r.status_code == 422
        r = requests.post(f"{API}/applications", json=app_payload(f"test_{uuid.uuid4().hex[:6]}@example.com", reason="short"))
        assert r.status_code == 422
        r = requests.post(f"{API}/applications", json=app_payload(f"test_{uuid.uuid4().hex[:6]}@example.com", styles=["invalid"]))
        assert r.status_code == 422

    def test_existing_member_email_rejected(self, member):
        r = requests.post(f"{API}/applications", json=app_payload(member["email"]))
        assert r.status_code == 400

    def test_admin_email_rejected(self):
        r = requests.post(f"{API}/applications", json=app_payload(ADMIN_EMAIL.upper()))
        assert r.status_code == 400

    def test_create_duplicate_approve_login(self, admin_h, cleanup):
        email = f"TEST_App_{uuid.uuid4().hex[:6]}@Example.com"
        cleanup["apps_emails"].append(email.lower())
        r = requests.post(f"{API}/applications", json=app_payload(email))
        assert r.status_code == 200 and r.json()["ok"] is True
        # duplicate pending (case-insensitive)
        r2 = requests.post(f"{API}/applications", json=app_payload(email.lower()))
        assert r2.status_code == 400
        a = find_app(admin_h, email.lower())
        assert a and a["status"] == "pending" and a["styles"] == ["estrada", "trilhas"]
        assert a["has_cnh_a"] is True and a["motorcycle_model"] == "TEST_Moto 300" and "_id" not in a
        r = requests.post(f"{API}/applications/{a['id']}/approve", headers=admin_h)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["email"] == email.lower() and isinstance(d["temp_password"], str) and len(d["temp_password"]) >= 6
        # approve twice
        assert requests.post(f"{API}/applications/{a['id']}/approve", headers=admin_h).status_code == 400
        assert requests.post(f"{API}/applications/{a['id']}/reject", json={"note": "x"}, headers=admin_h).status_code == 400
        a2 = find_app(admin_h, email.lower())
        assert a2["status"] == "approved" and a2.get("user_id")
        cleanup["user_ids"].append(a2["user_id"])
        lr = login(email.lower(), d["temp_password"])
        assert lr.status_code == 200 and lr.json()["user"]["role"] == "member"
        u = lr.json()["user"]
        assert u["name"] == "TEST_Applicant" and u["motorcycle"] == "TEST_Moto 300" and u["phone"] == "11999998888"
        # now member exists -> new application rejected
        assert requests.post(f"{API}/applications", json=app_payload(email)).status_code == 400

    def test_reject_then_reapply_and_delete(self, admin_h, cleanup):
        email = f"test_rej_{uuid.uuid4().hex[:6]}@example.com"
        cleanup["apps_emails"].append(email)
        assert requests.post(f"{API}/applications", json=app_payload(email)).status_code == 200
        a = find_app(admin_h, email)
        r = requests.post(f"{API}/applications/{a['id']}/reject", json={"note": "TEST_note"}, headers=admin_h)
        assert r.status_code == 200
        a2 = find_app(admin_h, email)
        assert a2["status"] == "rejected" and a2["note"] == "TEST_note"
        assert requests.post(f"{API}/applications/{a['id']}/approve", headers=admin_h).status_code == 400
        # can reapply after rejection
        assert requests.post(f"{API}/applications", json=app_payload(email)).status_code == 200
        assert requests.delete(f"{API}/applications/{a['id']}", headers=admin_h).status_code == 200
        assert requests.delete(f"{API}/applications/{a['id']}", headers=admin_h).status_code == 404

    def test_invalid_id(self, admin_h):
        assert requests.post(f"{API}/applications/notanid/approve", headers=admin_h).status_code == 404
        assert requests.post(f"{API}/applications/{'0'*24}/approve", headers=admin_h).status_code == 404


# --- products ---
class TestProducts:
    def test_rbac(self, member):
        assert requests.get(f"{API}/products").status_code == 401
        assert requests.post(f"{API}/products", json={"name": "x"}, headers=member["h"]).status_code == 403
        assert requests.get(f"{API}/products/{'0'*24}/responses", headers=member["h"]).status_code == 403

    def test_crud_hidden_and_responses(self, admin_h, member, cleanup):
        r = requests.post(f"{API}/products", headers=admin_h, json={"name": "TEST_Blusa", "price": 79.9, "sizes": [" P", "M ", "G", ""], "deadline": "2099-12-31", "active": True})
        assert r.status_code == 200, r.text
        p = r.json()
        cleanup["product_ids"].append(p["id"])
        assert p["sizes"] == ["P", "M", "G"] and p["price"] == 79.9
        # member sees it
        lst = requests.get(f"{API}/products", headers=member["h"]).json()
        mp = next(x for x in lst if x["id"] == p["id"])
        assert mp["my_response"] is None
        # want without size
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "", "quantity": 1}, headers=member["h"]).status_code == 400
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "XG", "quantity": 1}, headers=member["h"]).status_code == 400
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "M", "quantity": 0}, headers=member["h"]).status_code == 400
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "M", "quantity": 51}, headers=member["h"]).status_code == 422
        r = requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "M", "quantity": 3}, headers=member["h"])
        assert r.status_code == 200
        mp = next(x for x in requests.get(f"{API}/products", headers=member["h"]).json() if x["id"] == p["id"])
        assert mp["my_response"] == {"want": True, "size": "M", "quantity": 3}
        # admin also wants (admin may respond)
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "G", "quantity": 2}, headers=admin_h).status_code == 200
        d = requests.get(f"{API}/products/{p['id']}/responses", headers=admin_h).json()
        assert d["total"] == 5 and d["by_size"] == {"M": 3, "G": 2} and d["yes"] == 2 and d["no"] == 0
        # member changes to no
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": False}, headers=member["h"]).status_code == 200
        d = requests.get(f"{API}/products/{p['id']}/responses", headers=admin_h).json()
        assert d["total"] == 2 and d["by_size"] == {"G": 2} and d["yes"] == 1 and d["no"] == 1
        # update -> hide
        r = requests.put(f"{API}/products/{p['id']}", headers=admin_h, json={"name": "TEST_Blusa2", "price": 50, "sizes": ["P"], "active": False})
        assert r.status_code == 200 and r.json()["name"] == "TEST_Blusa2" and r.json()["active"] is False
        assert not any(x["id"] == p["id"] for x in requests.get(f"{API}/products", headers=member["h"]).json())
        assert any(x["id"] == p["id"] for x in requests.get(f"{API}/products", headers=admin_h).json())
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": False}, headers=member["h"]).status_code == 404
        # delete
        assert requests.delete(f"{API}/products/{p['id']}", headers=admin_h).status_code == 200
        assert requests.get(f"{API}/products/{p['id']}/responses", headers=admin_h).status_code == 404
        assert requests.delete(f"{API}/products/{p['id']}", headers=admin_h).status_code == 404

    def test_single_size_product(self, admin_h, member, cleanup):
        p = requests.post(f"{API}/products", headers=admin_h, json={"name": "TEST_Patch", "price": 10, "sizes": []}).json()
        cleanup["product_ids"].append(p["id"])
        assert requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "quantity": 2}, headers=member["h"]).status_code == 200
        d = requests.get(f"{API}/products/{p['id']}/responses", headers=admin_h).json()
        assert d["by_size"] == {"Único": 2}

    def test_expired_deadline_response_backend(self, admin_h, member, cleanup):
        """Backend does not enforce deadline (report if 200)"""
        p = requests.post(f"{API}/products", headers=admin_h, json={"name": "TEST_Expired", "sizes": ["P"], "deadline": "2020-01-01"}).json()
        cleanup["product_ids"].append(p["id"])
        r = requests.post(f"{API}/products/{p['id']}/response", json={"want": True, "size": "P", "quantity": 1}, headers=member["h"])
        assert r.status_code == 400, f"deadline not enforced server-side: {r.status_code}"

    def test_validation(self, admin_h):
        assert requests.post(f"{API}/products", headers=admin_h, json={"name": ""}).status_code == 422
        assert requests.post(f"{API}/products", headers=admin_h, json={"name": "TEST_x", "price": -1}).status_code == 422
