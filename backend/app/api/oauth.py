"""OAuth authentication endpoints for Google and GitHub"""
import secrets
import re
from datetime import timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.auth import Token, UserResponse
from ..services.auth import hash_password, create_access_token
from ..config import settings

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])


class OAuthCallbackRequest(BaseModel):
    code: str
    provider: str  # 'google' or 'github'


def _oauth_username(db: Session, email: str) -> str:
    """Generate a unique username from email"""
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


async def exchange_google_code(code: str) -> dict:
    """Exchange Google authorization code for user info"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )
    
    # Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        token_response = await client.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )
        
        token_json = token_response.json()
        access_token = token_json.get("access_token")
        
        # Get user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        return userinfo_response.json()


async def exchange_github_code(code: str) -> dict:
    """Exchange GitHub authorization code for user info"""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
        )
    
    # Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "code": code,
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "redirect_uri": settings.OAUTH_REDIRECT_URI
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        token_response = await client.post(
            token_url,
            data=token_data,
            headers={"Accept": "application/json"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )
        
        token_json = token_response.json()
        access_token = token_json.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        user_data = user_response.json()
        
        # Get user email (GitHub requires a separate API call)
        email_response = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        
        if email_response.status_code == 200:
            emails = email_response.json()
            # Get primary verified email
            primary_email = next(
                (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                None
            )
            if primary_email:
                user_data["email"] = primary_email
        
        return user_data


@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth login"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.OAUTH_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline&"
        f"state=google"
    )
    return {"url": google_auth_url}


@router.get("/github/login")
async def github_login():
    """Redirect to GitHub OAuth login"""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured"
        )
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.GITHUB_CLIENT_ID}&"
        f"redirect_uri={settings.OAUTH_REDIRECT_URI}&"
        f"scope=user:email&"
        f"state=github"
    )
    return {"url": github_auth_url}


@router.post("/callback", response_model=Token)
async def oauth_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback and create/login user"""
    
    # Exchange code for user info based on provider
    if request.provider == "google":
        user_info = await exchange_google_code(request.code)
        email = user_info.get("email")
        name = user_info.get("name")
        verified = user_info.get("verified_email", False)
    elif request.provider == "github":
        user_info = await exchange_github_code(request.code)
        email = user_info.get("email")
        name = user_info.get("name") or user_info.get("login")
        verified = True  # GitHub emails from API are verified
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported OAuth provider"
        )
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by OAuth provider"
        )
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified by OAuth provider"
        )
    
    # Normalize email
    normalized_email = email.strip().lower()
    
    # Find or create user
    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == normalized_email
    ).first()
    
    if user is None:
        # Create new user
        user = User(
            email=normalized_email,
            username=_oauth_username(db, normalized_email),
            full_name=name.strip() if name and name.strip() else None,
            hashed_password=hash_password(secrets.token_urlsafe(32)),  # Random password
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
                    detail="Unable to create user account"
                )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
