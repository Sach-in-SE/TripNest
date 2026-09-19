#!/bin/sh
set -e

if [ "$(id -u)" = '0' ]; then
    mkdir -p /app/uploads
    chown -R tripnest:tripnest /app/uploads
    exec runuser -u tripnest -- java $JAVA_OPTS -jar /app/app.jar "$@"
fi

exec java $JAVA_OPTS -jar /app/app.jar "$@"
