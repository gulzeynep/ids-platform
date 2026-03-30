from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database import get_db
from src.models import User
from src.core import security 

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register(username: str, password: str, db:AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username ==username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="This user already exists")
    hashed_pw = security.get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_pw)
    db.add(new_user)
    await db.commit()
    return {"message": "Registered successfuly"}

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