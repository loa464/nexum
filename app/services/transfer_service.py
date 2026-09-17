from decimal import Decimal
import uuid
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis import IdempotencyManager
from app.models.transaction import Transaction, TransactionStatus
from app.models.ledger import LedgerEntryType
from app.repositories.account_repo import AccountRepository
from app.repositories.transaction_repo import TransactionRepository
from app.repositories.ledger_repo import LedgerRepository


class TransferError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "TRANSFER_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class TransferService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.account_repo = AccountRepository(session)
        self.tx_repo = TransactionRepository(session)
        self.ledger_repo = LedgerRepository(session)

    async def execute_transfer(
        self,
        idempotency_key: str,
        source_id: uuid.UUID,
        target_id: uuid.UUID,
        amount: Decimal,
        currency: str,
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Ejecución Atómica de Transferencia con Idempotencia en Redis
        y Bloqueo Pesimista en PostgreSQL.
        """
        currency = currency.upper()

        # 1. Chequeo de Idempotencia en Redis
        existing_record = await IdempotencyManager.get_record(idempotency_key)
        if existing_record:
            if existing_record.get("status") == "COMPLETED":
                # Retornar respuesta previa idéntica (cero cobros duplicados)
                return existing_record["status_code"], existing_record["response"]
            elif existing_record.get("status") == "PROCESSING":
                raise TransferError(
                    "Petición en proceso. Espere unos segundos antes de reintentar.",
                    status_code=409,
                    code="IDEMPOTENCY_IN_PROGRESS",
                )

        # 2. Adquirir lock temporal de idempotencia
        locked = await IdempotencyManager.lock_and_start(idempotency_key)
        if not locked:
            raise TransferError(
                "Conflicto de concurrencia en la clave de idempotencia.",
                status_code=409,
                code="IDEMPOTENCY_CONFLICT",
            )

        try:
            async with self.session.begin():
                # 3. Bloqueo Pesimista Anti-Deadlock de Cuentas (SELECT FOR UPDATE)
                source_acc, target_acc = await self.account_repo.get_two_accounts_for_update(
                    source_id, target_id
                )

                if not source_acc:
                    raise TransferError("Cuenta de origen no encontrada.", status_code=404, code="SOURCE_NOT_FOUND")
                if not target_acc:
                    raise TransferError("Cuenta de destino no encontrada.", status_code=404, code="TARGET_NOT_FOUND")

                if not source_acc.is_active:
                    raise TransferError("La cuenta de origen está inactiva.", status_code=400, code="SOURCE_INACTIVE")
                if not target_acc.is_active:
                    raise TransferError("La cuenta de destino está inactiva.", status_code=400, code="TARGET_INACTIVE")

                # 4. Validación de Divisa
                if source_acc.currency != currency or target_acc.currency != currency:
                    raise TransferError(
                        f"Discrepancia de divisas. Operación en {currency}, pero cuentas en {source_acc.currency}/{target_acc.currency}.",
                        status_code=400,
                        code="CURRENCY_MISMATCH",
                    )

                # 5. Validación de Saldo Disponible (Blindaje Anti-Doble Gasto)
                if source_acc.balance < amount:
                    raise TransferError(
                        f"Fondos insuficientes. Saldo disponible: {source_acc.balance} {currency}, requerido: {amount} {currency}.",
                        status_code=400,
                        code="INSUFFICIENT_FUNDS",
                    )

                # 6. Actualización Atómica de Balances
                source_acc.balance -= amount
                target_acc.balance += amount

                # 7. Registrar Transacción Principal
                transaction = await self.tx_repo.create(
                    idempotency_key=idempotency_key,
                    source_account_id=source_id,
                    target_account_id=target_id,
                    amount=amount,
                    currency=currency,
                    status=TransactionStatus.COMPLETED,
                )

                # 8. Asientos Contables de Doble Partida (Double-Entry Bookkeeping)
                # Asiento Débito (Salida en origen)
                await self.ledger_repo.record_entry(
                    transaction_id=transaction.id,
                    account_id=source_id,
                    entry_type=LedgerEntryType.DEBIT,
                    amount=amount,
                    balance_after=source_acc.balance,
                )

                # Asiento Crédito (Entrada en destino)
                await self.ledger_repo.record_entry(
                    transaction_id=transaction.id,
                    account_id=target_id,
                    entry_type=LedgerEntryType.CREDIT,
                    amount=amount,
                    balance_after=target_acc.balance,
                )

                response_payload = {
                    "id": str(transaction.id),
                    "idempotency_key": idempotency_key,
                    "source_account_id": str(source_id),
                    "target_account_id": str(target_id),
                    "amount": str(amount),
                    "currency": currency,
                    "status": TransactionStatus.COMPLETED.value,
                    "source_balance_after": str(source_acc.balance),
                    "target_balance_after": str(target_acc.balance),
                    "created_at": transaction.created_at.isoformat(),
                }

            # 9. Guardar resultado exitoso en Redis para idempotencia futura
            await IdempotencyManager.save_result(idempotency_key, 201, response_payload)
            return 201, response_payload

        except TransferError as te:
            # Liberar lock de Redis para que el usuario pueda corregir datos y reintentar si fue 400
            await IdempotencyManager.release_lock(idempotency_key)
            raise te
        except Exception as e:
            await IdempotencyManager.release_lock(idempotency_key)
            raise TransferError(f"Error inesperado al procesar la transferencia: {str(e)}", status_code=500)
