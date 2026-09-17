from decimal import Decimal
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.account import Account
from app.models.ledger import LedgerEntryType
from app.repositories.account_repo import AccountRepository
from app.repositories.transaction_repo import TransactionRepository
from app.repositories.ledger_repo import LedgerRepository
from app.models.transaction import TransactionStatus


class AccountService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.account_repo = AccountRepository(session)
        self.tx_repo = TransactionRepository(session)
        self.ledger_repo = LedgerRepository(session)

    async def create_account(self, owner_name: str, initial_balance: Decimal, currency: str) -> Account:
        async with self.session.begin():
            account = await self.account_repo.create(
                owner_name=owner_name,
                initial_balance=initial_balance,
                currency=currency,
            )

            # Si hay balance inicial, registrar depósito inicial en libro mayor sin cuenta origen (inyección externa)
            if initial_balance > Decimal("0.0000"):
                initial_tx = await self.tx_repo.create(
                    idempotency_key=f"init-{account.id}",
                    source_account_id=None,
                    target_account_id=account.id,
                    amount=initial_balance,
                    currency=currency,
                    status=TransactionStatus.COMPLETED,
                )
                await self.ledger_repo.record_entry(
                    transaction_id=initial_tx.id,
                    account_id=account.id,
                    entry_type=LedgerEntryType.CREDIT,
                    amount=initial_balance,
                    balance_after=initial_balance,
                )

        return account

    async def get_account(self, account_id: uuid.UUID) -> Optional[Account]:
        return await self.account_repo.get_by_id(account_id)

    async def get_by_number(self, account_number: str) -> Optional[Account]:
        return await self.account_repo.get_by_number(account_number)
