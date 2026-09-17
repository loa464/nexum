from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict
from app.models.ledger import LedgerEntryType


class LedgerEntryResponse(BaseModel):
    id: uuid.UUID
    transaction_id: uuid.UUID
    account_id: uuid.UUID
    entry_type: LedgerEntryType
    amount: Decimal
    balance_after: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReconciliationReport(BaseModel):
    account_id: uuid.UUID
    current_balance: Decimal
    calculated_ledger_balance: Decimal
    discrepancy: Decimal
    is_reconciled: bool
    total_ledger_entries: int
