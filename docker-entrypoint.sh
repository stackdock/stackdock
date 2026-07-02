#!/bin/sh
set -e
# The NYT fetcher runs a *headful* Chromium (DataDome blocks headless), so the
# container needs a virtual display. Start Xvfb and point DISPLAY at it; the
# whole app inherits it and app/ingest/nyt.py launches Chromium onto it.
if command -v Xvfb >/dev/null 2>&1; then
  Xvfb :99 -screen 0 1366x900x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
  export DISPLAY=:99
fi
exec "$@"
