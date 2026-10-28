from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Literal
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

JWT_ALG = "HS256"

DEFAULT_SETTINGS = {
    "club_name": "Biker 85 Girls",
    "tagline": "Moto Club",
    "hero_title": "Mulheres, motores e estrada sem fim",
    "hero_subtitle": "Um moto club feito de irmandade, liberdade e quilômetros compartilhados.",
    "about_text": "Somos um moto club que vive a estrada juntas. Encontros, viagens, eventos beneficentes e muita parceria sobre duas rodas. [Edite este texto na área de Personalização]",
    "logo_url": "/logo.png",
    "hero_image": "https://images.unsplash.com/photo-1681335056244-9dd3d5de8b60?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "primary_color": "#e85a9b",
    "accent_color": "#ff2a85",
    "monthly_fee": 30.0,
    "city": "[Sua cidade]",
    "founded_year": "[Ano de fundação]",
    "contact_email": "[contato@seuclub.com]",
    "contact_phone": "[(00) 00000-0000]",
    "instagram": "",
    "whatsapp": "",
    "gallery": [
        "/gallery/foto1.png",
        "/gallery/foto2.png",
        "/gallery/foto3.png",
        "/gallery/foto4.png",
    ],
}


# ---------- helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def make_token(uid: str, kind: str, delta: timedelta) -> str:
    payload = {"sub": uid, "type": kind, "exp": datetime.now(timezone.utc) + delta}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


def oid(v: str) -> ObjectId:
    if not ObjectId.is_valid(v):
        raise HTTPException(404, "Não encontrado")
    return ObjectId(v)


def clean(doc: dict) -> dict:
    d = {k: v for k, v in doc.items() if k not in ("_id", "password_hash")}
    d["id"] = str(doc["_id"])
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            d[k] = str(v)
    return d


def now():
    return datetime.now(timezone.utc)


async def current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    if payload.get("type") != "access":
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or not user.get("active", True):
        raise HTTPException(401, "Usuário inativo ou inexistente")
    return clean(user)


