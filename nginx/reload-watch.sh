#!/bin/sh
set -eu

mkdir -p /etc/nginx/generated /var/log/nginx
touch /etc/nginx/generated/protected-sites.conf
touch /etc/nginx/generated/blocked-ips.conf

nginx -g 'daemon off;' &
nginx_pid=$!
last_checksum=""

while kill -0 "$nginx_pid" 2>/dev/null; do
  checksum="$(find /etc/nginx/generated -type f -name '*.conf' -exec cksum {} + 2>/dev/null | sort | cksum || true)"
  if [ "$checksum" != "$last_checksum" ]; then
    if nginx -t; then
      nginx -s reload || true
      last_checksum="$checksum"
    fi
  fi
  sleep 2
done

wait "$nginx_pid"
