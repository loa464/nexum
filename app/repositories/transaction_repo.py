from decimal import Decimal
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.transaction import Transaction, TransactionStatus


class TransactionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        idempotency_key: str,
        target_account_id: uuid.UUID,
        amount: Decimal,
        currency: str,
        source_account_id: Optional[uuid.UUID] = None,
        status: TransactionStatus = TransactionStatus.PENDING,
    ) -> Transaction:
        tx = Transaction(
            idempotency_key=idempotency_key,
            source_account_id=source_account_id,
            target_account_id=target_account_id,
            amount=amount,
            currency=currency.upper(),
            status=status,
        )
        self.session.add(tx)
        await self.session.flush()
        await self.session.refresh(tx)
        return tx

    async def get_by_id(self, tx_id: uuid.UUID) -> Optional[Transaction]:
        stmt = select(Transaction).where(Transaction.id == tx_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, key: str) -> Optional[Transaction]:
        stmt = select(Transaction).where(Transaction.idempotency_key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(
        self, tx: Transaction, status: TransactionStatus, error_message: Optional[str] = None
    ) -> Transaction:
        tx.status = status
        tx.error_message = error_message
        self.session.add(tx)
        await self.session.flush()
        await self.session.refresh(tx)
        return tx
