from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.reconciliation import router as reconciliation_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(accounts_router, prefix="/accounts", tags=["Accounts"])
api_v1_router.include_router(transfers_router, prefix="/transfers", tags=["Transfers"])
api_v1_router.include_router(reconciliation_router, prefix="/reconciliation", tags=["Reconciliation"])
