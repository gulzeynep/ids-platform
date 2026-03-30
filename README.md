# IDS-Platform

```
ids-platform/
├── .venv/                # Virtual environment
├── .env                  # Environment variables (DB_URL, SECRET_KEY)
├── .gitignore            # Files to ignore in Git
├── requirements.txt      # Project dependencies
├── main.py               # Entry point for development (uvicorn)
└── src/                  # All source code lives here
    ├── __init__.py       # Makes 'src' a package
    ├── database.py       # SQLAlchemy/Tortoise setup
    ├── models.py         # Database tables
    ├── schemas.py        # Pydantic models (data validation)
    ├── main.py           # FastAPI app initialization
    ├── api/              # Folder for all your endpoints
    │   ├── __init__.py
    │   ├── router.py     # Combines all sub-routers
    │   └── endpoints/    # Specific route files
    │       ├── auth.py
    │       └── alerts.py
    └── core/             # Global config and security
        ├── config.py
        └── security.py


ids-platform/
├── .env                  # Veritabanı URL'si burada
├── main.py               # Uygulamayı başlatan launcher
└── src/
    ├── __init__.py
    ├── database.py       # Async bağlantı ayarları
    ├── models.py         # SQLAlchemy tabloları
    ├── main.py           # FastAPI app tanımı ve router birleştirme
    └── api/
        ├── __init__.py
        ├── auth.py       # Kullanıcı işlemleri router'ı
        └── alerts.py     # IDS alarmları router'ı
```

