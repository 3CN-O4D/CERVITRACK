# CerviTrack Demo Guide

## Prerequisites
- Laptop with CerviTrack codebase
- Phone with Android
- Phone connected to laptop via USB (adb)

## Step 1: Start Services
```bash
bash start-demo.sh
```
This creates a WiFi hotspot `CerviTrack` (password: `cervitrack123`) and starts:
- Backend API on port 5000
- Admin portal on port 5001
- Metro bundler on port 8081

## Step 2: Connect Phone
- Connect phone to `CerviTrack` WiFi
- Open Termux on phone, run:
```bash
adb reverse tcp:8081 tcp:8081
```

## Step 3: Install App
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 4: Open App
- Open "CERVITRACK" on phone
- Register/login
- Features to demo:
  - **Home**: Risk status, quick stats, quick actions
  - **My Health**: Health score, HPV-free days, appointment calendar, screening history
  - **Screening**: Risk assessment questionnaire → automated verdict
  - **Facilities**: Nearby hospitals with booking
  - **Telehealth**: Chat with Dr. Sarah (messages persist)
  - **Profile**: Edit name, DOB, photo, Last Treated Date
  - **Admin**: http://10.42.0.1:5001

## Key Architecture
- **Frontend**: React Native (Expo SDK 57, RN 0.86)
- **Backend**: Flask (Python) + SQLite
- **Local DB**: expo-sqlite (offline-first)
- **Sync**: Background sync when online

## Troubleshooting
- App won't load: Check Metro is running (`ss -tlnp | grep 8081`)
- API failing: `curl http://10.42.0.1:5000/api/facilities`
- Admin inaccessible: Check `ss -tlnp | grep 5001`
- Rebuild native: `npx expo run:android --no-install`
