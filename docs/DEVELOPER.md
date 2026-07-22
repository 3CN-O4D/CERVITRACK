# Developer Documentation — File-by-File Reference

## Entry Points

### `index.ts`
Expo entry point. Calls `registerRootComponent(App)` which registers the app with React Native's `AppRegistry`. No configuration needed here — it's the standard Expo bootstrap.

### `App.tsx`
Root component that wraps the entire app in four context providers + `I18nextProvider`:

```
I18nextProvider i18n={i18n}
  └── LanguageProvider
       └── ThemeProvider
            └── AuthProvider
                 └── NotificationProvider
                      └── AppContent
                           └── StatusBar (dynamic bar style based on isDark)
                           └── AppNavigator
```

**Important**: `AppContent` is a separate component so it can call `useTheme()` (hooks can only be used inside a provider). The `I18nextProvider` ensures `react-i18next`'s `useTranslation` hook receives language change events.

---

## Navigation

### `navigation/AppNavigator.tsx`
The navigation tree:

- **Auth flow** (when `!isAuthenticated`): `Stack.Navigator` → `AuthScreen`
- **Main app** (when `isAuthenticated`): `Stack.Navigator` → `Tab.Navigator`
  - **Home tab**: `HomeStack` (HomeScreen → AIAssistantScreen)
  - **MyHealth tab**: MyHealthScreen
  - **Scan tab**: ScanScreen
  - **Messages tab**: `MessagesStack` (MessagesList → ChatDetail)
  - **Profile tab**: ProfileScreen

**Theme key fix**: Each `Stack.Navigator` and `Tab.Navigator` has `key={isDark ? 'dark' : 'light'}`. This forces React Navigation to re-mount the navigator when the theme changes, re-evaluating `screenOptions` with the new `colors`. Without this, the tab bar and header styles would not update after theme toggle.

The `unreadCount` from `NotificationContext` is passed as `tabBarBadge` on the Messages tab.

---

## Screens

### `screens/AuthScreen.tsx`
Two tabs: **Login** and **Register**. Each has two authentication modes:

| Mode | Flow |
|------|------|
| **Phone + OTP** (default) | Enter phone → "Send OTP" → 6-digit OTP input (any 6 digits accepted in demo) |
| **Email + Password** | Switch via toggle button, standard email/password form |

**Register**: Collects name, email, phone, password, role (patient/chw/nurse/lab), and location. After info step, shows OTP step. Stores user in `AuthContext` (AsyncStorage).

**Login**: Email/password or phone+OTP. Finds user in local storage.

All data is local-first — no network required for auth (the app stores users in AsyncStorage under `@cervitrack_users`).

### `screens/HomeScreen.tsx`
The main landing screen after login. Layout:

1. **Greeting** — "Hello, [Name]" with notification bell icon + unread badge
2. **Risk Assessment Card** — Shows "Low Risk" or "High Risk" status with a "Simulate Toggle Status" button (for demo). Expandable risk factors list.
3. **Stats Bar** — Period selector (Today/Week/Month/3M/6M/1Y) with three metrics: Screenings, HPV+, Follow-ups
4. **Quick Actions Grid** — 2×4 grid of action cards: Appointments, Talk to Nurse, Lab Results, Vaccines, Self-Sampling, Health Library, AI Assistant. Tapping navigates to the appropriate screen.
5. **Regional Stats** — Community-level stats (registered, screened, HPV+)

Key hook: `useNotifications()` for unread badge count. Uses `Dimensions.get('window').width` for responsive card sizing.

### `screens/ScreeningScreen.tsx`
11-question morphing risk assessment form. Questions are progressively revealed based on previous answers:

| # | Question | Type | Condition |
|---|----------|------|-----------|
| 1 | What is your age? | number | always |
| 2 | How many births? | number | age ≥ 18 |
| 3 | HPV Vaccinated? | single (Yes/No) | age ≥ 18 |
| 4 | Previous screening? | single (Yes/No) | age ≥ 18 |
| 5 | HIV Status? | single (Positive/Negative/Unknown) | age ≥ 18 |
| 6 | Smoking? | single (Yes/No) | age ≥ 18 |
| 7 | Symptoms? | single (Yes/No) | age ≥ 18 |
| 8 | Family history of cervical cancer? | single (Yes/No) | age ≥ 18 |
| 9 | Age at first intercourse? | single (<18/18-25/>25) | age ≥ 18 |
| 10 | Number of sexual partners? | single (1/2-3/4+) | age ≥ 18 |
| 11 | Contraceptive use? | single (Yes/No) | age ≥ 18 |

