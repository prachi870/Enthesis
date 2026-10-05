"""Optional authentication - allows access without token for development"""
from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from .auth import decode_token

security = HTTPBearer(auto_error=False)  # Don't error if no token


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        token_data = decode_token(token)
        user = db.query(User).filter(User.username == token_data.username).first()
        return user if user and user.is_active else None
    except:
        return None


async def get_current_active_user_optional(
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Optional[User]:
    """Get current active user, or None if not authenticated"""
    return current_user
