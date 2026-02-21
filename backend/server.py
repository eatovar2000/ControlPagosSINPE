from fastapi import FastAPI, APIRouter, Query, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from database import engine, get_db
from models import Base, Movement, BusinessUnit, Tag, User
from firebase_auth import get_current_user, get_optional_user, get_firebase_app

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

app = FastAPI(title="Suma API", version="0.1.0")
api_router = APIRouter(prefix="/api")
v1_router = APIRouter(prefix="/api/v1")


# --- Startup: create tables ---

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables ready")


# --- Pydantic schemas ---

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
    model_config = ConfigDict(from_attributes=True)
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
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    type: str
    created_at: str


class TagCreate(BaseModel):
    name: str


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    created_at: str


# --- Auth Schemas ---

class UserRegisterRequest(BaseModel):
    """Data from Firebase token to create/update user"""
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    firebase_uid: str
    email: Optional[str] = None
    phone: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    provider: Optional[str] = None
    role: str
    created_at: str
    updated_at: str


class KPISummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    movement_count: int
    pending_count: int


# --- Health ---

@api_router.get("/health")
async def health_check():
    firebase_status = "configured" if get_firebase_app() else "not_configured"
    return {
        "status": "ok",
        "app": "Suma",
        "version": "0.1.0",
        "firebase": firebase_status
    }


# --- Auth Endpoints ---

@v1_router.post("/auth/register", response_model=UserResponse)
async def register_or_get_user(
    data: UserRegisterRequest,
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user or return existing user.
    Called after successful Firebase authentication.
    Uses Firebase token to extract user info.
    """
    firebase_uid = firebase_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=400, detail="Invalid Firebase token")

    # Check if user exists
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    existing_user = result.scalar_one_or_none()

    now = datetime.now(timezone.utc).isoformat()

    if existing_user:
        # Update last login info
        updates = {"updated_at": now}

        # Update display_name if provided
        if data.display_name:
            updates["display_name"] = data.display_name
        if data.photo_url:
            updates["photo_url"] = data.photo_url

        await db.execute(
            update(User)
            .where(User.firebase_uid == firebase_uid)
            .values(**updates)
        )
        await db.commit()
        await db.refresh(existing_user)
        return existing_user

    # Create new user
    # Extract provider from Firebase token
    provider = None
    firebase_info = firebase_user.get("firebase", {})
    sign_in_provider = firebase_info.get("sign_in_provider")
    if sign_in_provider:
        provider = sign_in_provider

    new_user = User(
        id=str(uuid.uuid4()),
        firebase_uid=firebase_uid,
        email=firebase_user.get("email"),
        phone=firebase_user.get("phone_number"),
        display_name=data.display_name or firebase_user.get("name"),
        photo_url=data.photo_url or firebase_user.get("picture"),
        provider=provider,
        role="user",
        created_at=now,
        updated_at=now,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info(f"New user registered: {new_user.id} ({new_user.email or new_user.phone})")
    return new_user


@v1_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authenticated user's profile.
    """
    firebase_uid = firebase_user.get("uid")

    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please register first."
        )

    return user


# --- Movements (Protected - require authentication) ---

