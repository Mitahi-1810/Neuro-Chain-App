export const colors = {
  // ── Primary Brand ───────────────────────────────────────────────
  primary:       '#7C6FE7',   // Lavender purple — buttons, active states, hero cards
  primaryDark:   '#5F52CF',   // Pressed / darker lavender
  primaryDeep:   '#4A3FB8',   // Deepest tone for shadows + emphasis
  primaryLight:  '#EFEDFF',   // Very light tint (backgrounds, chips)
  primaryMid:    '#D6D2FA',   // Mid lavender (borders, subtle chips)
  primarySoft:   '#9B91F0',   // Mid-bright lavender (secondary accents)

  // ── Secondary / Accent ──────────────────────────────────────────
  secondary:      '#FFD23F',   // Sun yellow (streak, highlights)
  secondaryDark:  '#F2BB17',
  secondaryLight: '#FFF6D4',
  accent:         '#35D0BA',   // Teal (highlights, positive tags)
  accentLight:    '#E5FBF6',
  accentDark:     '#1FA994',
  pink:           '#FF94B6',   // Soft pink (mascot fills, badges)
  pinkLight:      '#FFE4ED',
  coral:          '#FF8C7A',   // Coral (warm illustrations)
  sky:            '#7AC7FF',   // Sky blue (illustrations, badges)
  skyLight:       '#E0F2FF',

  // ── Semantic ────────────────────────────────────────────────────
  success:       '#2CB67D',
  successLight:  '#D1FAE5',
  successDark:   '#059669',
  warning:       '#F4A261',
  warningLight:  '#FFE8D5',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
  dangerDark:    '#DC2626',

  // ── Neutrals ────────────────────────────────────────────────────
  cream:         '#F4F4F8',   // App background — soft warm grey
  white:         '#FFFFFF',
  surface:       '#FFFFFF',   // Card surface
  surfaceAlt:    '#F0EEFE',   // Slightly off-white for input bg
  surfaceWarm:   '#FFF9EE',   // Warm cream for highlight cards
  border:        '#E7E4F8',
  borderDark:    '#CFCAE9',
  lightGrey:     '#F1F0F7',
  mediumGrey:    '#DDDAEC',
  darkGrey:      '#8F8CA8',

  // ── Text ────────────────────────────────────────────────────────
  textDark:      '#1A1830',   // Headings — near black with violet undertone
  textBody:      '#3A345A',
  textMuted:     '#7A7696',
  textWarmBrown: '#9E8458',
  textLight:     '#FFFFFF',

  // Transparent tints
  primaryTransparent:   'rgba(124, 111, 231, 0.08)',
  secondaryTransparent: 'rgba(255, 210, 63, 0.18)',
  successTransparent:   'rgba(44, 182, 125, 0.10)',
  dangerTransparent:    'rgba(239, 68, 68, 0.10)',
};

export const tiers = {
  free: {
    color: colors.darkGrey,
    badge: 'Free',
  },
  basic: {
    color: colors.primary,
    badge: 'Basic',
  },
  premium: {
    color: colors.secondaryDark,
    badge: 'Premium',
  },
};

/** Shared design tokens */
export const radius = {
  xs:   6,
  sm:   10,
  md:   16,
  lg:   22,
  xl:   28,
  xxl:  36,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#1A1830',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1830',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1830',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 22,
    elevation: 7,
  },
  primary: {
    shadowColor: '#7C6FE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
  yellow: {
    shadowColor: '#F2BB17',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 6,
  },
};
