#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
START_SCRIPT="${ROOT_DIR}/scripts/start-servers.sh"
APP_URL="http://localhost:8081"
LOG_DIR="${HOME}/.cache/tradevault"
if ! mkdir -p "${LOG_DIR}" 2>/dev/null; then
  LOG_DIR="/tmp/tradevault"
  mkdir -p "${LOG_DIR}"
fi
LOG_FILE="${LOG_DIR}/launcher.log"
if ! touch "${LOG_FILE}" 2>/dev/null; then
  LOG_DIR="/tmp/tradevault"
  mkdir -p "${LOG_DIR}"
  LOG_FILE="${LOG_DIR}/launcher.log"
  touch "${LOG_FILE}" 2>/dev/null || true
fi

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*" >> "${LOG_FILE}" 2>/dev/null || true
}

open_browser() {
  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --new-window "${APP_URL}" >/dev/null 2>&1 &
    return 0
  fi
  if command -v chromium >/dev/null 2>&1; then
    chromium --new-window "${APP_URL}" >/dev/null 2>&1 &
    return 0
  fi
  if command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --new-window "${APP_URL}" >/dev/null 2>&1 &
    return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${APP_URL}" >/dev/null 2>&1 &
    return 0
  fi
  return 1
}

mysql_is_running() {
  local out=""
  if command -v mysqladmin >/dev/null 2>&1; then
    out="$(mysqladmin --protocol=tcp -h127.0.0.1 ping 2>&1 || true)"
    if echo "$out" | grep -qi "mysqld is alive\|Access denied"; then
      return 0
    fi
  fi

  if command -v mysql >/dev/null 2>&1; then
    out="$(mysql -e "SELECT 1" 2>&1 || true)"
    if echo "$out" | grep -qi "Access denied"; then
      return 0
    fi
  fi

  return 1
}

if ! mysql_is_running; then
  log "MySQL probe failed; continuing startup attempt anyway."
  if command -v notify-send >/dev/null 2>&1; then
    notify-send "TradeVault" "MySQL check failed. Trying to start app anyway." >/dev/null 2>&1 || true
  fi
fi

# Start stack in background if frontend is not already responding.
if ! curl -s "${APP_URL}" >/dev/null 2>&1; then
  log "Starting stack via ${START_SCRIPT}"
  nohup "${START_SCRIPT}" >> "${LOG_FILE}" 2>&1 &
fi

# Open browser immediately, then retry once frontend is ready.
open_browser || log "No browser opener command found."

# Wait up to ~45s for frontend to come online, then open browser again.
for _ in $(seq 1 45); do
  if curl -s "${APP_URL}" >/dev/null 2>&1; then
    log "Frontend reachable at ${APP_URL}"
    open_browser || true
    exit 0
  fi
  sleep 1
done

if command -v notify-send >/dev/null 2>&1; then
  notify-send "TradeVault" "App did not start in time. Check log: ${LOG_FILE}" >/dev/null 2>&1 || true
fi
log "Frontend did not become ready in 45 seconds."
exit 1
