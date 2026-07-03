#!/bin/sh
set -e
# The NYT pull uses Camoufox headless — no virtual display needed. (Xvfb was
# required by the old headful-Chromium engine, which has been removed.)
exec "$@"
