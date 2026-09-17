import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.account_repo import AccountRepository
from app.repositories.ledger_repo import LedgerRepository
from app.schemas.ledger import ReconciliationReport


class ReconciliationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.account_repo = AccountRepository(session)
        self.ledger_repo = LedgerRepository(session)

    async def reconcile_account(self, account_id: uuid.UUID) -> Optional[ReconciliationReport]:
        account = await self.account_repo.get_by_id(account_id)
        if not account:
            return None

        stats = await self.ledger_repo.calculate_reconciliation(account_id)
        calculated_balance = stats["net_balance"]
        discrepancy = account.balance - calculated_balance

        return ReconciliationReport(
            account_id=account.id,
            current_balance=account.balance,
            calculated_ledger_balance=calculated_balance,
            discrepancy=discrepancy,
            is_reconciled=(discrepancy == Decimal("0.0000")),
            total_ledger_entries=stats["total_entries"],
        )
