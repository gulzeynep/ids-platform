import os
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

import secrets 

from jose import JWTError, jwt 

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.database import get_db
from src.models import User
from src.core import security 
from src.core.security import get_password_hash
from src.schemas import UserDisplay, UserCreate, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl= "auth/token")
SECRET_KEY= os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str =payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.usesrname == username))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
    return user 

async def get_current_admin_user(current_user:User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail= "Admin Privileges Required")
    return current_user 

async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.username == user.username) | (User.email == user.email)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    new_user = User(
        username = user.username,
        email = user.email,
        hashed_password = get_password_hash(user.password),
        full_name= user.full_name,
        company_name = user.company_name,
        role = "analyst" #default
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_current_developer(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["developer", "admin"]:
        raise HTTPException(status_code=403, detail="Developer or Admin Privileges Required")
    return current_user

@router.post("/register")
async def register(username: str, password: str, db:AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username ==username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="This user already exists")
    generated_api_key = f"ids_{secrets.token_hex(16)}"
    hashed_pw = security.get_password_hash(password)
    new_user = User(username=username, 
                    hashed_password=hashed_pw,
                    api_key = generated_api_key,
                    role = "analyst" #default
                    )
    db.add(new_user)
    await db.commit()
    return {"message": "Registered successfuly", 
            "your_api_key": generated_api_key}

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "Wrong username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub":user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserDisplay)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me/update", response_model=UserUpdate)
async def update_profile(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)

        await db.commit()
        await db.refresh(current_user)
        return current_user 
