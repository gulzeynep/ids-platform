FROM python:3.14-slim

WORKDIR /app

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Copy the startup script and make it executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set the python path
ENV PYTHONPATH=/app

# Execute the startup script which handles migrations AND starts Uvicorn
CMD ["/start.sh"]