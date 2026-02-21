from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Suma API", version="0.1.0")

api_router = APIRouter(prefix="/api")
v1_router = APIRouter(prefix="/api/v1")


# --- Pydantic Models ---

class MovementCreate(BaseModel):
    type: str
    amount: float
    currency: str = "CRC"
    description: str = ""
    responsible: Optional[str] = None
    business_unit_id: Optional[str] = None
    status: str = "pending"
    date: str
    tags: List[str] = []

class MovementUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    responsible: Optional[str] = None
    business_unit_id: Optional[str] = None
    status: Optional[str] = None
    date: Optional[str] = None
    tags: Optional[List[str]] = None

class MovementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str
    amount: float
    currency: str
    description: str
    responsible: Optional[str] = None
    business_unit_id: Optional[str] = None
    status: str
    date: str
    tags: List[str] = []
    created_at: str
    updated_at: str

class BusinessUnitCreate(BaseModel):
    name: str
    type: str = "other"

class BusinessUnitResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str
    created_at: str

class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    created_at: str

class KPISummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    movement_count: int
    pending_count: int


# --- Health ---

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "app": "Suma", "version": "0.1.0"}


# --- Movements ---

@v1_router.get("/movements", response_model=List[MovementResponse])
async def list_movements(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    movements = await db.movements.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    return movements


@v1_router.post("/movements", response_model=MovementResponse)
async def create_movement(data: MovementCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.movements.insert_one(doc)
    doc.pop("_id", None)
    return doc


@v1_router.patch("/movements/{movement_id}", response_model=MovementResponse)
async def update_movement(movement_id: str, data: MovementUpdate):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.movements.update_one({"id": movement_id}, {"$set": updates})
    doc = await db.movements.find_one({"id": movement_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Movement not found")
    return doc


@v1_router.delete("/movements/{movement_id}")
async def delete_movement(movement_id: str):
    result = await db.movements.delete_one({"id": movement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movement not found")
    return {"deleted": True}


# --- Business Units ---

@v1_router.get("/business-units", response_model=List[BusinessUnitResponse])
async def list_business_units():
    units = await db.business_units.find({}, {"_id": 0}).to_list(100)
    return units


@v1_router.post("/business-units", response_model=BusinessUnitResponse)
async def create_business_unit(data: BusinessUnitCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": now}
    await db.business_units.insert_one(doc)
    doc.pop("_id", None)
    return doc


# --- Tags ---

@v1_router.get("/tags", response_model=List[TagResponse])
async def list_tags():
    tags = await db.tags.find({}, {"_id": 0}).to_list(100)
    return tags


@v1_router.post("/tags", response_model=TagResponse)
async def create_tag(data: TagCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), "name": data.name, "created_at": now}
    await db.tags.insert_one(doc)
    doc.pop("_id", None)
    return doc


# --- KPIs ---

@v1_router.get("/kpis/summary", response_model=KPISummary)
async def kpi_summary():
    pipeline_income = [{"$match": {"type": "income"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    pipeline_expense = [{"$match": {"type": "expense"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]

    income_result = await db.movements.aggregate(pipeline_income).to_list(1)
    expense_result = await db.movements.aggregate(pipeline_expense).to_list(1)

    total_income = income_result[0]["total"] if income_result else 0
    total_expense = expense_result[0]["total"] if expense_result else 0

    count = await db.movements.count_documents({})
    pending = await db.movements.count_documents({"status": "pending"})

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "movement_count": count,
        "pending_count": pending,
    }


# --- Seed ---

@api_router.post("/seed")
async def seed_data():
    count = await db.movements.count_documents({})
    if count > 0:
        return {"message": "Data already seeded", "movement_count": count}

    now = datetime.now(timezone.utc).isoformat()

    units = [
        {"id": str(uuid.uuid4()), "name": "Sucursal Centro", "type": "branch", "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Feria del Agricultor", "type": "event", "created_at": now},
    ]
    await db.business_units.insert_many([{**u} for u in units])

    tags = [
        {"id": str(uuid.uuid4()), "name": "SINPE", "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Efectivo", "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Proveedor", "created_at": now},
    ]
    await db.tags.insert_many([{**t} for t in tags])

    movements = [
        {
            "id": str(uuid.uuid4()), "type": "income", "amount": 45000, "currency": "CRC",
            "description": "Venta de cafe molido", "responsible": "Maria",
            "business_unit_id": units[0]["id"], "status": "classified",
            "date": "2026-01-15", "tags": ["SINPE"], "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "type": "expense", "amount": 12000, "currency": "CRC",
            "description": "Compra de bolsas", "responsible": None,
            "business_unit_id": units[0]["id"], "status": "pending",
            "date": "2026-01-16", "tags": ["Proveedor"], "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "type": "income", "amount": 75000, "currency": "CRC",
            "description": "Ventas feria sabado", "responsible": "Carlos",
            "business_unit_id": units[1]["id"], "status": "pending",
            "date": "2026-01-18", "tags": ["Efectivo"], "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "type": "expense", "amount": 8500, "currency": "CRC",
            "description": "Gasolina transporte", "responsible": "Carlos",
            "business_unit_id": units[1]["id"], "status": "classified",
            "date": "2026-01-18", "tags": ["Efectivo"], "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "type": "income", "amount": 32000, "currency": "CRC",
            "description": "Pedido especial empanadas", "responsible": "Maria",
            "business_unit_id": None, "status": "pending",
            "date": "2026-01-20", "tags": ["SINPE"], "created_at": now, "updated_at": now,
        },
    ]
    await db.movements.insert_many([{**m} for m in movements])

    return {"message": "Seed complete", "movements": len(movements), "units": len(units), "tags": len(tags)}


# --- Wire up ---

app.include_router(api_router)
app.include_router(v1_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
