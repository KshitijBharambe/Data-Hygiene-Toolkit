FROM python:3.12-slim

WORKDIR /api

# Install uv (modern Python package manager)
RUN pip install uv

# Copy project files
COPY pyproject.toml .
COPY uv.lock .

RUN uv pip install -r pyproject.toml --system --compile-bytecode

# Copy application code
COPY api/app/ ./app
COPY api/migrations/ ./migrations
COPY api/migrations/alembic.ini ./alembic.ini

# Set PYTHONPATH
ENV PYTHONPATH=/api

# Expose port
EXPOSE 8000

# Production command (no reload)
# --proxy-headers: Trust X-Forwarded-* headers from Fly.io proxy for correct HTTPS redirects
# --forwarded-allow-ips='*': Allow all proxy IPs (Fly.io uses dynamic IPs)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
