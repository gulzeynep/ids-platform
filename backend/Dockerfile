FROM python:3.14-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Standart başlatma komutu (docker-compose bunu ezecek)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]