#!/bin/sh
set -eu

PROFILE_DIR=/tmp/snort-rules
PROFILE_STATE_FILE="${SNORT_PROFILE_PATH:-/var/log/snort/detection_profile}"
RELOAD_REQUEST_FILE="${SNORT_RELOAD_REQUEST_PATH:-/var/log/snort/reload_snort}"

mkdir -p /var/log/snort/archive /var/log/snort/event_captures "$PROFILE_DIR"

awk '/^alert/ && /metadata:ruleset community/ { print }' \
  /etc/snort/rules/official/snort3-server-webapp.rules > "$PROFILE_DIR/server-webapp-community.rules"

cat > "$PROFILE_DIR/local-only.rules" <<'EOF'
include /etc/snort/rules/local/local.rules
EOF

cat > "$PROFILE_DIR/web-official.rules" <<'EOF'
include /etc/snort/rules/official/snort3-server-apache.rules
include /etc/snort/rules/official/snort3-server-iis.rules
include /etc/snort/rules/official/snort3-sql.rules
include /etc/snort/rules/official/snort3-server-webapp.rules
include /etc/snort/rules/official/snort3-x11.rules
EOF

cat > "$PROFILE_DIR/web-balanced.rules" <<'EOF'
include /etc/snort/rules/official/snort3-server-apache.rules
include /etc/snort/rules/official/snort3-server-iis.rules
include /etc/snort/rules/official/snort3-sql.rules
include /tmp/snort-rules/server-webapp-community.rules
include /etc/snort/rules/official/snort3-x11.rules
EOF

cat > "$PROFILE_DIR/web-full.rules" <<'EOF'
include /etc/snort/rules/official/snort3-server-apache.rules
include /etc/snort/rules/official/snort3-server-iis.rules
include /etc/snort/rules/official/snort3-sql.rules
include /etc/snort/rules/official/snort3-server-webapp.rules
include /etc/snort/rules/official/snort3-x11.rules
EOF

read_profile() {
  if [ -f "$PROFILE_STATE_FILE" ]; then
    profile="$(tr -d '\r\n ' < "$PROFILE_STATE_FILE")"
  else
    profile="${SNORT_RULE_PROFILE:-web-balanced}"
  fi

  case "$profile" in
    web-official|web-balanced|web-full|local-only) printf '%s' "$profile" ;;
    *) printf '%s' "web-official" ;;
  esac
}

archive_alert_log() {
  if [ -f /var/log/snort/alert_json.txt ]; then
    mv /var/log/snort/alert_json.txt "/var/log/snort/archive/alert_json.$(date +%Y%m%d%H%M%S).txt"
  fi
}

snort_pid=""
stop_requested=0

shutdown() {
  stop_requested=1
  if [ -n "$snort_pid" ] && kill -0 "$snort_pid" 2>/dev/null; then
    kill -TERM "$snort_pid" 2>/dev/null || true
  fi
}

trap shutdown INT TERM

while [ "$stop_requested" -eq 0 ]; do
  profile="$(read_profile)"
  export SNORT_RULE_PROFILE_FILE="$PROFILE_DIR/$profile.rules"

  echo "[snort-start] Starting Snort with profile=$profile rules=$SNORT_RULE_PROFILE_FILE"
  archive_alert_log
  bpf_filter="${SNORT_BPF_FILTER:-tcp port 80 or tcp port 443 or udp port 177}"

  /usr/local/bin/snort \
    -c /etc/snort/etc/snort.lua \
    -i "${INTERFACE:-eth0}" \
    -l /var/log/snort \
    -k none \
    -A alert_json \
    --daq afpacket \
    --bpf "$bpf_filter" &

  snort_pid=$!

  while kill -0 "$snort_pid" 2>/dev/null; do
    next_profile="$(read_profile)"
    if [ "$next_profile" != "$profile" ] || [ -f "$RELOAD_REQUEST_FILE" ]; then
      rm -f "$RELOAD_REQUEST_FILE"
      echo "[snort-start] Reload requested: $profile -> $next_profile"
      kill -TERM "$snort_pid" 2>/dev/null || true
      wait "$snort_pid" 2>/dev/null || true
      break
    fi
    sleep 2
  done

  if [ "$stop_requested" -eq 1 ]; then
    wait "$snort_pid" 2>/dev/null || true
    break
  fi

  sleep 1
done
