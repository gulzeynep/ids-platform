import httpx
from typing import Optional, Dict

async def get_ip_coordinates(ip_address: str) -> Optional[Dict[str, float]]:
    """
    Fetches latitude and longitude for a given IP address using a public API.
    In a high-traffic professional app, you'd use a local MaxMind database.
    """
    # Skip local/private IPs
    if ip_address.startswith(("127.", "192.168.", "10.")):
        return {"lat": 41.0082, "lon": 28.9784} # Default to Istanbul for testing
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{ip_address}", timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "lat": data.get("lat"),
                        "lon": data.get("lon"),
                        "city": data.get("city"),
                        "country": data.get("country")
                    }
    except Exception:
        return None
    return None