**Scoring**: Each risk answer adds 1 point. Thresholds: ≥5 = HIGH, ≥3 = MODERATE, <3 = LOW.

Uses `Animated` for morphing transitions between questions. Shows animated progress bar. On completion, displays result with color-coded verdict (red/green/yellow) and calls `submitScreening` API (falls back to mock).

### `screens/MyHealthScreen.tsx`
Health dashboard with:

- **Health Score Ring** — Circular progress indicator (custom `CircularProgress` component using `react-native-svg`-like approach with `Animated` + `PanResponder` for the ring). Shows percentage score.
- **HPV-Free Counter** — Days since last healed date (calculates from `lastHealedDate`, or `birthDate`, or "No data").
- **Vaccines Card** — Upcoming vaccine schedule list.
- **Appointments Card** — Upcoming appointments.
- **Screening History Timeline** — Scrollable list of past screenings with date, result, and type.

### `screens/MessagesScreen.tsx`
Two views managed by a single component:

**Chat List** (`contacts[]`):
- 8 hardcoded contacts (Dr. Sarah, Nurse Mercy, Dr. John, etc.)
- Each shows: avatar (initials), name, role, online dot (green), last message preview, timestamp, unread badge
- Tapping opens ChatDetail

**Chat Detail** (when a contact is selected):
- Header with back arrow, contact name, online/offline status
- Message bubbles: sent messages right-aligned (purple), received left-aligned (gray)
- Read receipts: ✓ (sent), ✓✓ (delivered), ✓✓✓ (read, blue)
- Media bubbles: image thumbnails, audio waveform placeholders
- Input bar: text input + image picker (`expo-image-picker`) + audio recorder (`expo-av`) + send button
- Messages are scrolled to bottom on new message

All data is mock/hardcoded (no API calls for messages in the mobile client — the chat API exists on the backend for server-side storage).

### `screens/ScanScreen.tsx`
QR code scanner placeholder:
- Mock QR scanner area (camera preview placeholder with icon + "Point at QR code" text)
- Manual code entry input + "Look Up" button
- Recent scans section (hardcoded)
- Purpose: Scan patient QR codes to pull up records (functional on demo with manual code entry)

### `screens/ProfileScreen.tsx`
Editable profile form:
- **Photo**: Tap to pick from gallery via `expo-image-picker` (base64 string stored in user object)
- **Fields**: Name, Email, Phone, Date of Birth, Last Healed Date
- Save button calls `updateProfile()` from `AuthContext` (persists to AsyncStorage)
- Logout button at bottom (with confirmation dialog)

HPV-Free Days counter in header: calculated from `lastHealedDate` to now.

### `screens/VaccineScreen.tsx`
Vaccine management:
- **Calendar View**: `react-native-calendars` `Calendar` component showing vaccine dates marked with dots
- **Vaccine List**: FlatList of vaccines with name, hospital, date, status badge
- **Add Vaccine**: Modal form (name, hospital, date)
- **Reminders**: Toggle switches for "Remind on day" and "Remind before" (1 day before)
- **Alarms**: Uses `expo-notifications` to schedule local notifications

### `screens/FacilityScreen.tsx`
List of partner health facilities with:
- Facility cards: name, distance, phone, hours, services
- Map placeholder area
- Hardcoded 8 Nairobi facilities (Kenyatta, Aga Khan, M.P. Shah, etc.)

### `screens/TelehealthScreen.tsx`
Contact list for telehealth:
- Avatar (initials), name, role, online indicator
- Tapping navigates to MessagesScreen chat with that contact

### `screens/LibraryScreen.tsx`
Health education library:
- Category filter chips (All, Education, Prevention, Wellness, etc.)
- Article cards with image, title, summary, category badge, read time
- Expandable article content on tap
- 12 hardcoded articles about cervical cancer, HPV, screening, etc.

