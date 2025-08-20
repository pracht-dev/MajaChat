FROM python:3.11-slim AS base
LABEL authors="pracht"

# Prevents Python from writing .pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (optional, add ffmpeg/libs if you need audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose uvicorn port
EXPOSE 8000

# Use host 0.0.0.0 so it's reachable from other containers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]