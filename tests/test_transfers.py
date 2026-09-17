import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_successful_transfer(async_client: AsyncClient):
    # Crear dos cuentas
    acc_a = (await async_client.post("/api/v1/accounts", json={"owner_name": "Alice", "initial_balance": "100.0000", "currency": "USD"})).json()
    acc_b = (await async_client.post("/api/v1/accounts", json={"owner_name": "Bob", "initial_balance": "50.0000", "currency": "USD"})).json()

    # Transferir 40 de Alice a Bob
    idempotency_key = str(uuid.uuid4())
    transfer_payload = {
        "source_account_id": acc_a["id"],
        "target_account_id": acc_b["id"],
        "amount": "40.0000",
        "currency": "USD",
    }
    headers = {"X-Idempotency-Key": idempotency_key}

    res = await async_client.post("/api/v1/transfers", json=transfer_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["source_balance_after"] == "60.0000"
    assert data["target_balance_after"] == "90.0000"

    # Verificar balance final en la DB
    res_a = (await async_client.get(f"/api/v1/accounts/{acc_a['id']}")).json()
    res_b = (await async_client.get(f"/api/v1/accounts/{acc_b['id']}")).json()
    assert res_a["balance"] == "60.0000"
    assert res_b["balance"] == "90.0000"

    # Verificar conciliación contable
    rec_a = (await async_client.get(f"/api/v1/reconciliation/{acc_a['id']}")).json()
    rec_b = (await async_client.get(f"/api/v1/reconciliation/{acc_b['id']}")).json()
    assert rec_a["is_reconciled"] is True
    assert rec_b["is_reconciled"] is True


@pytest.mark.asyncio
async def test_transfer_insufficient_funds(async_client: AsyncClient):
    acc_a = (await async_client.post("/api/v1/accounts", json={"owner_name": "Poor User", "initial_balance": "10.0000", "currency": "USD"})).json()
    acc_b = (await async_client.post("/api/v1/accounts", json={"owner_name": "Target", "initial_balance": "0.0000", "currency": "USD"})).json()

    transfer_payload = {
        "source_account_id": acc_a["id"],
        "target_account_id": acc_b["id"],
        "amount": "100.0000",
        "currency": "USD",
    }
    headers = {"X-Idempotency-Key": str(uuid.uuid4())}

    res = await async_client.post("/api/v1/transfers", json=transfer_payload, headers=headers)
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "INSUFFICIENT_FUNDS"


@pytest.mark.asyncio
async def test_transfer_same_account_fails(async_client: AsyncClient):
    acc_id = str(uuid.uuid4())
    transfer_payload = {
        "source_account_id": acc_id,
        "target_account_id": acc_id,
        "amount": "10.0000",
        "currency": "USD",
    }
    headers = {"X-Idempotency-Key": str(uuid.uuid4())}

    res = await async_client.post("/api/v1/transfers", json=transfer_payload, headers=headers)
    assert res.status_code == 422
