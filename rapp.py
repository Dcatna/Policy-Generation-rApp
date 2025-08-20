# rapp.py
import os, asyncio, json
from fastapi import FastAPI, Request
import httpx

PMS_URL   = os.getenv("PMS_URL",   "http://policy-agent:8081")
SERVICE_ID= os.getenv("SERVICE_ID","demo-rapp")
RIC_ID    = os.getenv("RIC_ID",    "ric2")     # from your setup
POLICY_ID = os.getenv("POLICY_ID", "demo-policy-3")
PTYPE_ID  = os.getenv("POLICY_TYPE_ID", "")    # empty string for A1-STD sim basic
PORT      = int(os.getenv("PORT","8080"))
CALLBACK_URL = os.getenv("CALLBACK_URL", "http://demo-rapp:8080/callback")

app = FastAPI()

@app.get("/healthz")
async def healthz(): return {"ok": True} #if it can reach its healthy

@app.post("/callback")
async def callback(req: Request):
    body = await req.body()
    print("CALLBACK:", body.decode("utf-8"), flush=True) #just print the body and return ok
    return {"ok": True}

async def register_service():
    body = {
        "service_id": SERVICE_ID,
        "keep_alive_interval_seconds": 3600,
        # callback points to *this* service inside the cluster
        "callback_url": CALLBACK_URL
    }
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.put(f"{PMS_URL}/a1-policy/v2/services", json=body)
        r.raise_for_status()
        print("Registered service:", r.status_code, flush=True)

async def put_policy():
    body = { #policy type found on swagger api (see notes)
        "policy_id": POLICY_ID,
        "ric_id": RIC_ID,
        "policytype_id": PTYPE_ID,
        "service_id": SERVICE_ID,
        "status_notification_uri": CALLBACK_URL,
        "policy_data": {"note": "hello-from-rapp", "limit": 21}
    }
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.put(f"{PMS_URL}/a1-policy/v2/policies", json=body) #its PUT 
        r.raise_for_status()
        print("Put policy:", r.status_code, flush=True)

@app.on_event("startup")
async def on_startup():
    # do startup work but don't block the server coming up
    async def _bg():
        try:
            await register_service()
            await put_policy()
        except Exception as e:
            print("Startup tasks failed:", e, flush=True)
    asyncio.create_task(_bg())

# --- run via: uvicorn rapp:app --host 0.0.0.0 --port 8080