async def get_db_user_id(
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Helper to get local user ID from Firebase token"""
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    return user_id


@v1_router.get("/movements", response_model=List[MovementResponse])
async def list_movements(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List movements for the authenticated user"""
    # Get local user ID
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    
    # Query movements for this user only
    q = select(Movement).where(Movement.user_id == user_id)
    if status:
        q = q.where(Movement.status == status)
    if type:
        q = q.where(Movement.type == type)
    q = q.order_by(Movement.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@v1_router.post("/movements", response_model=MovementResponse)
async def create_movement(
    data: MovementCreate,
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new movement for the authenticated user"""
    # Get local user ID
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    
    now = datetime.now(timezone.utc).isoformat()
    mov = Movement(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **data.model_dump(),
        created_at=now,
        updated_at=now,
    )
    db.add(mov)
    await db.commit()
    await db.refresh(mov)
    return mov


@v1_router.patch("/movements/{movement_id}", response_model=MovementResponse)
async def update_movement(
    movement_id: str,
    data: MovementUpdate,
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a movement (only if owned by user)"""
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    
    # Check ownership
    result = await db.execute(
        select(Movement).where(Movement.id == movement_id, Movement.user_id == user_id)
    )
    mov = result.scalar_one_or_none()
    if not mov:
        raise HTTPException(status_code=404, detail="Movement not found")
    
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.execute(
        update(Movement)
        .where(Movement.id == movement_id, Movement.user_id == user_id)
        .values(**updates)
    )
    await db.commit()
    await db.refresh(mov)
    return mov


@v1_router.delete("/movements/{movement_id}")
async def delete_movement(
    movement_id: str,
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a movement (only if owned by user)"""
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    
    result = await db.execute(
        delete(Movement).where(Movement.id == movement_id, Movement.user_id == user_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Movement not found")
    return {"deleted": True}


# --- Business Units ---

@v1_router.get("/business-units", response_model=List[BusinessUnitResponse])
async def list_business_units(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BusinessUnit))
    return result.scalars().all()


@v1_router.post("/business-units", response_model=BusinessUnitResponse)
async def create_business_unit(data: BusinessUnitCreate, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    unit = BusinessUnit(id=str(uuid.uuid4()), **data.model_dump(), created_at=now)
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return unit


# --- Tags ---

@v1_router.get("/tags", response_model=List[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    return result.scalars().all()


@v1_router.post("/tags", response_model=TagResponse)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    tag = Tag(id=str(uuid.uuid4()), name=data.name, created_at=now)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


# --- KPIs (Protected - user-specific) ---

@v1_router.get("/kpis/summary", response_model=KPISummary)
async def kpi_summary(
    firebase_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get KPI summary for the authenticated user's movements"""
    firebase_uid = firebase_user.get("uid")
    result = await db.execute(
        select(User.id).where(User.firebase_uid == firebase_uid)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not registered")
    
    income = await db.execute(
        select(func.coalesce(func.sum(Movement.amount), 0))
        .where(Movement.user_id == user_id, Movement.type == "income")
    )
    expense = await db.execute(
        select(func.coalesce(func.sum(Movement.amount), 0))
        .where(Movement.user_id == user_id, Movement.type == "expense")
    )
    count = await db.execute(
        select(func.count())
        .select_from(Movement)
        .where(Movement.user_id == user_id)
    )
    pending = await db.execute(
        select(func.count())
        .select_from(Movement)
        .where(Movement.user_id == user_id, Movement.status == "pending")
    )

    total_income = float(income.scalar())
    total_expense = float(expense.scalar())

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "movement_count": count.scalar(),
        "pending_count": pending.scalar(),
    }


# --- Seed ---

@api_router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(Movement))
    if result.scalar() > 0:
        cnt = (await db.execute(select(func.count()).select_from(Movement))).scalar()
        return {"message": "Data already seeded", "movement_count": cnt}

    now = datetime.now(timezone.utc).isoformat()

    u1_id, u2_id = str(uuid.uuid4()), str(uuid.uuid4())
    units = [
        BusinessUnit(id=u1_id, name="Sucursal Centro", type="branch", created_at=now),
        BusinessUnit(id=u2_id, name="Feria del Agricultor", type="event", created_at=now),
    ]
    db.add_all(units)

    tags = [
        Tag(id=str(uuid.uuid4()), name="SINPE", created_at=now),
        Tag(id=str(uuid.uuid4()), name="Efectivo", created_at=now),
        Tag(id=str(uuid.uuid4()), name="Proveedor", created_at=now),
    ]
    db.add_all(tags)

    movements = [
        Movement(id=str(uuid.uuid4()), type="income", amount=45000, currency="CRC",
                 description="Venta de cafe molido", responsible="Maria",
                 business_unit_id=u1_id, status="classified",
                 date="2026-01-15", tags=["SINPE"], created_at=now, updated_at=now),
        Movement(id=str(uuid.uuid4()), type="expense", amount=12000, currency="CRC",
                 description="Compra de bolsas", responsible=None,
                 business_unit_id=u1_id, status="pending",
                 date="2026-01-16", tags=["Proveedor"], created_at=now, updated_at=now),
        Movement(id=str(uuid.uuid4()), type="income", amount=75000, currency="CRC",
                 description="Ventas feria sabado", responsible="Carlos",
                 business_unit_id=u2_id, status="pending",
                 date="2026-01-18", tags=["Efectivo"], created_at=now, updated_at=now),
        Movement(id=str(uuid.uuid4()), type="expense", amount=8500, currency="CRC",
                 description="Gasolina transporte", responsible="Carlos",
                 business_unit_id=u2_id, status="classified",
                 date="2026-01-18", tags=["Efectivo"], created_at=now, updated_at=now),
        Movement(id=str(uuid.uuid4()), type="income", amount=32000, currency="CRC",
                 description="Pedido especial empanadas", responsible="Maria",
                 business_unit_id=None, status="pending",
                 date="2026-01-20", tags=["SINPE"], created_at=now, updated_at=now),
    ]
    db.add_all(movements)
    await db.commit()

    return {"message": "Seed complete", "movements": 5, "units": 2, "tags": 3}


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