async def admin_user(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Acesso restrito ao administrador")
    return user


async def get_settings() -> dict:
    s = await db.settings.find_one({"_id": "club"})
    merged = {**DEFAULT_SETTINGS, **(s or {})}
    merged.pop("_id", None)
    return merged


# ---------- models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class MemberIn(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    role: str = "member"
    nickname: Optional[str] = ""
    phone: Optional[str] = ""
    motorcycle: Optional[str] = ""
    blood_type: Optional[str] = ""
    birth_date: Optional[str] = ""
    active: bool = True


class ProfileIn(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    motorcycle: Optional[str] = None
    blood_type: Optional[str] = None
    birth_date: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class EventIn(BaseModel):
    title: str = Field(min_length=1)
    type: Literal["evento", "encontro"] = "evento"
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}")
    location: str = ""
    description: str = ""
    image_url: str = ""


class DuesToggleIn(BaseModel):
    user_id: str
    year: int
    month: int
    paid: bool


class SettingsIn(BaseModel):
    club_name: Optional[str] = None
    tagline: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    about_text: Optional[str] = None
    logo_url: Optional[str] = None
    hero_image: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    monthly_fee: Optional[float] = Field(default=None, ge=0)
    city: Optional[str] = None
    founded_year: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    instagram: Optional[str] = None
    whatsapp: Optional[str] = None
    gallery: Optional[List[str]] = None


# ---------- auth ----------
@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ident = email
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("locked_until"):
        if att["locked_until"].replace(tzinfo=timezone.utc) > now():
            raise HTTPException(429, "Muitas tentativas. Tente novamente em 15 minutos.")
        await db.login_attempts.delete_many({"identifier": ident})
        att = None
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (att or {}).get("count", 0) + 1
        upd = {"count": count}
        if count >= 5:
            upd["locked_until"] = now() + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": ident}, {"$set": upd}, upsert=True)
        raise HTTPException(401, "E-mail ou senha incorretos")
    if not user.get("active", True):
        raise HTTPException(403, "Conta desativada. Fale com a administração.")
    await db.login_attempts.delete_many({"identifier": ident})
    uid = str(user["_id"])
    access = make_token(uid, "access", timedelta(days=1))
    refresh = make_token(uid, "refresh", timedelta(days=7))
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"user": clean(user), "token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(body: ProfileIn, user: dict = Depends(current_user)):
    upd = {k: v for k, v in body.model_dump().items() if v is not None and k not in ("current_password", "new_password")}
    if body.new_password:
        raw = await db.users.find_one({"_id": ObjectId(user["id"])})
        if not body.current_password or not verify_password(body.current_password, raw["password_hash"]):
            raise HTTPException(400, "Senha atual incorreta")
        if len(body.new_password) < 6:
            raise HTTPException(400, "A nova senha deve ter ao menos 6 caracteres")
        upd["password_hash"] = hash_password(body.new_password)
    if upd:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": upd})
    return clean(await db.users.find_one({"_id": ObjectId(user["id"])}))


# ---------- settings ----------
@api.get("/settings")
async def read_settings():
    return await get_settings()


@api.put("/settings")
async def write_settings(body: SettingsIn, _: dict = Depends(admin_user)):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.settings.update_one({"_id": "club"}, {"$set": upd}, upsert=True)
    return await get_settings()


@api.get("/public/stats")
async def public_stats():
    members = await db.users.count_documents({"active": True, "role": "member"})
    year = now().year
    events_year = await db.events.count_documents({"date": {"$regex": f"^{year}"}})
    upcoming = await db.events.count_documents({"date": {"$gte": now().strftime("%Y-%m-%d")}})
    return {"members": members, "events_year": events_year, "upcoming": upcoming}


# ---------- members ----------
@api.get("/members")
async def list_members(_: dict = Depends(admin_user)):
    docs = await db.users.find({}).sort("name", 1).to_list(2000)
    return [clean(d) for d in docs]


@api.post("/members")
async def create_member(body: MemberIn, _: dict = Depends(admin_user)):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Já existe um usuário com este e-mail")
    if not body.password or len(body.password) < 6:
        raise HTTPException(400, "Senha deve ter ao menos 6 caracteres")
    if body.role not in ("admin", "member"):
        raise HTTPException(400, "Perfil inválido")
    doc = body.model_dump(exclude={"password"})
    doc.update({"email": email, "password_hash": hash_password(body.password), "joined_at": now()})
    res = await db.users.insert_one(doc)
    return clean(await db.users.find_one({"_id": res.inserted_id}))


@api.put("/members/{mid}")
async def update_member(mid: str, body: MemberIn, admin: dict = Depends(admin_user)):
    if body.role not in ("admin", "member"):
        raise HTTPException(400, "Perfil inválido")
    email = body.email.lower()
    other = await db.users.find_one({"email": email, "_id": {"$ne": oid(mid)}})
    if other:
        raise HTTPException(400, "Já existe um usuário com este e-mail")
    if mid == admin["id"] and (body.role != "admin" or not body.active):
        raise HTTPException(400, "Você não pode remover seu próprio acesso de administrador")
    upd = body.model_dump(exclude={"password"})
    upd["email"] = email
    if body.password:
        if len(body.password) < 6:
            raise HTTPException(400, "Senha deve ter ao menos 6 caracteres")
        upd["password_hash"] = hash_password(body.password)
    r = await db.users.update_one({"_id": oid(mid)}, {"$set": upd})
    if not r.matched_count:
        raise HTTPException(404, "Membro não encontrado")
    return clean(await db.users.find_one({"_id": oid(mid)}))


@api.delete("/members/{mid}")
async def delete_member(mid: str, admin: dict = Depends(admin_user)):
    if mid == admin["id"]:
        raise HTTPException(400, "Você não pode excluir sua própria conta")
    await db.users.delete_one({"_id": oid(mid)})
    await db.payments.delete_many({"user_id": mid})
    await db.events.update_many({}, {"$pull": {"rsvps": mid}})
    return {"ok": True}


# ---------- events ----------
@api.get("/events")
async def list_events(user: dict = Depends(current_user)):
    docs = await db.events.find({}).sort("date", 1).to_list(1000)
    out = []
    for d in docs:
        e = clean(d)
        rs = e.get("rsvps", [])
        e["rsvp_count"] = len(rs)
        e["going"] = user["id"] in rs
        if user["role"] != "admin":
            e.pop("rsvps", None)
        out.append(e)
    return out


@api.post("/events")
async def create_event(body: EventIn, admin: dict = Depends(admin_user)):
    doc = body.model_dump()
    doc.update({"rsvps": [], "created_by": admin["name"], "created_at": now()})
    res = await db.events.insert_one(doc)
    return clean(await db.events.find_one({"_id": res.inserted_id}))


@api.put("/events/{eid}")
async def update_event(eid: str, body: EventIn, _: dict = Depends(admin_user)):
    r = await db.events.update_one({"_id": oid(eid)}, {"$set": body.model_dump()})
    if not r.matched_count:
        raise HTTPException(404, "Evento não encontrado")
    return clean(await db.events.find_one({"_id": oid(eid)}))


@api.delete("/events/{eid}")
async def delete_event(eid: str, _: dict = Depends(admin_user)):
    r = await db.events.delete_one({"_id": oid(eid)})
    if not r.deleted_count:
        raise HTTPException(404, "Evento não encontrado")
    return {"ok": True}


@api.post("/events/{eid}/rsvp")
async def rsvp(eid: str, user: dict = Depends(current_user)):
    ev = await db.events.find_one({"_id": oid(eid)})
    if not ev:
        raise HTTPException(404, "Evento não encontrado")
    going = user["id"] in ev.get("rsvps", [])
    op = "$pull" if going else "$addToSet"
    await db.events.update_one({"_id": ev["_id"]}, {op: {"rsvps": user["id"]}})
    return {"going": not going}


# ---------- dues ----------
@api.get("/dues")
async def dues_grid(year: int, _: dict = Depends(admin_user)):
    members = await db.users.find({"role": "member"}).sort("name", 1).to_list(2000)
    pays = await db.payments.find({"year": year}).to_list(50000)
    paid = {}
    for p in pays:
        if p.get("paid"):
            paid.setdefault(p["user_id"], {})[str(p["month"])] = {"amount": p.get("amount"), "paid_at": p.get("paid_at").isoformat() if p.get("paid_at") else None}
    rows = []
    for m in members:
        mid = str(m["_id"])
        rows.append({"id": mid, "name": m.get("name"), "email": m.get("email"), "active": m.get("active", True), "role": m.get("role"), "months": paid.get(mid, {})})
    return {"year": year, "rows": rows}


@api.post("/dues/toggle")
async def dues_toggle(body: DuesToggleIn, _: dict = Depends(admin_user)):
    if not 1 <= body.month <= 12:
        raise HTTPException(400, "Mês inválido")
    if not await db.users.find_one({"_id": oid(body.user_id)}):
        raise HTTPException(404, "Membro não encontrado")
    s = await get_settings()
    q = {"user_id": body.user_id, "year": body.year, "month": body.month}
    if body.paid:
        await db.payments.update_one(q, {"$set": {**q, "paid": True, "amount": s["monthly_fee"], "paid_at": now()}}, upsert=True)
    else:
        await db.payments.delete_one(q)
    return {"ok": True, "paid": body.paid}


@api.get("/dues/me")
async def my_dues(year: int, user: dict = Depends(current_user)):
    pays = await db.payments.find({"user_id": user["id"], "year": year, "paid": True}).to_list(12)
    return {"year": year, "months": {str(p["month"]): {"amount": p.get("amount"), "paid_at": p["paid_at"].isoformat() if p.get("paid_at") else None} for p in pays}}


@api.get("/admin/overview")
async def overview(_: dict = Depends(admin_user)):
    t = now()
    total = await db.users.count_documents({"active": True, "role": "member"})
    paid_month = await db.payments.count_documents({"year": t.year, "month": t.month, "paid": True})
    pays_year = await db.payments.find({"year": t.year, "paid": True}).to_list(50000)
    revenue_year = sum(p.get("amount", 0) for p in pays_year)
    upcoming = await db.events.find({"date": {"$gte": t.strftime("%Y-%m-%d")}}).sort("date", 1).to_list(5)
    return {
        "active_members": total,
        "paid_this_month": paid_month,
        "unpaid_this_month": max(total - paid_month, 0),
        "revenue_year": revenue_year,
        "revenue_month": sum(p.get("amount", 0) for p in pays_year if p["month"] == t.month),
        "upcoming": [clean(e) for e in upcoming],
        "month": t.month,
        "year": t.year,
    }

# ---------- applications (inscrições) ----------
class ApplicationIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    whatsapp: str = Field(min_length=8, max_length=30)
    age: Optional[int] = Field(default=None, ge=14, le=100)
    height: Optional[str] = Field(default="", max_length=20)
    city: str = Field(min_length=2, max_length=120)
    profession: Optional[str] = Field(default="", max_length=120)
    instagram: Optional[str] = Field(default="", max_length=80)
    has_motorcycle: bool = False
    motorcycle_model: Optional[str] = Field(default="", max_length=120)
    riding_since: Optional[str] = Field(default="", max_length=80)
    styles: List[Literal["passeios_longos", "trilhas", "estrada", "encontros_urbanos"]] = []
    frequency: Optional[str] = Field(default="", max_length=80)
    other_group: bool = False
    reason: str = Field(min_length=10, max_length=3000)
    commit_events: bool = False
    has_cnh_a: bool = False


class RejectIn(BaseModel):
    note: Optional[str] = ""


@api.post("/applications")
async def create_application(body: ApplicationIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Este e-mail já pertence a um membro do club")
    if await db.applications.find_one({"email": email, "status": "pending"}):
        raise HTTPException(400, "Já existe uma inscrição em análise com este e-mail")
    doc = body.model_dump()
    doc.update({"email": email, "status": "pending", "created_at": now()})
    await db.applications.insert_one(doc)
    return {"ok": True}


@api.get("/applications")
async def list_applications(_: dict = Depends(admin_user)):
    docs = await db.applications.find({}).sort("created_at", -1).to_list(2000)
    return [clean(d) for d in docs]


@api.post("/applications/{aid}/approve")
async def approve_application(aid: str, admin: dict = Depends(admin_user)):
    app_doc = await db.applications.find_one({"_id": oid(aid)})
    if not app_doc:
        raise HTTPException(404, "Inscrição não encontrada")
    if app_doc["status"] != "pending":
        raise HTTPException(400, "Esta inscrição já foi analisada")
    if await db.users.find_one({"email": app_doc["email"]}):
        raise HTTPException(400, "Já existe um membro com este e-mail")
    temp = secrets.token_urlsafe(6)
    res = await db.users.insert_one({
        "email": app_doc["email"], "password_hash": hash_password(temp), "name": app_doc["name"],
        "role": "member", "active": True, "nickname": "", "phone": app_doc.get("whatsapp", ""),
        "motorcycle": app_doc.get("motorcycle_model", ""), "blood_type": "", "birth_date": "", "joined_at": now(),
    })
    await db.applications.update_one({"_id": app_doc["_id"]}, {"$set": {
        "status": "approved", "reviewed_by": admin["name"], "reviewed_at": now(), "user_id": str(res.inserted_id)}})
    return {"ok": True, "email": app_doc["email"], "temp_password": temp}


@api.post("/applications/{aid}/reject")
async def reject_application(aid: str, body: RejectIn, admin: dict = Depends(admin_user)):
    r = await db.applications.update_one({"_id": oid(aid), "status": "pending"}, {"$set": {
        "status": "rejected", "note": body.note or "", "reviewed_by": admin["name"], "reviewed_at": now()}})
    if not r.matched_count:
        raise HTTPException(400, "Inscrição não encontrada ou já analisada")
    return {"ok": True}


@api.delete("/applications/{aid}")
async def delete_application(aid: str, _: dict = Depends(admin_user)):
    r = await db.applications.delete_one({"_id": oid(aid)})
    if not r.deleted_count:
        raise HTTPException(404, "Inscrição não encontrada")
    return {"ok": True}


# ---------- products ----------
class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    image_url: str = ""
    price: float = Field(default=0, ge=0)
    sizes: List[str] = []
    deadline: str = ""
    active: bool = True


class ProductResponseIn(BaseModel):
    want: bool
    size: Optional[str] = ""
    quantity: int = Field(default=1, ge=0, le=50)


@api.get("/products")
async def list_products(user: dict = Depends(current_user)):
    q = {} if user["role"] == "admin" else {"active": True}
    docs = await db.products.find(q).sort("created_at", -1).to_list(500)
    mine = {r["product_id"]: r for r in await db.product_orders.find({"user_id": user["id"]}).to_list(500)}
    out = []
    for d in docs:
        p = clean(d)
        r = mine.get(p["id"])
        p["my_response"] = {"want": r["want"], "size": r.get("size", ""), "quantity": r.get("quantity", 0)} if r else None
        out.append(p)
    return out


@api.post("/products")
async def create_product(body: ProductIn, _: dict = Depends(admin_user)):
    doc = body.model_dump()
    doc["sizes"] = [s.strip() for s in doc["sizes"] if s.strip()]
    doc["created_at"] = now()
    res = await db.products.insert_one(doc)
    return clean(await db.products.find_one({"_id": res.inserted_id}))


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, _: dict = Depends(admin_user)):
    doc = body.model_dump()
    doc["sizes"] = [s.strip() for s in doc["sizes"] if s.strip()]
    r = await db.products.update_one({"_id": oid(pid)}, {"$set": doc})
    if not r.matched_count:
        raise HTTPException(404, "Produto não encontrado")
    return clean(await db.products.find_one({"_id": oid(pid)}))


@api.delete("/products/{pid}")
async def delete_product(pid: str, _: dict = Depends(admin_user)):
    r = await db.products.delete_one({"_id": oid(pid)})
    if not r.deleted_count:
        raise HTTPException(404, "Produto não encontrado")
    await db.product_orders.delete_many({"product_id": pid})
    return {"ok": True}


@api.post("/products/{pid}/response")
async def respond_product(pid: str, body: ProductResponseIn, user: dict = Depends(current_user)):
    p = await db.products.find_one({"_id": oid(pid)})
    if not p or (not p.get("active") and user["role"] != "admin"):
        raise HTTPException(404, "Produto não encontrado")
    if body.want:
        if p.get("sizes") and body.size not in p["sizes"]:
            raise HTTPException(400, "Escolha um tamanho válido")
        if body.quantity < 1:
            raise HTTPException(400, "Quantidade mínima é 1")
    doc = {"product_id": pid, "user_id": user["id"], "want": body.want,
           "size": body.size if body.want else "", "quantity": body.quantity if body.want else 0, "updated_at": now()}
    await db.product_orders.update_one({"product_id": pid, "user_id": user["id"]}, {"$set": doc}, upsert=True)
    return {"ok": True}


@api.get("/products/{pid}/responses")
async def product_responses(pid: str, _: dict = Depends(admin_user)):
    if not await db.products.find_one({"_id": oid(pid)}):
        raise HTTPException(404, "Produto não encontrado")
    rows = await db.product_orders.find({"product_id": pid}).to_list(5000)
    ids = [ObjectId(r["user_id"]) for r in rows if ObjectId.is_valid(r["user_id"])]
    users = {str(u["_id"]): u for u in await db.users.find({"_id": {"$in": ids}}).to_list(5000)}
    by_size, total, items = {}, 0, []
    for r in rows:
        u = users.get(r["user_id"], {})
        items.append({"name": u.get("name", "—"), "email": u.get("email", ""), "want": r["want"], "size": r.get("size", ""), "quantity": r.get("quantity", 0)})
        if r["want"]:
            total += r.get("quantity", 0)
            key = r.get("size") or "Único"
            by_size[key] = by_size.get(key, 0) + r.get("quantity", 0)
    return {"total": total, "by_size": by_size, "yes": sum(1 for i in items if i["want"]), "no": sum(1 for i in items if not i["want"]), "items": items}




app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.payments.create_index([("user_id", 1), ("year", 1), ("month", 1)], unique=True)
    email = os.environ["ADMIN_EMAIL"].lower()
    if not await db.users.find_one({"email": email}):
        await db.users.insert_one({
            "email": email, "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]),
            "name": "Administração", "role": "admin", "active": True, "nickname": "Admin",
            "phone": "", "motorcycle": "", "blood_type": "", "birth_date": "", "joined_at": now(),
        })
    if await db.events.count_documents({}) == 0:
        base = now()
        await db.events.insert_many([
            {"title": "[Exemplo] Encontro mensal do club", "type": "encontro", "date": (base + timedelta(days=10)).strftime("%Y-%m-%dT19:00"),
             "location": "[Local do encontro]", "description": "Encontro de exemplo. Edite ou exclua na área do administrador.", "image_url": "", "rsvps": [], "created_by": "Sistema", "created_at": base},
            {"title": "[Exemplo] Passeio de fim de semana", "type": "evento", "date": (base + timedelta(days=24)).strftime("%Y-%m-%dT08:00"),
             "location": "[Ponto de saída]", "description": "Evento de exemplo. Edite ou exclua na área do administrador.", "image_url": "", "rsvps": [], "created_by": "Sistema", "created_at": base},
        ])


@app.on_event("shutdown")
async def shutdown():
    client.close()
