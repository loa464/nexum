from decimal import Decimal
import enum
import uuid
from sqlalchemy import Numeric, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class LedgerEntryType(str, enum.Enum):
    DEBIT = "DEBIT"    # Salida de dinero (-)
    CREDIT = "CREDIT"  # Entrada de dinero (+)


class LedgerEntry(BaseModel):
    __tablename__ = "ledger_entries"

    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entry_type: Mapped[LedgerEntryType] = mapped_column(
        SQLEnum(LedgerEntryType, native_enum=False),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        nullable=False,
    )
    balance_after: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        nullable=False,
    )

    # Relaciones
    transaction = relationship("Transaction", back_populates="ledger_entries")
    account = relationship("Account", back_populates="ledger_entries")
