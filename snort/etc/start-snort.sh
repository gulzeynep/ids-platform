#!/bin/sh
set -eu

mkdir -p /var/log/snort/archive /var/log/snort/event_captures /tmp/snort-rules

awk '/^alert/ && /metadata:ruleset community/ { print }' \
  /etc/snort/rules/official/snort3-server-webapp.rules > /tmp/snort-rules/server-webapp-community.rules

cat > /tmp/snort-rules/local-only.rules <<'EOF'
include /etc/snort/rules/local/local.rules
EOF

cat > /tmp/snort-rules/web-balanced.rules <<'EOF'
include /etc/snort/rules/local/local.rules
include /etc/snort/rules/official/snort3-server-apache.rules
include /etc/snort/rules/official/snort3-server-iis.rules
include /etc/snort/rules/official/snort3-sql.rules
include /tmp/snort-rules/server-webapp-community.rules
EOF

cat > /tmp/snort-rules/web-full.rules <<'EOF'
include /etc/snort/rules/local/local.rules
include /etc/snort/rules/official/snort3-server-apache.rules
include /etc/snort/rules/official/snort3-server-iis.rules
include /etc/snort/rules/official/snort3-sql.rules
include /etc/snort/rules/official/snort3-server-webapp.rules
EOF

SNORT_RULE_PROFILE_FILE="/tmp/snort-rules/${SNORT_RULE_PROFILE:-web-balanced}.rules"
if [ ! -f "$SNORT_RULE_PROFILE_FILE" ]; then
  SNORT_RULE_PROFILE_FILE="/tmp/snort-rules/web-balanced.rules"
fi
export SNORT_RULE_PROFILE_FILE

if [ -f /var/log/snort/alert_json.txt ]; then
  mv /var/log/snort/alert_json.txt "/var/log/snort/archive/alert_json.$(date +%Y%m%d%H%M%S).txt"
fi

exec /usr/local/bin/snort \
  -c /etc/snort/etc/snort.lua \
  -i "${INTERFACE:-eth0}" \
  -l /var/log/snort \
  -k none \
  -A alert_json \
  --daq afpacket
