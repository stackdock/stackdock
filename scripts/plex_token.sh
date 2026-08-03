#!/usr/bin/env bash
# Exchange a Plex login for an X-Plex-Token and write it into /opt/stackdock/.env.
#
# Run it ON THE DROPLET, interactively:
#   ssh -t root@chudcrushers.com /opt/stackdock/scripts/plex_token.sh
#
# The password is read silently (never echoed, never a CLI argument, so it stays
# out of shell history and the process list) and is used for exactly one request
# to plex.tv. Only the resulting token is stored. Prefer a Plex MANAGED USER's
# login over the admin account: Plex stream URLs carry the token, so a limited
# account keeps a leak from reaching server settings.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/stackdock/.env}"

read -rp  "Plex email: " PLEX_EMAIL
read -rsp "Plex password: " PLEX_PASSWORD; echo
read -rp  "2FA code (blank if 2FA is off): " PLEX_2FA

# Plex wants the 2FA code appended to the password.
[ -n "$PLEX_2FA" ] && PLEX_PASSWORD="${PLEX_PASSWORD}${PLEX_2FA}"

RESPONSE=$(curl -sS -X POST "https://plex.tv/users/sign_in.json" \
  -H "X-Plex-Client-Identifier: stackdock-server" \
  -H "X-Plex-Product: Stackdock" \
  -H "X-Plex-Version: 1.0" \
  -H "Accept: application/json" \
  --data-urlencode "user[login]=${PLEX_EMAIL}" \
  --data-urlencode "user[password]=${PLEX_PASSWORD}")
unset PLEX_PASSWORD

TOKEN=$(printf '%s' "$RESPONSE" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except ValueError:
    sys.exit("could not parse the plex.tv response")
tok = (d.get("user") or {}).get("authToken") or d.get("authToken")
if not tok:
    err = d.get("error") or (d.get("errors") or [{}])[0].get("message") or "no token in response"
    sys.exit(f"plex.tv rejected the login: {err}")
print(tok)
')

# replace any existing PLEX_TOKEN line, else append
if grep -q '^PLEX_TOKEN=' "$ENV_FILE"; then
    tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
    grep -v '^PLEX_TOKEN=' "$ENV_FILE" > "$tmp"
    printf 'PLEX_TOKEN=%s\n' "$TOKEN" >> "$tmp"
    cat "$tmp" > "$ENV_FILE"          # preserve the original file's perms/inode
else
    printf 'PLEX_TOKEN=%s\n' "$TOKEN" >> "$ENV_FILE"
fi

# sanity check: does the token actually open the server?
PLEX_URL=$(grep '^PLEX_URL=' "$ENV_FILE" | cut -d= -f2- || true)
if [ -n "$PLEX_URL" ]; then
    CODE=$(curl -sk -o /dev/null -w '%{http_code}' -m 15 \
        -H "X-Plex-Token: $TOKEN" "${PLEX_URL%/}/library/sections")
    echo "token stored in $ENV_FILE — library check: HTTP $CODE (200 = working)"
else
    echo "token stored in $ENV_FILE (no PLEX_URL set, skipped the library check)"
fi
echo "now run: cd /opt/stackdock && docker compose up -d"