### `screens/SelfSamplingScreen.tsx`
Step-by-step self-sampling guide:
- 5 steps with icons, titles, descriptions, durations
- Progress indicator
- "Get Started" CTA button (navigates to FacilityScreen to find a clinic)

### `screens/AIAssistantScreen.tsx`
AI chatbot for HPV Q&A:
- Chat bubble UI (user right, AI left)
- Mock AI responses based on keyword matching in `api.ts`
- Suggestion chips (What is HPV?, How to prevent?, When to screen?, Vaccine info?, Symptoms?)
- Typing indicator animation while "AI" responds
- No actual AI API — responses are pre-written for the 5 most common question categories

### `screens/SettingsScreen.tsx`
Two settings sections:
1. **Dark Mode**: Toggle switch, calls `toggleTheme()` from `ThemeContext`. Persisted to AsyncStorage as `@cervitrack_theme`.
2. **Language**: Two touchable rows (English / Kiswahili). Calls `setLanguage()` from `LanguageContext` which triggers `i18n.changeLanguage()`. Persisted as `@cervitrack_language`.
3. **About**: App name, version, privacy policy link.
4. **Logout**: With Alert confirmation.

---

## Context Providers

### `context/AuthContext.tsx`
Manages user authentication entirely from local storage:

**Storage keys**: `@cervitrack_users` (all users array), `@cervitrack_session` (current user ID)

**Provider state**:
- `user: User | null` — currently logged-in user
- `loading: boolean` — true while restoring session on app boot
- `isAuthenticated: boolean` — derived from `!!user`

**Methods**:
- `login(email, password)` — finds user by email in local store, checks password
- `loginByPhone(phone)` — finds user by phone number
- `register(name, email, phone, password, role, location?)` — creates new user, saves to store, logs in
- `updateProfile(updates)` — merges updates into user object, persists
- `logout()` — clears session

**User type**:
```
{ id, name, email, phone, password, role, photo, birthDate, lastHealedDate, location, createdAt }
```

### `context/ThemeContext.tsx`
Manages light/dark theme switching:

**Color palettes**:
- Light: bg `#FCFBFE`, card `#FFFFFF`, text `#1E1A4B`, primary `#6C5CE7`, etc.
- Dark: bg `#0D0D1A`, card `#1A1A2E`, text `#F0F0FF`, primary `#8B7CF7`, etc.

**Storage key**: `@cervitrack_theme`

**Methods**: `toggleTheme()` — flips `isDark`, saves to storage, `colors` object updates via `useMemo`.

**Usage**: Any component calls `useTheme()` to get `{ isDark, toggleTheme, colors }`.

### `context/LanguageContext.tsx`
Integrates with `i18next` for English/Swahili switching:

- **On mount**: Restores saved language from `@cervitrack_language` AsyncStorage key
- `setLanguage(lng)`: Updates state, calls `i18n.changeLanguage(lng)`, persists
- The `I18nextProvider` in App.tsx ensures `react-i18next`'s `useTranslation` hook receives the language change event and re-renders all components

### `context/NotificationContext.tsx`
In-app notification management (distinct from push/Expo notifications):

**Storage key**: `@cervitrack_notifications`

**Methods**:
- `addNotification(n)` — prepends to list, persists
- `markRead(id)` — marks single as read
- `markAllRead()` — marks all as read
- `unreadCount` — derived from `notifications.filter(n => !n.read).length`

**Notification type**: `{ id, title, message, type, read, createdAt }`

Types: `screening | vaccine | appointment | reminder | alert`

---

## Services

### `services/api.ts`
HTTP client with automatic mock fallback for every endpoint:

- `request<T>(endpoint, options?)` — core fetch wrapper, catches network errors
- Every public function wraps `request()` in try/catch and returns mock data on failure
- This means the app works fully offline with realistic-looking data

