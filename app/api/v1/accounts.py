import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.account_service import AccountService
from app.repositories.ledger_repo import LedgerRepository
from app.schemas.account import AccountCreate, AccountResponse
from app.schemas.ledger import LedgerEntryResponse

router = APIRouter()


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED, summary="Crear cuenta contable")
async def create_account(
    payload: AccountCreate,
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    account = await service.create_account(
        owner_name=payload.owner_name,
        initial_balance=payload.initial_balance,
        currency=payload.currency.upper(),
    )
    return account


@router.get("/{account_id}", response_model=AccountResponse, summary="Consultar cuenta por UUID")
async def get_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    account = await service.get_account(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta con ID '{account_id}' no encontrada.",
        )
    return account


@router.get("/by-number/{account_number}", response_model=AccountResponse, summary="Consultar cuenta por número")
async def get_account_by_number(
    account_number: str,
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    account = await service.get_by_number(account_number)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta número '{account_number}' no encontrada.",
        )
    return account


@router.get("/{account_id}/ledger", response_model=List[LedgerEntryResponse], summary="Consultar asientos del libro mayor")
async def get_account_ledger(
    account_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    service = AccountService(db)
    account = await service.get_account(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta con ID '{account_id}' no encontrada.",
        )
    
    ledger_repo = LedgerRepository(db)
    entries = await ledger_repo.get_by_account(account_id, limit=limit, offset=offset)
    return entries
