from datetime import datetime
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    timestamp: datetime = datetime.now()


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: str
    detail: Optional[str] = None
