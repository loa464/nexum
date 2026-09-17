from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class Account(BaseModel):
    __tablename__ = "accounts"
    __table_args__ = (
        CheckConstraint("balance >= 0", name="check_account_balance_non_negative"),
    )

    account_number: Mapped[str] = mapped_column(
        String(34),
        unique=True,
        index=True,
        nullable=False,
    )
    owner_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        default=Decimal("0.0000"),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="USD",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relaciones contables
    ledger_entries = relationship("LedgerEntry", back_populates="account", cascade="all, delete-orphan")
