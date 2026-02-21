from sqlalchemy import Column, String, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase
import uuid


class Base(DeclarativeBase):
    pass


class Movement(Base):
    __tablename__ = "movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False)  # income | expense
    amount = Column(Float, nullable=False)
    currency = Column(String, default="CRC")
    description = Column(Text, default="")
    responsible = Column(String, nullable=True)
    business_unit_id = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending | classified | closed
    date = Column(String, nullable=False)
    tags = Column(JSONB, default=[])
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class BusinessUnit(Base):
    __tablename__ = "business_units"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, default="other")  # branch | brand | event | other
    created_at = Column(String, nullable=False)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
