#!/usr/bin/env bash

set -euo pipefail

APP_NAME="TradeVault"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_FILE="${HOME}/.local/share/applications/tradevault.desktop"
ICON_FILE="${ROOT_DIR}/public/favicon.ico"
START_SCRIPT="${ROOT_DIR}/scripts/start-servers.sh"
ICON_LAUNCH_SCRIPT="${ROOT_DIR}/scripts/launch-app.sh"

if [[ ! -x "${START_SCRIPT}" ]]; then
  echo "Error: start script not found or not executable: ${START_SCRIPT}"
  exit 1
fi
if [[ ! -x "${ICON_LAUNCH_SCRIPT}" ]]; then
  echo "Error: icon launch script not found or not executable: ${ICON_LAUNCH_SCRIPT}"
  exit 1
fi

mkdir -p "${HOME}/.local/share/applications"

cat > "${DESKTOP_FILE}" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=${APP_NAME}
Comment=Start TradeVault frontend and backend
Exec=/usr/bin/env bash -lc "cd '${ROOT_DIR}' && '${ICON_LAUNCH_SCRIPT}'"
Path=${ROOT_DIR}
Icon=${ICON_FILE}
Terminal=false
Categories=Development;Office;
StartupNotify=true
EOF

chmod +x "${DESKTOP_FILE}"

echo "Launcher created: ${DESKTOP_FILE}"
echo "Open your apps menu and search for '${APP_NAME}'."
