import os
import hashlib
import binascii
import hmac
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from .database import get_db
from .models import User

security_scheme = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """
    Cryptographically secure password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Format: iterations$salt$hash
    """
    salt = os.urandom(16)
    salt_hex = binascii.hexlify(salt).decode('utf-8')
    iterations = 100000
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    hash_hex = binascii.hexlify(pwd_hash).decode('utf-8')
    return f"{iterations}${salt_hex}${hash_hex}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """
    Verifies plain password against PBKDF2-HMAC-SHA256 stored hash.
    Safe against timing attacks, whitespace edge cases, and casing differences.
    """
    if not stored_hash or not plain_password:
        return False
    try:
        clean_stored_hash = stored_hash.strip()
        parts = clean_stored_hash.split('$')
        if len(parts) == 3:
            iterations = int(parts[0])
            salt = binascii.unhexlify(parts[1])
            expected_hash = parts[2].lower()

            # 1. Check exact password
            computed = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
            computed_hex = binascii.hexlify(computed).decode('utf-8').lower()
            if hmac.compare_digest(computed_hex, expected_hash):
                return True

            # 2. Check stripped password fallback (handles mobile autofill/copy-paste spaces)
            if plain_password.strip() != plain_password:
                computed_stripped = hashlib.pbkdf2_hmac('sha256', plain_password.strip().encode('utf-8'), salt, iterations)
                computed_stripped_hex = binascii.hexlify(computed_stripped).decode('utf-8').lower()
                if hmac.compare_digest(computed_stripped_hex, expected_hash):
                    return True
            return False

        # Fallback for legacy hashes
        legacy_hash = hashlib.sha256(f"trustledger_enterprise_salt_{plain_password}".encode("utf-8")).hexdigest()
        if hmac.compare_digest(legacy_hash, clean_stored_hash):
            return True
        if plain_password.strip() != plain_password:
            legacy_hash_stripped = hashlib.sha256(f"trustledger_enterprise_salt_{plain_password.strip()}".encode("utf-8")).hexdigest()
            if hmac.compare_digest(legacy_hash_stripped, clean_stored_hash):
                return True
        return False
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session expired or invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Look up by ID first, then by email
    user = db.query(User).filter((User.id == user_id) | (User.email == user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
