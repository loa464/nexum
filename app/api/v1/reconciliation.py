import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.reconciliation_service import ReconciliationService
from app.schemas.ledger import ReconciliationReport

router = APIRouter()


@router.get("/{account_id}", response_model=ReconciliationReport, summary="Auditar y conciliar balance contable de una cuenta")
async def reconcile_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ReconciliationService(db)
    report = await service.reconcile_account(account_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta con ID '{account_id}' no encontrada.",
        )
    return report
