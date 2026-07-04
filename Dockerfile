# The NYT pull uses Camoufox (a hardened Firefox that beats DataDome's device
# check, headless). Camoufox ships its OWN Firefox binary, so we don't need the
# heavy Playwright image's bundled browsers — we only need Firefox's runtime
# system libraries. Installing firefox-esr pulls exactly those (and avoids
# guessing Debian's t64-renamed lib package names). Result: ~1.5 GB vs ~6 GB.
FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# firefox-esr = the right Firefox runtime libs for Camoufox; procps = pkill for
# the browser reaper. Then fetch the Camoufox browser binary + GeoIP dataset
# (retry — the GitHub release CDN flakes and a failure would abort the deploy).
RUN apt-get update \
 && apt-get install -y --no-install-recommends firefox-esr procps ffmpeg \
 && rm -rf /var/lib/apt/lists/* \
 && for i in 1 2 3 4 5 6; do python -m camoufox fetch && break || { echo "camoufox fetch retry $i"; sleep 12; }; done \
 && test -d /root/.cache/camoufox
COPY app ./app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
VOLUME /data
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
