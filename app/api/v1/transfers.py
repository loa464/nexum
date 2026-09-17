import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.transfer_service import TransferService, TransferError
from app.repositories.transaction_repo import TransactionRepository
from app.schemas.transfer import TransferCreate, TransferResponse

router = APIRouter()


@router.post("", summary="Ejecutar transferencia monetaria atómica con idempotencia")
async def execute_transfer(
    payload: TransferCreate,
    x_idempotency_key: str = Header(
        ...,
        alias="X-Idempotency-Key",
        description="Clave única UUID/hash que previene transferencias duplicadas",
    ),
    db: AsyncSession = Depends(get_db),
):
    service = TransferService(db)
    try:
        status_code, result = await service.execute_transfer(
            idempotency_key=x_idempotency_key.strip(),
            source_id=payload.source_account_id,
            target_id=payload.target_account_id,
            amount=payload.amount,
            currency=payload.currency,
        )
        return JSONResponse(status_code=status_code, content=result)
    except TransferError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"message": e.message, "code": e.code},
        )


@router.get("/{transfer_id}", response_model=TransferResponse, summary="Consultar estado de transacción por ID")
async def get_transfer(
    transfer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    repo = TransactionRepository(db)
    tx = await repo.get_by_id(transfer_id)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transacción con ID '{transfer_id}' no encontrada.",
        )
    return tx
