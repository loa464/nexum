import json
from typing import Optional, Any
import redis.asyncio as aioredis
from app.core.config import settings

# Pool de conexiones Redis
redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.get_redis_url(),
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def close_redis_client():
    global redis_client
    if redis_client is not None:
        try:
            await redis_client.aclose()
        except Exception:
            pass
        redis_client = None


class IdempotencyManager:
    @staticmethod
    async def get_record(key: str) -> Optional[dict[str, Any]]:
        client = await get_redis_client()
        data = await client.get(f"idempotency:{key}")
        if data:
            return json.loads(data)
        return None

    @staticmethod
    async def lock_and_start(key: str) -> bool:
        """
        Intenta adquirir un bloqueo para la clave.
        Retorna True si la clave es nueva y se inició el procesamiento.
        Retorna False si la clave ya está en proceso o ya fue completada.
        """
        client = await get_redis_client()
        payload = json.dumps({"status": "PROCESSING"})
        # SET NX: Solo establece el valor si NO existe
        acquired = await client.set(
            f"idempotency:{key}",
            payload,
            nx=True,
            ex=settings.IDEMPOTENCY_EXPIRATION_SECONDS,
        )
        return bool(acquired)

    @staticmethod
    async def save_result(key: str, status_code: int, response_data: dict[str, Any]):
        client = await get_redis_client()
        payload = json.dumps({
            "status": "COMPLETED",
            "status_code": status_code,
            "response": response_data,
        })
        await client.set(
            f"idempotency:{key}",
            payload,
            ex=settings.IDEMPOTENCY_EXPIRATION_SECONDS,
        )

    @staticmethod
    async def release_lock(key: str):
        """En caso de error inesperado, libera la clave para permitir reintento."""
        client = await get_redis_client()
        await client.delete(f"idempotency:{key}")
