import os, secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.src.database import get_db
from backend.src.models import User, Company
from backend.src.core import security
from backend.src.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --- KİMLİK KONTROL (KAPI GÖREVLİSİ) ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token'ı çöz ve içindeki email'i al
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "super_gizli_jwt_anahtari"), algorithms=[os.getenv("ALGORITHM", "HS256")])
        email: str = payload.get("sub") 
        if email is None: 
            raise credentials_exception
    except JWTError: 
        raise credentials_exception
    
    # DB'den kullanıcıyı bul
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None: 
        raise credentials_exception
    return user

# SUPER ADMIN (DEVELOPER/SEN): Her şeye erişir.
async def require_super_admin(current_user: User = Depends(get_current_user)):
    # is_admin flag'i True ve role "super_admin" olanlar
    if not current_user.is_admin or current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Clearance Level: Super Admin Required."
        )
    return current_user

# COMPANY ADMIN: Sadece kendi şirketini yönetir.
async def require_company_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Privilege Level: Company Admin Required."
        )
    return current_user


# --- KAYIT OLMA (REGISTER) ---
@router.post("/register")
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # NOT: user_in verisi buraya geldiğinde Pydantic tarafından temizlenmiş (strip, lower) haldedir!

    # 1. Kullanıcı var mı kontrol et
    user_query = await db.execute(select(User).where((User.email == user_in.email) | (User.username == user_in.username)))
    if user_query.scalars().first():
        raise HTTPException(status_code=400, detail="Bu email veya kullanıcı adı zaten kayıtlı.")

    # 2. Şirket var mı kontrol et, yoksa oluştur
    company_query = await db.execute(select(Company).where(Company.name == user_in.company_name))
    company = company_query.scalars().first()
    
    if not company:
        company = Company(name=user_in.company_name)
        db.add(company)
        await db.commit()
        await db.refresh(company)

    # 3. Yeni kullanıcıyı şirkete bağlayarak oluştur
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        company_id=company.id, 
        api_key=f"ids_{secrets.token_hex(16)}",
        is_admin=False,
        role="analyst" # Varsayılan rol
    )
    db.add(new_user)
    await db.commit()
    return {"message": "Kayıt başarılı", "api_key": new_user.api_key}


# --- GİRİŞ YAPMA (LOGIN) ---
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # VİP KORUMA: Formdan gelen email'i DB'de aramadan önce boşluklardan arındır ve küçült!
    # Bu adım o sinsi boşluk hatasını kökten bitirir.
    login_email = form_data.username.strip().lower()

    result = await db.execute(select(User).where(User.email == login_email))
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Hatalı email veya şifre")
    
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# --- PROFİL BİLGİLERİNİ GETİRME (ME) ---
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Kullanıcının şirket ismini veritabanından bul
    company_name = "Bilinmeyen Şirket"
    if current_user.company_id:
        company_query = await db.execute(select(Company).where(Company.id == current_user.company_id))
        company = company_query.scalars().first()
        if company:
            company_name = company.name

    # Şemaya uygun şekilde döndürüyoruz
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "role": current_user.role,
        "company_name": company_name
    }