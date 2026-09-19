import urllib.parse
import urllib.request
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    FRONTEND_URL
)
from ..models import User, AuditEvent
from ..schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse
)
from ..security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()

    # Check for existing account (both case-insensitive func.lower and direct match)
    existing = db.query(User).filter(
        (func.lower(User.email) == clean_email) | (User.email == clean_email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in or use Google."
        )

    # Hash password with PBKDF2-HMAC-SHA256 (normalized stripped password)
    clean_password = payload.password.strip()
    pwd_hash = get_password_hash(clean_password)

    user = User(
        name=payload.name.strip(),
        email=clean_email,
        password_hash=pwd_hash,
        organization_name=payload.organization_name.strip(),
        phone=payload.phone.strip(),
        role="Risk Underwriter"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit event
    audit = AuditEvent(
        user_id=user.id,
        event_type="USER_REGISTERED",
        description=f"New user registered: {user.email} ({user.organization_name})",
        user_email=user.email
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            organization_name=user.organization_name,
            phone=user.phone,
            avatar_url=user.avatar_url
        )
    )

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    clean_email = creds.email.strip().lower()

    # Lookup user with dual matching
    user = db.query(User).filter(
        (func.lower(User.email) == clean_email) | (User.email == clean_email)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify credentials."
        )

    if not user.password_hash and user.google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was registered using Google Sign-In. Please click 'Continue with Google'."
        )

    # Verify password against PBKDF2 hash (supports both exact and stripped password inputs)
    if not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify credentials."
        )

    # Log audit event
    audit = AuditEvent(
        user_id=user.id,
        event_type="LOGIN_SUCCESS",
        description=f"User {user.email} signed in",
        user_email=user.email
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            organization_name=user.organization_name,
            phone=user.phone,
            avatar_url=user.avatar_url
        )
    )

@router.get("/google/url")
def get_google_auth_url():
    """
    Returns Google OAuth 2.0 authorization URL or configuration status.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return {
            "configured": False,
            "message": "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
            "url": None
        }

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return {
        "configured": True,
        "url": auth_url
    }

@router.get("/google/callback")
def google_oauth_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Handles Google OAuth 2.0 authorization code exchange, profile retrieval,
    account linking, and JWT token redirection to the frontend.
    """
    if error or not code:
        err_msg = error or "Authorization code missing"
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={urllib.parse.quote(err_msg)}")

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error={urllib.parse.quote('Google OAuth credentials not configured on server')}"
        )

    try:
        # Exchange code for token
        token_data = urllib.parse.urlencode({
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req) as resp:
            token_res = json.loads(resp.read().decode("utf-8"))

        access_token = token_res.get("access_token")
        if not access_token:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=TokenExchangeFailed")

        # Fetch verified Google user info
        user_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        with urllib.request.urlopen(user_req) as user_resp:
            google_user = json.loads(user_resp.read().decode("utf-8"))

        google_email = google_user.get("email", "").strip().lower()
        google_id = google_user.get("sub")
        google_name = google_user.get("name", "Google User")
        avatar_url = google_user.get("picture")

        if not google_email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=NoEmailFromGoogle")

        # Account linking: Find existing user by email or google_id
        user = db.query(User).filter(
            (func.lower(User.email) == google_email) | (User.google_id == google_id)
        ).first()

        if user:
            # Link Google ID if not already linked
            if not user.google_id:
                user.google_id = google_id
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            db.commit()
        else:
            # First-time Google registration: create fresh user
            user = User(
                name=google_name,
                email=google_email,
                google_id=google_id,
                avatar_url=avatar_url,
                organization_name="Enterprise Lending",
                role="Risk Underwriter"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Log audit event
        audit = AuditEvent(
            user_id=user.id,
            event_type="GOOGLE_AUTH_SUCCESS",
            description=f"User authenticated via Google OAuth: {user.email}",
            user_email=user.email
        )
        db.add(audit)
        db.commit()

        # Issue TrustLedger session JWT
        jwt_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})

        # Redirect to frontend callback route with token
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")

    except Exception as exc:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={urllib.parse.quote(str(exc))}")

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="LOGOUT",
        description=f"User {current_user.email} logged out",
        user_email=current_user.email
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_name=current_user.organization_name,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url
    )
