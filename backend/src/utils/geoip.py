import requests

def get_ip_metadata(ip_address):
    """
    IP adresinden ülke, şehir, enlem ve boylam bilgilerini çeker.
    Ücretsiz ip-api.com servisini kullanır.
    """
    try:
        # Lokal IP'ler için (Test aşamasında sıkça karşılaşırsın)
        if ip_address in ["127.0.0.1", "localhost", "0.0.0.0"]:
            return {"lat": 41.0082, "lon": 28.9784, "country": "Local", "city": "Internal Network"}

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
        print(f"GeoIP Lookup Error: {e}")
    
    # Hata durumunda varsayılan (Default) koordinat
    return {"lat": 0, "lon": 0, "country": "Unknown", "city": "Unknown"}