**Endpoints**:
| Function | Method | Endpoint | Mock Fallback |
|----------|--------|----------|---------------|
| `getStats()` | GET | `/dashboard/stats` | mockDashboard |
| `submitScreening()` | POST | `/screening/submit` | returns verdict + risk_tier |
| `getFacilities()` | GET | `/facilities` | 3 hardcoded facilities |
| `bookAppointment()` | POST | `/appointments` | `{ success: true }` |
| `sendMessage()` | POST | `/telehealth/message` | `{ success: true }` |
| `getVaccineData()` | GET | `/vaccines` | 2 mock vaccines |
| `syncVaccineReminder()` | POST | `/vaccines/reminder` | `{ success: true }` |
| `generateReport()` | GET | `/admin/report/{id}` | `{ url: '' }` |
| `getUsers()` | GET | `/admin/users` | 2 mock users |
| `sendNotification()` | POST | `/admin/notify` | `{ success: true }` |
| `getDashboardData()` | GET | `/admin/dashboard` | mockDashboard |
| `getAssistantResponse()` | — | (local) | Keyword-matched responses |

The `getAssistantResponse()` function is purely client-side — it matches user questions against keyword lists and returns pre-written educational responses about HPV, screening, vaccination, symptoms, and prevention.

### `services/storage.ts`
Thin wrapper around `@react-native-async-storage/async-storage` with a fallback in-memory store for environments where AsyncStorage is not available (e.g., web).

**Exports**: `getItem(key)`, `setItem(key, value)`, `removeItem(key)`

---

## Internationalization

### `i18n/index.ts`
Configures `i18next` with `react-i18next` plugin:

- Resources: `en.json` and `sw.json` under `translation` namespace
- Fallback language: English
- `useSuspense: false` (required for React Native)
- Initial language: `'en'`

### `i18n/en.json` (156 keys)
English translations organized by screen: `common`, `auth`, `home`, `profile`, `screening`, `vaccine`, `settings`, `chat`, `library`, `telehealth`, `facilities`, `myHealth`.

### `i18n/sw.json` (156 keys)
Swahili translations with identical structure. Uses `{name}` interpolation variables matching the English version.

---

## Backend (`backend/app.py`)

**1392 lines** — Flask API server with SQLite databases.

### Databases
- **`cervitrack.db`** — Main database (users, screenings, vaccines, appointments, notifications, facilities, articles, followups, lab_results, reports)
- **`chats.db`** — Separate database for chat conversations and messages (prevents chat volume from bloating clinical data)

### Auto-seeding
On first run, the backend seeds:
- **8 facilities** (Kenyatta, Aga Khan, M.P. Shah, Nairobi Women's, Mater, Nairobi Hospital, Coptic, Gertrude's)
- **12 library articles** (cervical cancer education, HPV vaccine, screening methods, etc.)
- **6 chat contacts** (Dr. Sarah, Nurse Mercy, Dr. John, Lab Tech Paul, Nurse Esther, Dr. Anne)

