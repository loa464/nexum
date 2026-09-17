from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.redis import get_redis_client
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health check del sistema")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "unhealthy"
    redis_status = "unhealthy"
    
    # Verificar PostgreSQL
    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() == 1:
            db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Verificar Redis
    try:
        client = await get_redis_client()
        pong = await client.ping()
        if pong:
            redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"

    overall_status = "healthy" if (db_status == "healthy" and redis_status == "healthy") else "degraded"
    http_status = status.HTTP_200_OK if overall_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={
            "status": overall_status,
            "version": settings.APP_VERSION,
            "services": {
                "database": db_status,
                "redis": redis_status,
            }
        }
    )
