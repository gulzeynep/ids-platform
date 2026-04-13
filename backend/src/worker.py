import json 
import asyncio
from src.core.redis import redis_client
from src.database import AsyncSessionLocal
from src.models import Alert
from src.core.logger import logger

async def process_alerts():
    logger.info("⚡ W-IDS Worker is active and listening to Redis Stream...")
    
    while True:
        try:
            # Redis Stream'den veri oku
            messages = await redis_client.xread({"alert_stream": "0-0"}, count=1, block=5000)
            
            if messages:
                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        payload = json.loads(data["payload"])
                        
                        # Burada ağır işlemler yapılabilir (GeoIP bulma, AI analizi vb.)
                        async with AsyncSessionLocal() as db:
                            # Örnek: Eğer çok kritikse admini uyaracak başka bir tabloya yaz
                            logger.info(f"Worker processing threat: {payload.get('type')}")
                        
                        # Mesajı işlendi olarak işaretle/sil
                        await redis_client.xdel("alert_stream", msg_id)
                        
        except Exception as e:
            logger.error(f"Worker encountered an error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(process_alerts())