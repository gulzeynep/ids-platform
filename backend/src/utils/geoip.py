import requests

def get_ip_location(ip_address):
    try:
        # Ücretsiz API (Saniyede 45 istek sınırı var, geliştirme için ideal)
        response = requests.get(f"http://ip-api.com/json/{ip_address}?fields=status,country,city,lat,lon")
        data = response.json()
        if data['status'] == 'success':
            return {
                "lat": data['lat'],
                "lon": data['lon'],
                "country": data['country'],
                "city": data['city']
            }
    except Exception as e:
        print(f"GeoIP Error: {e}")
    
    # Hata durumunda veya lokal IP'lerde varsayılan (Ankara/İstanbul gibi)
    return {"lat": 39.9334, "lon": 32.8597, "country": "Unknown", "city": "Unknown"}