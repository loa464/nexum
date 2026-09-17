import pytest_asyncio
from httpx import AsyncClient

BASE_URL = "http://127.0.0.1:8000"


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client
