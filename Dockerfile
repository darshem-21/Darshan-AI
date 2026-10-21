# Hugging Face Spaces Docker runtime for Darshan AI FastAPI backend.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

WORKDIR /app

# Node.js + pinned REA (morluto/rea, npm rea-agents) for reverse-engineering analysis.
# REA execution remains disabled unless ENABLE_REA_CLI_EXECUTION=true in Secrets.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg procps \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --upgrade pip \
    && pip install -r /app/backend/requirements.txt

COPY . /app
RUN cd /app/backend/rea && npm ci --no-audit --no-fund

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /app/backend/storage/uploads /app/backend/storage/vectorstores \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
