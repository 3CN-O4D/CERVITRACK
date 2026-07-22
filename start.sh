#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $ADMIN_PID $LT_API_PID $LT_ADMIN_PID 2>/dev/null
  wait 2>/dev/null
  echo "All services stopped."
}
trap cleanup EXIT INT TERM

echo "=== Starting CerviTrack ==="
echo ""

# Kill anything on our ports
fuser -k 5000/tcp 5001/tcp 2>/dev/null || true
sleep 1

# Clean old logs
: > /tmp/cervitrack_backend.log
: > /tmp/cervitrack_admin.log
: > /tmp/cervitrack_lt_api.log
: > /tmp/cervitrack_lt_admin.log

# ─── 1. Backend ───
echo "[1] Starting backend API on :5000 ..."
cd "$ROOT/backend" && python3 app.py >> /tmp/cervitrack_backend.log 2>&1 &
BACKEND_PID=$!

# ─── 2. Admin panel ───
echo "[2] Starting admin panel on :5001 ..."
cd "$ROOT/admin" && python3 app.py >> /tmp/cervitrack_admin.log 2>&1 &
ADMIN_PID=$!

sleep 3

# Verify both started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "ERROR: Backend failed to start."
  cat /tmp/cervitrack_backend.log
  exit 1
fi
if ! kill -0 $ADMIN_PID 2>/dev/null; then
  echo "ERROR: Admin panel failed to start."
  cat /tmp/cervitrack_admin.log
  exit 1
fi

echo "       Backend  → http://localhost:5000  (PID $BACKEND_PID)"
echo "       Admin    → http://localhost:5001  (PID $ADMIN_PID)"

# ─── 3. localtunnel tunnels ───
echo ""
echo "[3] Opening public URLs via localtunnel (this may take 10-15s) ..."

npx localtunnel --port 5000 > /tmp/cervitrack_lt_api.log 2>&1 &
LT_API_PID=$!

npx localtunnel --port 5001 > /tmp/cervitrack_lt_admin.log 2>&1 &
LT_ADMIN_PID=$!

# Wait for tunnel URLs to appear
API_URL=""
ADMIN_URL=""
for i in $(seq 1 20); do
  API_URL=$(grep -oP 'https?://[a-zA-Z0-9.-]+\.loca\.lt' /tmp/cervitrack_lt_api.log 2>/dev/null | head -1)
  ADMIN_URL=$(grep -oP 'https?://[a-zA-Z0-9.-]+\.loca\.lt' /tmp/cervitrack_lt_admin.log 2>/dev/null | head -1)
  if [ -n "$API_URL" ] && [ -n "$ADMIN_URL" ]; then
    break
  fi
  sleep 2
done

# ─── 4. Print summary ───
echo ""
echo "=========================================="
echo "  CerviTrack — All services running"
echo "=========================================="
echo "  Backend API:"
echo "    Local:  http://localhost:5000"
echo "    Public: ${API_URL:-STILL WAITING...}"
echo ""
echo "  Admin Panel:"
echo "    Local:  http://localhost:5001"
echo "    Public: ${ADMIN_URL:-STILL WAITING...}"
echo ""
echo "  Provider login:"
echo "    ${ADMIN_URL:-http://localhost:5001}/provider/login"
echo "=========================================="
echo ""
if [ -n "$API_URL" ]; then
  echo "  For the app, set API_BASE = $API_URL"
fi
echo ""
echo "Log files:  /tmp/cervitrack_{backend,admin,lt_api,lt_admin}.log"
echo ""
echo "Press Ctrl+C to stop all services."

wait
