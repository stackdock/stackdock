# Base on Microsoft's official Playwright image: Firefox/Chromium system libs are
# baked in (matched to playwright 1.49.0), on Ubuntu Noble w/ Python 3.12.
# The NYT pull uses Camoufox (a hardened Firefox) — it beats DataDome's device
# check that plain Chromium fails, and runs headless (no Xvfb needed).
FROM mcr.microsoft.com/playwright/python:v1.49.0-noble
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Fetch the Camoufox browser binary + GeoIP dataset into the image.
RUN python -m camoufox fetch
# Xvfb remains as a fallback display (Camoufox runs headless and won't need it).
RUN apt-get update \
 && apt-get install -y --no-install-recommends xvfb \
 && rm -rf /var/lib/apt/lists/*
COPY app ./app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
VOLUME /data
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
