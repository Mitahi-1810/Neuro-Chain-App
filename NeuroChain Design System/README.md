# NeuroChain Design System

## Overview

**NeuroChain** is a multi-sided pediatric digital health platform purpose-built for autism care in South Asia (Bangladesh-first). The product bridges the gap between parental concern and clinical intervention through:

- **Clinically validated screening** — M-CHAT-R/F autism screener (age-gated 16–30 months)
- **Gamified ABA therapy** — 8 daily therapy games targeting motor, social, emotional, and cognitive skills
- **Telehealth consultations** — Specialist booking, video calls, AI-generated SOAP notes
- **Progress analytics** — 7/30-day charts, PDF reports, AI camera-assisted behavioral metrics
- **Multi-role platform** — Parent, Clinical Specialist, and Caregiver views

**Source repository:** https://github.com/Mitahi-1810/Neuro-Chain-App (branch: `main`)

---

## Products / Surfaces

| Surface | Stack | Notes |
|---|---|---|
| **Mobile App (iOS + Android)** | React Native (Expo), Zustand, Reanimated 3 | Primary product — all features live here |
| **Web (Next.js scaffold)** | Next.js, Tailwind CSS v4 | Minimal scaffold only (`app/page.tsx`); design lives in mobile app |

---

## Content Fundamentals

### Voice & Tone
- **Warm, empathetic, clinical-lite.** The product talks to parents of young children with ASD — it must feel supportive, not alarming.
- **Simple language.** Medical terms are avoided. "Your child may benefit from a specialist evaluation" — not "elevated M-CHAT score indicates ASD risk."
- **You-first.** Always "your child", "your plan", not "the user's child".
- **Calm urgency.** Even high-risk screener results use gentle language: *"Your responses suggest your child may benefit from a specialist evaluation. Please consider booking an appointment."*
- **Action-oriented CTAs.** "Get Started", "Play", "Unlock", "Book Now" — short, imperative, confidence-inspiring.
- **Bengali + English bilingual.** The app uses i18n (`useI18n` hook) and includes a `LanguageToggle` component on auth screens. Copy is authored in English first, then translated.

### Casing & Punctuation
- Headline/title casing for screen titles: "Therapy Games Library", "Today's Plan"
- Sentence casing for body copy and descriptions
- Numbers written as numerals (e.g. "3 AI sessions/month", "299 BDT")
- Currency always "BDT" suffix, e.g. "799 BDT/month"

### Emoji Usage
- Emoji are used sparingly in **feature cards and game descriptions** (e.g. 🎮, 📊, 👨‍⚕️) on the Welcome screen
- **Not** used in navigation, KPIs, or clinical contexts
- Icon library (Material Community Icons) is preferred over emoji in all other UI

### Example Copy
- Headline: *"Early Support Starts Here"*
- Subheadline: *"Autism screening and daily therapy for your child."*
- Disclaimer: *"Not a substitute for professional diagnosis."*
- Upgrade banner: *"Unlock Daily Autism Therapy. Upgrade to Basic — 299 BDT/month."*
- Low-risk screener result: *"Great news! Based on your responses, your child shows low indicators at this time. Continue monitoring development."*
- AI draft label: *"AI Draft — Requires Clinical Review"*

---

## Visual Foundations

### Color System
The palette is **professional healthcare-grade** — blues and purples signal trust and clinical authority. Backgrounds are light and airy.

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#2563EB` | Buttons, active tabs, progress, links |
| `primaryDark` | `#1D4ED8` | Pressed states |
| `primaryLight` | `#EFF6FF` | Background tints, ghost buttons, card accents |
| `primaryMid` | `#BFDBFE` | Borders, chips |
| `secondary` | `#7C3AED` | Premium badge, AI features, progress ring gradient end |
| `accent` | `#06B6D4` | Cyan — highlights, tags |
| `success` | `#10B981` | Completed states, low-risk results |
| `warning` | `#F59E0B` | Amber — unlock buttons, caution states |
| `danger` | `#EF4444` | Error states, high-risk indicators |
| `cream` | `#F8FAFC` | App background |
| `white` | `#FFFFFF` | Card surfaces |
| `surfaceAlt` | `#F1F5F9` | Input backgrounds |
| `border` | `#E2E8F0` | Dividers, card borders |
| `textDark` | `#0F172A` | Headings |
| `textBody` | `#334155` | Body text |
| `textMuted` | `#64748B` | Captions, helper text |

### Typography
- **Display/Headings:** Poppins (400, 600, 700, 800 ExtraBold). Rounded, friendly, high legibility.
- **Body/UI:** Inter (400 Regular, 600 SemiBold, 700 Bold). Neutral, warm, readable.
- **Minimum sizes:** 16pt body, 20pt headings (WCAG AA for healthcare context)
- **Letter-spacing:** Headings use `letterSpacing: -0.2` to -0.5 for tighter, modern feel
- **Line heights:** Body text 24px (1.5x), headlines 40px for display sizes

