import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_idempotency_prevents_duplicate_charge(async_client: AsyncClient):
    acc_a = (await async_client.post("/api/v1/accounts", json={"owner_name": "Idem Source", "initial_balance": "200.0000", "currency": "USD"})).json()
    acc_b = (await async_client.post("/api/v1/accounts", json={"owner_name": "Idem Target", "initial_balance": "50.0000", "currency": "USD"})).json()

    shared_key = f"idem-key-{uuid.uuid4()}"
    transfer_payload = {
        "source_account_id": acc_a["id"],
        "target_account_id": acc_b["id"],
        "amount": "50.0000",
        "currency": "USD",
    }
    headers = {"X-Idempotency-Key": shared_key}

    # Primera petición
    res1 = await async_client.post("/api/v1/transfers", json=transfer_payload, headers=headers)
    assert res1.status_code == 201
    data1 = res1.json()

    # Segunda petición con la misma idempotency key (simulando reintento por timeout de red)
    res2 = await async_client.post("/api/v1/transfers", json=transfer_payload, headers=headers)
    assert res2.status_code == 201
    data2 = res2.json()

    # Los IDs y balances devueltos deben ser idénticos
    assert data1["id"] == data2["id"]
    assert data1["source_balance_after"] == data2["source_balance_after"]

    # Verificar que el balance de la cuenta solo se redujo UNA vez ($200 - $50 = $150, NO $100)
    acc_a_final = (await async_client.get(f"/api/v1/accounts/{acc_a['id']}")).json()
    assert acc_a_final["balance"] == "150.0000"

    acc_b_final = (await async_client.get(f"/api/v1/accounts/{acc_b['id']}")).json()
    assert acc_b_final["balance"] == "100.0000"
