#!/bin/bash
# CerviTrack Demo Starter
# Run: bash start-demo.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOTSPOT_SSID="CerviTrack"
HOTSPOT_PASS="cervitrack123"
WIFI_IFACE="wlan1"

echo "=== CerviTrack Demo Setup ==="

LOG_DIR="$HOME"
BACKEND_LOG="$LOG_DIR/backend.log"
ADMIN_LOG="$LOG_DIR/admin.log"
METRO_LOG="$LOG_DIR/metro.log"
rm -f "$BACKEND_LOG" "$ADMIN_LOG" "$METRO_LOG" 2>/dev/null || true

# 1. Start WiFi hotspot on wlan1
echo "[1/4] Starting WiFi hotspot..."
nmcli connection delete "$HOTSPOT_SSID" 2>/dev/null || true
nmcli device disconnect "$WIFI_IFACE" 2>/dev/null || true
sleep 1
nmcli connection add type wifi ifname "$WIFI_IFACE" con-name "$HOTSPOT_SSID" autoconnect no ssid "$HOTSPOT_SSID" 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$HOTSPOT_PASS" > /dev/null 2>&1
nmcli connection up "$HOTSPOT_SSID" > /dev/null 2>&1
echo "  Hotspot '$HOTSPOT_SSID' created (password: $HOTSPOT_PASS)"

HOTSPOT_IP=$(ip -4 addr show "$WIFI_IFACE" 2>/dev/null | grep inet | awk '{print $2}' | cut -d/ -f1)
echo "  Hotspot IP: $HOTSPOT_IP"

# 2. Start backend on port 5000
echo "[2/4] Starting backend API..."
pkill -f "python3.*backend/app.py" 2>/dev/null || true
sleep 1
cd "$SCRIPT_DIR/backend"
nohup venv/bin/python3 app.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID (port 5000)"

# 3. Start admin portal on port 5001
echo "[3/4] Starting admin portal..."
cd "$SCRIPT_DIR/admin"
nohup venv/bin/python3 app.py > "$ADMIN_LOG" 2>&1 &
ADMIN_PID=$!
echo "  Admin PID: $ADMIN_PID (port 5001)"

# 4. Start Metro bundler on port 8081
echo "[4/4] Starting Metro bundler..."
cd "$SCRIPT_DIR"
nohup npx expo start > "$METRO_LOG" 2>&1 &
METRO_PID=$!
echo "  Metro PID: $METRO_PID (port 8081)"

# Wait for services to be ready
echo ""
echo "=== Waiting for services... ==="
sleep 3

if ss -tlnp 2>/dev/null | grep -q :5000; then echo "  ✓ Backend on :5000"; else echo "  ✗ Backend on :5000"; fi
if ss -tlnp 2>/dev/null | grep -q :5001; then echo "  ✓ Admin on :5001"; else echo "  ✗ Admin on :5001"; fi
if ss -tlnp 2>/dev/null | grep -q :8081; then echo "  ✓ Metro on :8081"; else echo "  ✗ Metro on :8081 (may need a few more seconds)"; fi

echo ""
echo "=== DONE ==="
echo "WiFi: $HOTSPOT_SSID / $HOTSPOT_PASS"
echo "Backend:  http://$HOTSPOT_IP:5000"
echo "Admin:    http://$HOTSPOT_IP:5001"
echo "App:      Connect phone to WiFi, open CERVITRACK app"
echo ""
echo "View logs:"
echo "  tail -f $BACKEND_LOG"
echo "  tail -f $ADMIN_LOG"
