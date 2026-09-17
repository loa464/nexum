import asyncio
import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_high_concurrency_double_spending_protection(async_client: AsyncClient):
    """
    Stress test de alta concurrencia:
    Cuenta A inicia con 1000.00 USD.
    Se disparan 50 peticiones concurrentes de 25.00 USD (total demandado: 1250.00 USD).
    Garantía esperada:
    - Exactamente 40 peticiones exitosas (40 * 25 = 1000).
    - Exactamente 10 peticiones rechazadas con INSUFFICIENT_FUNDS.
    - Saldo final de Cuenta A: EXACTAMENTE 0.0000 USD (cero balance negativo).
    - Saldo final de Cuenta B: EXACTAMENTE 1000.0000 USD.
    - Conciliación contable intacta.
    """
    # 1. Crear cuentas
    acc_a = (await async_client.post("/api/v1/accounts", json={
        "owner_name": "Stress Source",
        "initial_balance": "1000.0000",
        "currency": "USD"
    })).json()

    acc_b = (await async_client.post("/api/v1/accounts", json={
        "owner_name": "Stress Target",
        "initial_balance": "0.0000",
        "currency": "USD"
    })).json()

    source_id = acc_a["id"]
    target_id = acc_b["id"]

    # 2. Definir función de transferencia individual con su propia clave de idempotencia
    async def make_transfer(idx: int):
        idempotency_key = f"stress-transfer-{uuid.uuid4()}-{idx}"
        payload = {
            "source_account_id": source_id,
            "target_account_id": target_id,
            "amount": "25.0000",
            "currency": "USD",
        }
        headers = {"X-Idempotency-Key": idempotency_key}
        return await async_client.post("/api/v1/transfers", json=payload, headers=headers)

    # 3. Lanzar 50 peticiones simultáneas usando asyncio.gather
    tasks = [make_transfer(i) for i in range(50)]
    responses = await asyncio.gather(*tasks)

    # 4. Analizar códigos de respuesta
    status_codes = [r.status_code for r in responses]
    success_count = status_codes.count(201)
    failed_count = status_codes.count(400)

    assert success_count == 40, f"Se esperaban 40 éxitos, pero hubieron {success_count}"
    assert failed_count == 10, f"Se esperaban 10 rechazos por fondos insuficientes, pero hubieron {failed_count}"

    # 5. Verificar consistencia matemática en cuentas
    final_a = (await async_client.get(f"/api/v1/accounts/{source_id}")).json()
    final_b = (await async_client.get(f"/api/v1/accounts/{target_id}")).json()

    assert Decimal(final_a["balance"]) == Decimal("0.0000")
    assert Decimal(final_b["balance"]) == Decimal("1000.0000")

    # 6. Auditar conciliación de libro mayor
    rec_a = (await async_client.get(f"/api/v1/reconciliation/{source_id}")).json()
    rec_b = (await async_client.get(f"/api/v1/reconciliation/{target_id}")).json()

    assert rec_a["is_reconciled"] is True
    assert rec_b["is_reconciled"] is True
    assert Decimal(rec_a["discrepancy"]) == Decimal("0.0000")
    assert Decimal(rec_b["discrepancy"]) == Decimal("0.0000")


@pytest.mark.asyncio
async def test_bidirectional_concurrency_anti_deadlock(async_client: AsyncClient):
    """
    Test Anti-Deadlock Bidireccional:
    Cuenta X e Y ambas inician con 500.00 USD.
    Simultáneamente:
    - 20 peticiones envían fondos de X -> Y
    - 20 peticiones envían fondos de Y -> X
    Total de 40 transferencias concurrentes cruzadas.
    Garantía:
    - Ordenamiento determinista de UUIDs evita deadlocks circulares en PostgreSQL.
    - Las 40 transacciones completan con éxito.
    """
    acc_x = (await async_client.post("/api/v1/accounts", json={
        "owner_name": "Deadlock User X",
        "initial_balance": "500.0000",
        "currency": "USD"
    })).json()

    acc_y = (await async_client.post("/api/v1/accounts", json={
        "owner_name": "Deadlock User Y",
        "initial_balance": "500.0000",
        "currency": "USD"
    })).json()

    id_x = acc_x["id"]
    id_y = acc_y["id"]

    async def transfer_x_to_y(idx: int):
        return await async_client.post(
            "/api/v1/transfers",
            json={"source_account_id": id_x, "target_account_id": id_y, "amount": "5.0000", "currency": "USD"},
            headers={"X-Idempotency-Key": f"x2y-{uuid.uuid4()}-{idx}"},
        )

    async def transfer_y_to_x(idx: int):
        return await async_client.post(
            "/api/v1/transfers",
            json={"source_account_id": id_y, "target_account_id": id_x, "amount": "5.0000", "currency": "USD"},
            headers={"X-Idempotency-Key": f"y2x-{uuid.uuid4()}-{idx}"},
        )

    tasks = []
    for i in range(20):
        tasks.append(transfer_x_to_y(i))
        tasks.append(transfer_y_to_x(i))

    responses = await asyncio.gather(*tasks)

    # Todas deben ser 201 Created (sin deadlock 400 o 500)
    status_codes = [r.status_code for r in responses]
    assert status_codes.count(201) == 40

    # Ambos deben terminar con el mismo balance original (500 - 100 + 100 = 500)
    final_x = (await async_client.get(f"/api/v1/accounts/{id_x}")).json()
    final_y = (await async_client.get(f"/api/v1/accounts/{id_y}")).json()

    assert Decimal(final_x["balance"]) == Decimal("500.0000")
    assert Decimal(final_y["balance"]) == Decimal("500.0000")
