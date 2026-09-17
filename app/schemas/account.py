from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, Field, ConfigDict


class AccountCreate(BaseModel):
    owner_name: str = Field(..., min_length=2, max_length=120, description="Nombre del titular de la cuenta")
    initial_balance: Decimal = Field(default=Decimal("0.0000"), ge=0, description="Saldo inicial no negativo")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="Código ISO 4217 de divisa")


class AccountResponse(BaseModel):
    id: uuid.UUID
    account_number: str
    owner_name: str
    balance: Decimal
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
