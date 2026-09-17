from datetime import datetime
from decimal import Decimal
import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.transaction import TransactionStatus


class TransferCreate(BaseModel):
    source_account_id: uuid.UUID = Field(..., description="UUID de la cuenta que envía fondos")
    target_account_id: uuid.UUID = Field(..., description="UUID de la cuenta que recibe fondos")
    amount: Decimal = Field(..., gt=0, description="Monto estrictamente positivo a transferir")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="Divisa de la operación")

    @model_validator(mode="after")
    def check_accounts_differ(self) -> "TransferCreate":
        if self.source_account_id == self.target_account_id:
            raise ValueError("La cuenta de origen y destino no pueden ser la misma.")
        return self


class TransferResponse(BaseModel):
    id: uuid.UUID
    idempotency_key: str
    source_account_id: Optional[uuid.UUID] = None
    target_account_id: uuid.UUID
    amount: Decimal
    currency: str
    status: TransactionStatus
    created_at: datetime
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
