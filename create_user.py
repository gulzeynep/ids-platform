import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.database import AsyncSessionLocal, engine
from backend.src.models import User
from backend.src.core.security import get_password_hash # Eğer şifreleme kullanıyorsan

load_dotenv()

async def create_initial_user():
    async with AsyncSessionLocal() as db:
        # .env içindeki API KEY'i alıyoruz
        api_key = os.getenv("API_KEY")
        
        # Önce bu key ile kullanıcı var mı kontrol et
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.api_key == api_key))
        existing_user = result.scalars().first()

        if not existing_user:
            new_user = User(
                username="admin_engine",
                hashed_password="hashed_dummy_password", # Gerçek sistemde bunu hash'lemelisin
                api_key=api_key,
                company_name="My IDS Sensor"
            )
            db.add(new_user)
            await db.commit()
            print(f"✅ Kullanıcı başarıyla oluşturuldu! API_KEY: {api_key}")
        else:
            print("ℹ️ Bu API_KEY ile kullanıcı zaten mevcut.")

if __name__ == "__main__":
    asyncio.run(create_initial_user())