### API Endpoints (20+)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login by email+password |
| `/api/auth/profile` | PUT | Update profile fields |
| `/api/screening/submit` | POST | Submit screening result |
| `/api/screening/history` | GET | Get user screening history |
| `/api/dashboard/stats` | GET | Aggregate stats (optional period filter) |
| `/api/vaccines/add` | POST | Add vaccine record |
| `/api/vaccines` | GET | Get user vaccines |
| `/api/vaccines/{id}/done` | PUT | Mark vaccine done |
| `/api/vaccines/{id}/reminder` | PUT | Set reminder preferences |
| `/api/facilities` | GET | List all facilities |
| `/api/appointments/book` | POST | Book legacy appointment |
| `/api/appointments` | GET | Get user appointments |
| `/api/appointments/create` | POST | Create new-style appointment |
| `/api/appointments/{id}/status` | PUT | Update appointment status |
| `/api/lab-results/add` | POST | Add lab result |
| `/api/lab-results` | GET | Get user lab results |
| `/api/followups` | GET | Get user follow-ups |
| `/api/followups/complete` | POST | Complete follow-up |
| `/api/telehealth/message` | POST | Send telehealth message |
| `/api/telehealth/messages` | GET | Get telehealth messages |
| `/api/library/articles` | GET | List articles (excerpts) |
| `/api/notifications` | GET | Get user notifications |
| `/api/notifications/{id}/read` | PUT | Mark notification read |
| `/api/notifications/mark-all-read` | PUT | Mark all read |
| `/api/notifications/send` | POST | Send notification |
| `/api/chats/contacts` | GET | List chat contacts |
| `/api/chats/conversations` | GET | Get user conversations |
| `/api/chats/conversations/create` | POST | Create conversation |
| `/api/chats/messages` | GET | Get conversation messages |
| `/api/chats/messages/send` | POST | Send text message |
| `/api/chats/messages/send-image` | POST | Send image (base64 → file) |
| `/api/chats/messages/send-audio` | POST | Send audio (base64 → file) |
| `/api/chats/messages/{id}/read` | PUT | Mark message read |
| `/api/chats/conversations/{id}/read` | PUT | Mark conversation read |
| `/api/sampling/guide` | GET | Self-sampling guide steps |
| `/api/i18n/{lang}` | GET | Get translations |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/at-risk` | GET | Users with high-risk screening |
| `/api/admin/users/healthy` | GET | Users with only low-risk screenings |
| `/api/admin/dashboard` | GET | Admin dashboard stats |
| `/api/admin/appointments` | GET | All appointments |
| `/api/admin/lab-results` | GET | All lab results |
| `/api/admin/followups` | GET | All follow-ups |
| `/api/admin/report/generate` | POST | Generate report |
| `/api/admin/reports` | GET | Get user reports |
| `/api/admin/notification/send` | POST | Send admin notification |

### Screenshots/Media Upload
Image and audio messages can be sent as base64 in the JSON body. The server decodes and saves them to `backend/uploads/`. File URLs are returned and stored in the database.

### CORS
Enabled globally via `flask-cors` — the API accepts requests from any origin (needed for both the mobile app and the admin web portal).

---

## Admin Portal (`admin/app.py`)

**497 lines** — Flask + Jinja2 + Bootstrap 5 web app.

### Authentication
- Login endpoint with hardcoded credentials: `admin@cervitrack.com` / `admin123`
- Session-based auth using Flask's `session` (signed cookies)
- `login_required` decorator on all protected routes
- Logout clears session

### Context Processor
`inject_settings()` — injects `admin_lang` and `admin_theme` into ALL templates from `session`. This is how the settings page persists language/theme choices.

### Routes (17)

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Redirect to dashboard or login |
| `/login` | GET/POST | Admin login form |
| `/dashboard` | GET | Analytics dashboard |
| `/users` | GET | User list with search/filter |
| `/users/at-risk` | GET | Filtered: high-risk users |
| `/users/healthy` | GET | Filtered: low-risk users |
| `/user/{id}` | GET | User detail with tabs |
| `/user/{id}/notify` | POST | Send notification to user |
| `/user/{id}/report` | GET | Generate user report PDF |
| `/reports` | GET | All reports list |
| `/vaccines` | GET | Vaccine records |
| `/vaccines/add` | POST | Add vaccine record |
| `/notifications` | GET | Notification log |
| `/appointments` | GET | Appointments list (filterable) |
| `/appointments/{id}/status` | POST | Update appointment status |
| `/lab-results` | GET | Lab results |
| `/lab-results/add` | POST | Add lab result |
| `/followups` | GET | Follow-up list |
| `/followups/{id}/toggle` | POST | Toggle follow-up completion |
| `/settings` | GET/POST | Language, theme, app info |
| `/logout` | GET | Clear session, redirect to login |
| `/api/appointments` | GET | JSON appointments API |
| `/api/lab-results` | GET | JSON lab results API |
| `/api/followups` | GET | JSON follow-ups API |

### Templates (13 Jinja2 files)

All templates extend `base.html` which provides:
- **Sidebar**: Navigation links, each highlights when active (checked via `request.path`)
- **Topbar**: User name, language badge (`admin_lang|upper`), logout button
- **Dark mode**: `data-bs-theme="{{ admin_theme }}"` on `<html>` element + CSS custom properties for colors. Bootstrap 5.3's built-in dark mode class plus custom CSS overrides for cards, tables, and muted text.
- **Flash messages**: Bootstrap dismissible alerts

### Mock Data
All admin pages use in-memory mock data (MOCK_USERS, MOCK_SCREENINGS, MOCK_VACCINES, etc.) — no database calls. The admin optionally calls the backend API for live data but gracefully falls back to mocks on failure.

---

## Configuration Files

### `app.json`
Expo configuration:
- App name: CERVITRACK, slug: cervitrack
- Android package: `com.ecnord.cervitrack`
- EAS project ID: `7c04a79f-c03a-4c9f-9e1e-4e9f147f7cb4`
- **Permissions**: CAMERA, INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, RECORD_AUDIO, POST_NOTIFICATIONS, READ_EXTERNAL_STORAGE, READ_MEDIA_IMAGES, VIBRATE, WAKE_LOCK, SCHEDULE_EXACT_ALARM

### `eas.json`
EAS Build profiles:
- `development` — dev client, internal distribution
- `preview` — internal distribution (used for APK builds)
- `production` — with auto-increment

### `tsconfig.json`
Extends `expo/tsconfig.base` with strict mode and `react-jsx`.

### `package.json`
Key dependencies:
- `expo` ~46.0, `react-native` 0.85, `react` 19.2
- `@react-navigation/*` v7 (native, native-stack, bottom-tabs)
- `i18next` 26.3 + `react-i18next` 17.0
- `expo-notifications`, `expo-image-picker`, `expo-av`
- `react-native-calendars`
- TypeScript 6 + `@types/react` 19

---

## Data Flow Patterns

### Offline-First
1. **Auth**: Users stored entirely in AsyncStorage (`@cervitrack_users`). No network needed for registration or login.
2. **API calls**: Every `api.ts` function wraps `fetch` in try/catch. On network failure, returns mock data.
3. **Theme/Language**: Persisted to AsyncStorage, restored on app boot.
4. **Notifications**: In-app notifications stored in AsyncStorage (`@cervitrack_notifications`).

### Theme Cascading
```
User toggles Switch in SettingsScreen
  → ThemeContext.toggleTheme() flips isDark state
  → useMemo recomputes colors object (light vs dark palette)
  → All components using useTheme() re-render
  → AppNavigator's Tab/Stack keys force re-mount with new screenOptions
  → StatusBar updates barStyle
  → Colors throughout app update (bg, card, text, primary, border, etc.)
```

### Language Switching
```
User taps "Kiswahili" in SettingsScreen
  → LanguageContext.setLanguage('sw')
  → setLanguageState('sw') — updates context value
  → i18n.changeLanguage('sw') — i18next emits languageChanged event
  → react-i18next's useTranslation() detects event
  → All components using t() re-render with new translations
  → I18nextProvider ensures hook is connected to correct i18n instance
```

### Screening Flow
```
User opens ScreeningScreen
  → Question 1 (age) appears with morph animation
  → User enters age → Next → Question 2 or skip if <18
  → ...continues through 3-11 questions based on conditions
  → Score calculated: ≥5 HIGH, ≥3 MODERATE, <3 LOW
  → Result screen with color-coded verdict
  → submitScreening() POST to backend (or mock)
  → Notification added locally via NotificationContext
```

---

## TypeScript Types

### `User` (AuthContext)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'patient' | 'chw' | 'nurse' | 'lab' | 'admin';
  photo: string;
  birthDate: string;
  lastHealedDate: string;
  location: string;
  createdAt: string;
}
```

### `ThemeColors` (ThemeContext)
```typescript
interface ThemeColors {
  bg: string; card: string; text: string; textSecondary: string;
  primary: string; primaryLight: string; secondary: string;
  accent: string; border: string; error: string; success: string;
  warning: string; inputBg: string; tabBar: string; statusBar: string;
}
```

### `Notification` (NotificationContext)
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'screening' | 'vaccine' | 'appointment' | 'reminder' | 'alert';
  read: boolean;
  createdAt: string;
}
```

---

## Design Decisions

1. **Separate chats.db from cervitrack.db** — Chat volume won't bloat clinical data. Also allows different backup strategies.
2. **Mock fallback in every API function** — App works fully offline without backend dependency. Essential for demo reliability.
3. **OTP accepts any 6 digits** — Simplifies live demo flow. No SMS gateway needed.
4. **Phone+OTP as primary login** — Aligns with Kenya's low-literacy users (WhatsApp-style authentication).
5. **Keys on navigators for theme** — React Navigation doesn't re-evaluate `screenOptions` on re-render; forcing re-mount with `key` is the reliable fix.
6. **I18nextProvider wrapping** — Ensures `react-i18next`'s `useTranslation` receives language change events reliably.
7. **All screens in single component tree** — Pure React Navigation (no react-router). Expo best practice.
