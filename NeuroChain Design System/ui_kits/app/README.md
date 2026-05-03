# NeuroChain Mobile App — UI Kit

## Overview
High-fidelity click-through prototype of the NeuroChain React Native mobile app.
Covers the Parent persona across all major screens.

## Screens Included
1. **Welcome** — Feature cards, Get Started / Login CTAs
2. **Login** — Email/password form, OAuth, validation states
3. **Home (Basic Tier)** — Today's Plan, streak, progress ring, weekly chart
4. **Games Gallery** — All 8 therapy games, skill tags, tier locking
5. **Specialist Dashboard** — KPI grid, today's appointments

## Design Notes
- Colors: `src/utils/colors.ts` — primary `#2563EB`, secondary `#7C3AED`
- Fonts: Poppins (headings/CTAs) + Inter (body/labels)
- Icons: Material Design Icons (MDI) via CDN
- All interactions are click-through (no real auth/data)
- Bottom nav highlights the active screen
