import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User

# ==========================================
# SECURITY CONFIGURATION
# ==========================================
# In production, this should be in your .env file
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-wids-platform")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Token is valid for 7 days

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tells FastAPI where the client should go to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ==========================================
# CORE SECURITY FUNCTIONS
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the provided password matches the hashed password in DB."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plaintext password for secure storage."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure JWT token for the authenticated user."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Dependency that intercepts the JWT token from the request headers,
    decodes it, and returns the User object from the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Token may be expired or invalid.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Fetch user from database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user