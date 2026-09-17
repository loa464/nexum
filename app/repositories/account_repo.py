from decimal import Decimal
import uuid
import secrets
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.account import Account


class AccountRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, owner_name: str, initial_balance: Decimal, currency: str) -> Account:
        # Generar número de cuenta único con formato bancario estándar
        account_number = f"NX-{currency}-{secrets.randbelow(10**10):010d}"
        account = Account(
            account_number=account_number,
            owner_name=owner_name,
            balance=initial_balance,
            currency=currency.upper(),
            is_active=True,
        )
        self.session.add(account)
        await self.session.flush()
        await self.session.refresh(account)
        return account

    async def get_by_id(self, account_id: uuid.UUID) -> Optional[Account]:
        stmt = select(Account).where(Account.id == account_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_number(self, account_number: str) -> Optional[Account]:
        stmt = select(Account).where(Account.account_number == account_number)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_two_accounts_for_update(
        self, id_a: uuid.UUID, id_b: uuid.UUID
    ) -> Tuple[Optional[Account], Optional[Account]]:
        """
        Bloqueo Pesimista Anti-Deadlock (SELECT ... FOR UPDATE):
        Ordena determinísticamente los UUIDs antes de adquirir el bloqueo.
        Garantiza que peticiones concurrentes cruzadas (A->B y B->A) bloqueen
        en el mismo orden, eliminando cualquier posibilidad de interbloqueo.
        """
        first_id, second_id = (id_a, id_b) if str(id_a) < str(id_b) else (id_b, id_a)

        # Bloquear primera cuenta
        stmt_first = select(Account).where(Account.id == first_id).with_for_update()
        res_first = await self.session.execute(stmt_first)
        acc_first = res_first.scalar_one_or_none()

        # Bloquear segunda cuenta
        stmt_second = select(Account).where(Account.id == second_id).with_for_update()
        res_second = await self.session.execute(stmt_second)
        acc_second = res_second.scalar_one_or_none()

        # Retornar en el orden original solicitado (source, target)
        if first_id == id_a:
            return acc_first, acc_second
        return acc_second, acc_first
