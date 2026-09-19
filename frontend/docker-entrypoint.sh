#!/bin/sh
set -e

# Default BACKEND_URL to local docker-compose backend service if not provided
export BACKEND_URL="${BACKEND_URL:-http://tripnest-backend:8080}"

# Strip trailing slash from BACKEND_URL if present to avoid duplicate slashes
BACKEND_URL="$(echo "$BACKEND_URL" | sed 's:/*$::')"
export BACKEND_URL

# Substitute only ${BACKEND_URL} into nginx.conf so standard Nginx runtime variables ($host, $remote_addr, etc.) remain intact
if command -v envsubst >/dev/null 2>&1 && [ -f /etc/nginx/nginx.conf.template ]; then
    envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
fi

exec "$@"