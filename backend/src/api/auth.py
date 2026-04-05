import os, secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.src.database import get_db
from backend.src.models import User, Company
from backend.src.core import security
from backend.src.schemas import UserCreate

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        email: str = payload.get("sub") 
        if email is None: raise credentials_exception
    except JWTError: raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None: raise credentials_exception
    return user

@router.post("/register")
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Şirket var mı kontrol et, yoksa oluştur
    company_query = await db.execute(select(Company).where(Company.name == user_in.company_name))
    company = company_query.scalars().first()
    
    if not company:
        company = Company(name=user_in.company_name)
        db.add(company)
        await db.commit()
        await db.refresh(company)

    # 2. Kullanıcı var mı kontrol et
    user_query = await db.execute(select(User).where((User.email == user_in.email) | (User.username == user_in.username)))
    if user_query.scalars().first():
        raise HTTPException(status_code=400, detail="Bu email veya kullanıcı adı zaten kayıtlı.")

    # 3. Yeni kullanıcıyı şirkete bağlayarak oluştur
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        company_id=company.id, # BURASI KRİTİK: Şirkete bağladık
        api_key=f"ids_{secrets.token_hex(16)}",
        is_admin=False 
    )
    db.add(new_user)
    await db.commit()
    return {"message": "Kayıt başarılı", "api_key": new_user.api_key}


@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ÇÖZÜLEN KISIM BURASI: Şirket adını ID üzerinden çekiyoruz
@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db) 
):
    # Kullanıcının şirket ismini veritabanından bul
    company_name = "Bilinmeyen Şirket"
    if current_user.company_id:
        company_query = await db.execute(select(Company).where(Company.id == current_user.company_id))
        company = company_query.scalars().first()
        if company:
            company_name = company.name

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "role": current_user.role,
        "company_name": company_name
    }