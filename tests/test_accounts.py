import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_account(async_client: AsyncClient):
    payload = {
        "owner_name": "Jahn Loa",
        "initial_balance": "1000.0000",
        "currency": "USD",
    }
    response = await async_client.post("/api/v1/accounts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["owner_name"] == "Jahn Loa"
    assert data["balance"] == "1000.0000"
    assert data["currency"] == "USD"
    assert "account_number" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_create_account_negative_balance_fails(async_client: AsyncClient):
    payload = {
        "owner_name": "Hacker",
        "initial_balance": "-50.0000",
        "currency": "USD",
    }
    response = await async_client.post("/api/v1/accounts", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_account_by_id(async_client: AsyncClient):
    # Crear cuenta primero
    payload = {
        "owner_name": "Carlos Mendoza",
        "initial_balance": "500.0000",
        "currency": "USD",
    }
    create_res = await async_client.post("/api/v1/accounts", json=payload)
    assert create_res.status_code == 201
    acc_id = create_res.json()["id"]

    # Consultar por ID
    get_res = await async_client.get(f"/api/v1/accounts/{acc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == acc_id
    assert get_res.json()["owner_name"] == "Carlos Mendoza"


@pytest.mark.asyncio
async def test_account_initial_ledger_entry(async_client: AsyncClient):
    payload = {
        "owner_name": "Ledger Test User",
        "initial_balance": "750.5000",
        "currency": "USD",
    }
    create_res = await async_client.post("/api/v1/accounts", json=payload)
    acc_id = create_res.json()["id"]

    # Consultar libro mayor
    ledger_res = await async_client.get(f"/api/v1/accounts/{acc_id}/ledger")
    assert ledger_res.status_code == 200
    entries = ledger_res.json()
    assert len(entries) == 1
    assert entries[0]["entry_type"] == "CREDIT"
    assert entries[0]["amount"] == "750.5000"
