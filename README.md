# CerviTrack — HPV Self-Screening & Risk Assessment Platform

**CerviTrack** is a full-stack mobile + admin platform for AI-powered HPV self-screening, risk assessment, patient follow-up, and facility linkage. Designed for low-resource settings (with Kenya as the primary target), it works offline-first and syncs when connectivity is available.

## Quick Start

```bash
# Start the Flask API backend
cd backend
source venv/bin/activate
python3 app.py            # http://0.0.0.0:5000

# Start the Admin Web Portal (separate terminal)
cd admin
source ../backend/venv/bin/activate
python3 app.py            # http://0.0.0.0:5001

# Start Expo dev server (another terminal)
npx expo start            # Expo Go / web / APK
```

- **Mobile APK**: `npx eas build --platform android --profile preview`
- **Admin login**: `admin@cervitrack.com` / `admin123`
- **OTP simulation**: Any 6 digits accepted
- **Backend API**: `http://192.168.193.168:5000` (ZeroTier VPN)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 46, React Native 0.85, TypeScript 6 |
| Navigation | @react-navigation/native (bottom tabs + stacks) |
| State | React Context (Auth, Theme, Language, Notifications) |
| i18n | i18next + react-i18next (English / Swahili) |
| Backend | Python 3, Flask, SQLite (WAL mode) |
| Admin Web | Flask + Jinja2 + Bootstrap 5 |
| Build | EAS Build (Android APK) |
| Network | ZeroTier VPN (192.168.193.168) |

## Project Structure

```
cervitrack/
├── App.tsx                    # Root: wraps 4 providers + I18nextProvider
├── index.ts                   # Expo entry point
├── app.json                   # Expo config + Android permissions
├── eas.json                   # EAS Build profiles
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
│
├── navigation/
│   └── AppNavigator.tsx       # 5-tab bottom nav + stack navigators
│
├── screens/
│   ├── AuthScreen.tsx         # Phone OTP + email/password login/register
│   ├── HomeScreen.tsx         # Risk card, quick actions grid, analytics bar
│   ├── MyHealthScreen.tsx     # Health score, HPV-free counter, timeline
│   ├── ScanScreen.tsx         # QR scanner placeholder + manual code entry
│   ├── MessagesScreen.tsx     # Chat list + ChatDetail (WhatsApp-style)
│   ├── ScreeningScreen.tsx    # 11-question morphing form, risk calc
│   ├── VaccineScreen.tsx      # Calendar view + vaccine list + alarms
│   ├── FacilityScreen.tsx     # Nearby facilities list
│   ├── TelehealthScreen.tsx   # Telehealth contact list
│   ├── LibraryScreen.tsx      # Health education articles
│   ├── SelfSamplingScreen.tsx # Self-sampling step-by-step guide
│   ├── AIAssistantScreen.tsx  # Chatbot with HPV Q&A
│   ├── SettingsScreen.tsx     # Dark mode, language, logout
│   └── ProfileScreen.tsx      # Edit name, DOB, photo, last healed date
│
├── context/
│   ├── AuthContext.tsx        # Local user CRUD + session (AsyncStorage)
│   ├── ThemeContext.tsx       # Light/dark theme with colors
│   ├── LanguageContext.tsx    # i18next language switching
│   ├── NotificationContext.tsx# In-app notification management
│   └── index.ts              # Barrel exports
│
├── services/
│   ├── api.ts                # HTTP client with mock fallback
│   └── storage.ts            # AsyncStorage wrapper
│
├── i18n/
│   ├── index.ts              # i18next init
│   ├── en.json               # English translations
│   └── sw.json               # Swahili translations
│
├── backend/
│   ├── app.py                # Flask API (1392 lines, 20+ endpoints)
│   ├── start.sh              # Launcher script
│   ├── cervitrack.db         # SQLite (screenings, users, etc.)
│   └── chats.db              # SQLite (conversations, messages)
│
├── admin/
│   ├── app.py                # Flask web portal (497 lines, 17 routes)
│   └── templates/
│       ├── base.html         # Layout: sidebar, topbar, dark mode support
│       ├── login.html
│       ├── dashboard.html
│       ├── users.html / user_detail.html
│       ├── settings.html
│       ├── notifications.html
│       ├── vaccines.html
│       ├── appointments.html / lab_results.html / followups.html
│       ├── reports.html / report.html
│
├── assets/                   # App icons and splash screen
└── components/               # (reserved for shared components)
```

## Color Palette

| Role | Hex |
|------|-----|
| Navy | `#1E1A4B` |
| Purple (Primary) | `#6C5CE7` |
| Red (Error) | `#FF4D4D` |
| Green (Success) | `#00C853` |
| Background | `#FCFBFE` |
| Card | `#FFFFFF` |

## Live Demo Setup

1. Install [ZeroTier](https://www.zerotier.com/) on laptop and phone
2. Join the same network on both devices
3. Start backend: `cd backend && source venv/bin/activate && python3 app.py`
4. Start admin: `cd admin && source ../backend/venv/bin/activate && python3 app.py`
5. Build APK: `npx eas build --platform android --profile preview`
6. Install APK on phone, open via ZeroTier IP `192.168.193.168:5000`

## License

MIT — see LICENSE
