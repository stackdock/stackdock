# Base on Microsoft's official Playwright image: Chromium + all its system libs
# are baked in (matched to playwright 1.49.0), on Ubuntu Noble w/ Python 3.12.
# This is what makes the NYT pull work — a real headful Chromium under Xvfb is
# the only thing that gets past NYT's DataDome.
FROM mcr.microsoft.com/playwright/python:v1.49.0-noble
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Xvfb gives the headful Chromium a virtual display on this headless server.
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
