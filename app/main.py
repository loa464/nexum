import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import get_redis_client, close_redis_client
import app.models  # Carga todos los modelos para Base.metadata
from app.api.v1.router import api_v1_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexum")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Iniciando Nexum Ledger Core Engine...")
    
    # Crear tablas automáticamente en PostgreSQL si no existen
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Esquemas de base de datos inicializados correctamente.")
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {e}")
    
    # Inicializar conexión a Redis
    try:
        redis_client = await get_redis_client()
        await redis_client.ping()
        logger.info("Conexión con Redis establecida con éxito.")
    except Exception as e:
        logger.warning(f"No se pudo conectar inmediatamente a Redis: {e}")

    yield

    # --- Shutdown ---
    logger.info("Cerrando conexiones de Nexum...")
    await close_redis_client()
    await engine.dispose()
    logger.info("Nexum apagado correctamente.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Motor de contabilidad de doble partida (Double-Entry Ledger) de alta concurrencia, "
        "con consistencia ACID estricta en PostgreSQL, idempotencia distribuida en Redis "
        "y prevención de condiciones de carrera y deadlocks."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler para errores inesperados
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Excepción no controlada en {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "Error interno del servidor.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )


# Incluir Router v1
app.include_router(api_v1_router, prefix="/api/v1")

# Montar archivos estáticos para la consola web interactiva
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", tags=["Console"], summary="Consola visual interactiva de Nexum")
async def console_root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/api", tags=["Root"])
async def api_info():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
