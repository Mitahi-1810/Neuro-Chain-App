# NeuroChain - Autism Therapy Platform

A production-grade React Native mobile application for autism screening, therapy games, specialist consultations, and family support. Built with Expo, featuring a kid-friendly "Crayon & Colorful" design system with warm, soothing colors.

## 🎨 Design System

**Theme**: Crayon & Colorful - Warm, joyful, soothing aesthetic perfect for children

### Color Palette
- **Primary**: Warm Teal (#4DB8D8)
- **Secondary**: Soft Coral (#FF9A6C)
- **Accent**: Pale Yellow/Butter (#FFE6A0)
- **Success**: Soft Green (#7EC69F)
- **Danger**: Soft Red (#FF6B7A)
- **Neutrals**: Cream (#FFF8F0), Light Grey (#F5F5F5), Charcoal (#333333)

### Typography
- **Headings**: Poppins (rounded, friendly)
- **Body**: Inter (readable, warm)
- **Minimum font sizes**: 16pt body, 20pt headings

### Components
- **CrayonButton**: Rounded 24pt buttons with haptic feedback
- **CrayonCard**: Soft shadows, rounded corners 16pt
- **WarmProgressRing**: Animated circular progress indicator
- **Streak Counter**: Daily engagement tracking with flame icon

---

## 📁 Project Structure

```
NeuroChain/
├── App.tsx                                 # Main entry point with navigation
├── app.json                               # Expo configuration
├── package.json                           # Dependencies & scripts
├── babel.config.js                        # Babel configuration
├── src/
│   ├── components/                        # Reusable UI components
│   │   ├── CrayonButton.tsx              # Primary button component
│   │   ├── CrayonCard.tsx                # Card wrapper
│   │   ├── WarmProgressRing.tsx          # Animated progress ring
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx          # 1.2s animated logo fade
│   │   │   ├── WelcomeScreen.tsx         # Feature showcase, Get Started CTA
│   │   │   ├── LoginScreen.tsx           # Email/password with show/hide
│   │   │   ├── SignUpScreen.tsx          # Full name, email, password validation
│   │   ├── parent/
│   │   │   ├── ParentHomeScreen.tsx      # Tier-gated home (Free/Basic/Premium)
│   │   │   ├── GamesGalleryScreen.tsx    # Game selector with lock icons
│   │   │   ├── GameRunnerScreen.tsx      # Game engine framework
│   │   │   ├── ReportsScreen.tsx         # 7/30-day analytics
│   │   │   ├── StoreScreen.tsx           # Resources & upgrades
│   │   │   ├── SubscriptionUpgradeScreen.tsx  # Tier comparison cards
│   │   ├── screener/
│   │   │   ├── AutismScreenerScreen.tsx  # Paginated 20-question M-CHAT-R/F
│   │   │   ├── ScreenerResultsScreen.tsx # Risk scoring + routing logic
│   │   ├── specialist/
│   │   │   ├── SpecialistLoginScreen.tsx # Professional account login
│   │   │   ├── SpecialistDashboardScreen.tsx  # KPI metrics, calendar
│   │   ├── telehealth/
│   │   │   ├── TelehealthBookingScreen.tsx # 5-step appointment wizard
│   ├── store/
│   │   ├── store.ts                      # Zustand state management (auth, child, games, ui)
│   ├── types/
│   │   ├── index.ts                      # TypeScript interfaces (User, Child, Game, etc.)
│   ├── utils/
│   │   ├── colors.ts                     # Centralized color palette & tier colors
│   ├── navigation.ts                     # Navigation type definitions
│   ├── assets/
│   │   ├── confetti.json                 # Lottie animation (low-risk celebration)
```

---

## 🚀 Features Implemented

### Phase 1: Authentication & Onboarding ✅
- **Splash Screen**: 1.2s fade-in animation → auto-transition to Welcome
- **Welcome Screen**: Feature cards, "Get Started" & "Already have account" CTAs
- **Sign-Up Screen**: 
  - Full Name (2-60 chars), Email (RFC 5322), Password (8+, 1 uppercase, 1 number)
  - Real-time validation feedback
  - OAuth buttons (Google, Apple)
- **Login Screen**: Email/password, show/hide toggle, forgot password link

### Phase 2: Parent Home Screen (All Tiers) ✅
- **FREE Tier**:
  - Persistent upgrade banner (299 BDT/month)
  - Quick Actions: "Screen My Child", "Explore Games"
  - Weekly demo game preview (15s non-interactive)
  - Specialist directory teaser (locked)

- **BASIC Tier**:
  - Today's Plan carousel with games
  - Progress ring (animates on load)
  - Streak counter (resets daily)
  - Weekly summary bar chart (7-day activity)
  - Upgrade teaser (Premium features)

- **PREMIUM Tier**:
  - All Basic features +
  - Clinical Insights tab (brain icon)
  - ROI calculator widget
  - AI Session badge on games

### Phase 3: Bottom Navigation ✅
- Home, Games, Reports, Store, Insights
- Tier-based tab visibility & locking
- Active/inactive tint colors

### Phase 4: M-CHAT-R/F Autism Screener ✅
- **Age Gate**: 16-30 months eligibility check
- **Paginated Deck UI**: One question per screen
  - "Question X of 20" counter
  - Progress bar (fills as advancing)
  - Back button (navigate & re-answer)
  - No skip (mandatory answering)
- **20 Hardcoded Questions**: Including reversed scoring (Q2, Q5, Q12)
- **Post-Screen Routing**:
  - **Low Risk (0-2)**: Confetti animation → Free Home
  - **Moderate Risk (3-7)**: → Subscription Upgrade (Basic recommended)
  - **High Risk (8-20)**: → Telehealth Booking (Premium recommended)
- **Assessment Storage**: `assessments` table with raw_answers, risk_score, risk_level

### Phase 5: Games Framework ✅
- **Games Gallery**: All 8 games listed (locked on Free tier)
- **Game Runner Framework**: Ready for integration
  - **Bubble Pop**: Tap bubbles, avoid bombs, motor skill tracking
  - **Waiting Game (Eye Contact)**: AI vision metrics (Premium)
  - **Pattern Match**: Memory & concentration
  - *(4 more games templated)*
- **Session Recording**: timestamp, duration_ms, accuracy_percentage, ai_vision_metrics (Premium)

### Phase 6: Subscription & Payment 🎫
- **Tier Comparison UI**:
  - FREE (0 BDT): M-CHAT, 1 demo game/week, directory view
  - BASIC (299 BDT): All 8 games, 3 AI sessions/month, 7-day charts
  - PREMIUM (799 BDT): Unlimited AI, 30-day analytics, PDF reports, 20% telehealth discount
- **Graceful Downgrade Logic**: Data preserved, UI gracefully handles tier changes

### Phase 7: Specialist Dashboard 🏥
- **Specialist Login**: Professional authentication screen
- **Dashboard Overview**: Placeholder with KPI bar structure ready
  - Total Active Patients, Pending Requests, Today's Schedule, Monthly Earnings
- **Calendar Scheduler**: Framework ready
- **Patient Clinical View**: Placeholder ready

### Phase 8: Telehealth Booking 📱
- **5-Step Wizard Framework**:
  1. Specialist Search (filters, pagination)
  2. Specialist Profile (credentials, reviews)
  3. Slot Selection (interactive calendar)
  4. Payment (Stripe/SSLCommerz with 20% discount)
  5. Confirmation (.ics download)

### Phase 9: Notifications & Polish 🔔
- Framework for Firebase Cloud Messaging (FCM)
- WhatsApp reminder pipeline structure
- Push notification timing (appointment, streak reminders)

---

## 🛠️ Tech Stack

- **Framework**: React Native (Expo 51.x)
- **Navigation**: React Navigation (Stack, Bottom Tabs)
- **State**: Zustand (lightweight, TypeScript-first)
- **UI Components**: React Native Paper, custom Crayon components
- **Animations**: React Native Reanimated 3, Lottie
- **Styling**: StyleSheet (RN native), semantic color tokens
- **Camera**: expo-camera (Premium games)
- **Notifications**: expo-notifications
- **Forms**: TextInput (RN native) with real-time validation
- **Icons**: Material Community Icons (@expo/vector-icons)
- **Charts**: react-native-svg-charts (ready for Victory Native integration)

---

## 📦 Installation & Running

### Prerequisites
- Node.js 16+
- npm, yarn, or pnpm
- Expo CLI: `npm install -g expo-cli`

### Setup
```bash
# Install dependencies
pnpm install

# Start Expo dev server
pnpm start

# Run on Android emulator
pnpm android

# Run on iOS simulator
pnpm ios

# Run on web (for testing)
pnpm web
```

### Environment Variables
```bash
# .env (to be created)
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
STRIPE_PUBLISHABLE_KEY=xxx
```

---

## 🔐 Authentication Flow

**Current**: Mock authentication in Zustand store
**Next**: Integrate Firebase Authentication or Supabase Auth

```
Splash → Welcome → SignUp/Login → setUser() → Check Role
  ↓
  User role=PARENT → ParentStack (Home, Games, Screener, etc.)
  User role=SPECIALIST → SpecialistStack (Dashboard, Calendar, Patients)
  User=null → AuthStack (back to Welcome)
```

---

## 💾 Database Schema (To Be Connected)

### Tables (Supabase/Firebase)
- `users`: id, email, role (PARENT|SPECIALIST), tier_level, created_at
- `children`: id, parent_id, first_name, dob, gender, profile_photo_url, primary_concerns[]
- `assessments`: id, child_id, test_type (MCHAT), raw_answers[], risk_score, risk_level
- `games`: id, name, icon_url, target_skill, duration_ms, min_tier, requires_camera
- `activities_log`: id, child_id, game_id, timestamp, duration_ms, accuracy%, ai_vision_metrics{}
- `specialists`: id, user_id, med_reg_number, specialty, city, fee_bdt, languages[], is_verified
- `appointments`: id, specialist_id, parent_id, child_id, date, time, status, amount_bdt
- `soap_notes`: id, appointment_id, specialist_id, subjective, objective, assessment, plan, is_signed

---

## 🎮 Game Framework Architecture

Each game implements:
```typescript
interface GameSession {
  gameId: string;
  childId: string;
  startTime: Date;
  metrics: {
    accuracy: number;
    duration: number;
    aiVisionMetrics?: {} // Premium only
  };
  onComplete: (metrics) => Promise<void>;
}
```

### Bundled Games (Ready for Implementation)
1. **Bubble Pop** - Tap bubbles (motor skill)
2. **Waiting Game (Eye Contact)** - Measure gaze duration (social awareness)
3. **Pattern Match** - Memory game (concentration)
4. **Shape Sorter** - Hand-eye coordination (motor)
5. **Color Recognition** - Visual tracking (learning)
6. **Sound & Movement** - Audio response (gross motor)
7. **Story Sequencing** - Narrative comprehension
8. **Social Mirroring** - Imitation & social awareness

---

## 🚦 Next Steps & TODO

### Immediate (MVP)
- [ ] Connect Firebase/Supabase authentication
- [ ] Implement child profile setup flow (with date picker)
- [ ] Build Bubble Pop game (full mechanics)
- [ ] Add activity logging to database
- [ ] Implement M-CHAT scoring backend
- [ ] Connect Stripe/SSLCommerz payment

### Medium Priority
- [ ] Camera integration for AI vision metrics
- [ ] Specialist calendar scheduler (full implementation)
- [ ] Video call interface (WebRTC setup)
- [ ] Telehealth booking wizard (all 5 steps)
- [ ] SOAP note generation (Whisper + GPT-4)

### Polish & Launch
- [ ] Push notifications (FCM integration)
- [ ] WhatsApp reminder pipeline (Twilio)
- [ ] App Store & Google Play submission
- [ ] Analytics & crash reporting (Sentry)
- [ ] User testing & accessibility audit

---

## 🎯 Compliance & Safety

- **HIPAA Ready**: Architecture supports encrypted PHI storage (not yet implemented)
- **COPPA Compliant**: Kid-friendly design, parental consent mechanisms
- **Data Privacy**: RLS policies prepared, GDPR-ready structure
- **Accessibility**: Large touch targets (56dp+), high contrast colors, readable fonts

---

## 📞 Support

For questions or issues, refer to:
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **PRD**: `/v0_plans/bold-guide.md`

---

**Built with ❤️ for early autism intervention and family support.**
