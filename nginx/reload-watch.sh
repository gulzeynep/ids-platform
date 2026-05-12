#!/bin/sh
set -eu

mkdir -p /etc/nginx/generated /var/log/nginx
touch /etc/nginx/generated/protected-sites.conf

nginx -g 'daemon off;' &
nginx_pid=$!
last_checksum=""

while kill -0 "$nginx_pid" 2>/dev/null; do
  checksum="$(cksum /etc/nginx/generated/protected-sites.conf 2>/dev/null || true)"
  if [ "$checksum" != "$last_checksum" ]; then
    if nginx -t; then
      nginx -s reload || true
      last_checksum="$checksum"
    fi
  fi
  sleep 2
done

wait "$nginx_pid"
