"""Authentication API endpoints"""
from datetime import timedelta
import secrets
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserCreate, UserLogin, UserResponse, Token
from ..services.auth import (
    hash_password,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    normalize_identifier,
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])


class OAuthExchangeRequest(BaseModel):
    access_token: str


def _oauth_username(db: Session, email: str) -> str:
    base = re.sub(r"[^a-z0-9._-]+", "", email.partition("@")[0].lower()).strip("._-")
    if len(base) < 3:
        base = f"user-{base or 'account'}"
    base = base[:41]
    username = base
    while db.query(User).filter(
        func.lower(func.trim(User.username)) == username.lower()
    ).first():
        username = f"{base[:41]}-{secrets.token_hex(4)}"
    return username


@router.post("/oauth/exchange", response_model=Token)
async def exchange_oauth_token(
    request: OAuthExchangeRequest,
    db: Session = Depends(get_db),
):
    """Verify a Supabase identity and issue an Enthesis API token."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth sign-in is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
        )

    try:
        supabase_url = httpx.URL(settings.SUPABASE_URL.strip())
    except httpx.InvalidURL as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_URL must be a complete HTTP or HTTPS URL.",
        ) from error
    if supabase_url.scheme not in {"http", "https"} or not supabase_url.host:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_URL must be a complete HTTP or HTTPS URL.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{str(supabase_url).rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {request.access_token}",
                },
            )
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to verify the OAuth identity with Supabase.",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase rejected the OAuth session. Please sign in again.",
        )

    identity = response.json()
    email = identity.get("email")
    if not isinstance(email, str) or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The OAuth provider did not provide an email address.",
        )
    if not (identity.get("email_confirmed_at") or identity.get("confirmed_at")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email with the OAuth provider before continuing.",
        )

    normalized_email = email.strip().lower()
    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()
    if user is None:
        metadata = identity.get("user_metadata") or {}
        if not isinstance(metadata, dict):
            metadata = {}
        full_name = metadata.get("full_name") or metadata.get("name")
        user = User(
            email=normalized_email,
            username=_oauth_username(db, normalized_email),
            full_name=full_name.strip() if isinstance(full_name, str) and full_name.strip() else None,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(
                func.lower(func.trim(User.email)) == normalized_email
            ).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Unable to create the local account for this OAuth identity.",
                )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    normalized_email = user_data.email.strip().lower()
    normalized_username = normalize_identifier(user_data.username)
    safe_username = re.sub(r"[^a-z0-9._-]+", "", normalized_username)

    if not safe_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must contain at least one letter or number"
        )

    existing_user = db.query(User).filter(
        func.lower(func.trim(User.username)) == safe_username
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    existing_email = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=normalized_email,
        username=safe_username,
        full_name=(user_data.full_name or '').strip() or None,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token."""
    user = authenticate_user(
        db,
        credentials.username.strip(),
        credentials.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user (client should delete token)"""
    return {"message": "Successfully logged out"}