### Spacing & Layout
- **Screen padding:** 16–24px horizontal, 16–24px vertical
- **Section gaps:** 24px between sections
- **Card padding:** 16–20px internal padding
- **Gap between grid items:** 12px

### Border Radius (from `radius` tokens)
| Token | Value | Usage |
|---|---|---|
| `sm` | 8px | Small chips, tags |
| `md` | 14px | Inputs, social buttons |
| `lg` | 20px | Cards (CrayonCard) |
| `xl` | 28px | Large modal surfaces |
| `full` | 999px | Pills, buttons, badges |

### Shadow System
- **sm:** `y:1, blur:4, opacity:0.04` — subtle lift for inputs and back buttons
- **md:** `y:4, blur:10, opacity:0.07` — standard card shadow
- **lg:** `y:8, blur:18, opacity:0.10` — elevated modals, bottom sheets

### Backgrounds
- App backgrounds: flat `#F8FAFC` cream — no gradients, no textures
- Cards: pure white `#FFFFFF` with `shadow.md`
- Section accent backgrounds: `primaryLight` (`#EFF6FF`) for featured cards
- NO full-bleed images, NO gradient backgrounds in main UI
- Progress ring uses a `linear-gradient` from `primary` → `secondary` (blue → purple)

### Animation & Motion
- **Easing:** `withTiming` (linear/ease-out) from Reanimated 3; 1500ms for progress rings
- **Splash screen:** 1.2s fade-in
- **Tab transitions:** standard React Navigation stack animation
- **Progress rings:** animate 0 → value on screen load
- **Confetti:** Lottie animation on low-risk screener result (2s full-screen)
- No bouncy/spring animations in clinical contexts; calm and measured

### Hover / Press States
- `activeOpacity: 0.75` on TouchableOpacity — 25% opacity reduction on press
- Buttons: `primaryDark` (#1D4ED8) on press
- Locked items: `opacity: 0.75` on locked game cards

### Cards
- **CrayonCard:** `borderRadius: 20`, `shadow.md`, white background
- Variants: `default` (white), `soft` (surfaceAlt), `accent` (primaryLight), `primary` (primary blue)
- Border: `1px solid #E2E8F0` on game cards
- No colored left-border accent pattern

### Icons
- **Library:** Material Community Icons (`@expo/vector-icons`) — outlined style
- Size: 24px for navigation, 28–32px for feature icons, 14px for inline meta
- Color: matches semantic context (primary for actions, muted for meta, success/danger for states)

### Tier Color System
| Tier | Color | Badge |
|---|---|---|
| FREE | `#94A3B8` (darkGrey) | "Free" |
| BASIC | `#2563EB` (primary blue) | "Basic" |
| PREMIUM | `#7C3AED` (secondary purple) | "Premium" |

---

## Iconography

NeuroChain uses **Material Community Icons** exclusively via `@expo/vector-icons/MaterialCommunityIcons`. No custom SVG icon set or icon font is bundled.

### Key Icons Used
| Icon Name | Usage |
|---|---|
| `home` / `home-outline` | Home tab |
| `gamepad-variant` | Games tab |
| `chart-line` | Reports tab |
| `tag` | Store tab |
| `brain` | AI Insights tab (Premium) |
| `account-circle` | Profile tab |
| `bell-outline` | Notifications |
| `fire` | Streak counter |
| `clipboard-list` | M-CHAT screener |
| `lock-outline` | Locked/gated content |
| `crown` / `crown-outline` | Premium upgrade prompts |
| `check-circle` | Completed game state |
| `calendar-clock` | Pending requests |
| `cash-multiple` | Earnings |
| `email-outline` | Email input |
| `lock-outline` | Password input |
| `eye-outline` / `eye-off-outline` | Password toggle |
| `google` / `apple` | OAuth buttons |
| `brain` | Logo mark on login screen |

### CDN Reference
Material Community Icons is available via the `@expo/vector-icons` package in the React Native app. For web prototypes and design system cards, use the CDN:
```
https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css
```
Classes follow the pattern `mdi mdi-{icon-name}`.

---

## File Index

```
/
├── README.md                          ← This file
├── SKILL.md                           ← Agent skill definition
├── colors_and_type.css               ← CSS design tokens (colors, typography)
├── assets/
│   └── (no binary assets in source — icon font via CDN)
├── preview/
│   ├── colors-brand.html              ← Brand color palette
│   ├── colors-semantic.html           ← Semantic colors
│   ├── colors-neutrals.html           ← Neutral scale
│   ├── type-scale.html                ← Typography scale
│   ├── type-specimens.html            ← Font specimens
│   ├── spacing-tokens.html            ← Radius + shadow tokens
│   ├── components-buttons.html        ← CrayonButton variants
│   ├── components-cards.html          ← CrayonCard variants
│   ├── components-inputs.html         ← Form inputs
│   ├── components-badges.html         ← Tier badges + skill tags
│   ├── components-progress.html       ← Progress ring + bar
│   └── components-nav.html            ← Bottom navigation bar
└── ui_kits/
    └── app/
        ├── README.md                  ← App UI kit notes
        └── index.html                 ← Interactive mobile prototype
```
