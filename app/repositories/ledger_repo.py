from decimal import Decimal
import uuid
from typing import List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ledger import LedgerEntry, LedgerEntryType


class LedgerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def record_entry(
        self,
        transaction_id: uuid.UUID,
        account_id: uuid.UUID,
        entry_type: LedgerEntryType,
        amount: Decimal,
        balance_after: Decimal,
    ) -> LedgerEntry:
        entry = LedgerEntry(
            transaction_id=transaction_id,
            account_id=account_id,
            entry_type=entry_type,
            amount=amount,
            balance_after=balance_after,
        )
        self.session.add(entry)
        await self.session.flush()
        await self.session.refresh(entry)
        return entry

    async def get_by_account(self, account_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[LedgerEntry]:
        stmt = (
            select(LedgerEntry)
            .where(LedgerEntry.account_id == account_id)
            .order_by(LedgerEntry.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def calculate_reconciliation(self, account_id: uuid.UUID) -> dict:
        """
        Calcula el balance real de la cuenta sumando todos los créditos y restando todos los débitos.
        """
        # Suma de créditos
        credit_stmt = select(func.coalesce(func.sum(LedgerEntry.amount), Decimal("0.0000"))).where(
            LedgerEntry.account_id == account_id,
            LedgerEntry.entry_type == LedgerEntryType.CREDIT,
        )
        credit_res = await self.session.execute(credit_stmt)
        total_credits = credit_res.scalar_one()

        # Suma de débitos
        debit_stmt = select(func.coalesce(func.sum(LedgerEntry.amount), Decimal("0.0000"))).where(
            LedgerEntry.account_id == account_id,
            LedgerEntry.entry_type == LedgerEntryType.DEBIT,
        )
        debit_res = await self.session.execute(debit_stmt)
        total_debits = debit_res.scalar_one()

        count_stmt = select(func.count(LedgerEntry.id)).where(LedgerEntry.account_id == account_id)
        count_res = await self.session.execute(count_stmt)
        total_entries = count_res.scalar_one()

        return {
            "total_credits": total_credits,
            "total_debits": total_debits,
            "net_balance": total_credits - total_debits,
            "total_entries": total_entries,
        }
