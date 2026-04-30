/**
 * NeuroChain – Design System v2
 * Professional healthcare-grade palette.
 * Primary: Vibrant Blue  |  Background: Slate White  |  Text: Deep Navy
 */

export const colors = {
  // ── Primary Brand ───────────────────────────────────────────────
  primary:       '#2563EB',   // Vibrant blue (buttons, active states)
  primaryDark:   '#1D4ED8',   // Pressed / darker blue
  primaryLight:  '#EFF6FF',   // Very light blue tint (backgrounds)
  primaryMid:    '#BFDBFE',   // Mid blue (borders, chips)

  // ── Secondary / Accent ──────────────────────────────────────────
  secondary:     '#7C3AED',   // Purple (premium badge, AI features)
  secondaryLight:'#EDE9FE',
  accent:        '#06B6D4',   // Cyan (highlights, tags)
  accentLight:   '#ECFEFF',
  accentDark:    '#0891B2',

  // ── Semantic ────────────────────────────────────────────────────
  success:       '#10B981',   // Green
  successLight:  '#D1FAE5',
  successDark:   '#059669',
  warning:       '#F59E0B',   // Amber
  warningLight:  '#FEF3C7',
  danger:        '#EF4444',   // Red
  dangerLight:   '#FEE2E2',
  dangerDark:    '#DC2626',

  // ── Neutrals ────────────────────────────────────────────────────
  cream:         '#F8FAFC',   // App background (near-white)
  white:         '#FFFFFF',
  surface:       '#FFFFFF',   // Card surface
  surfaceAlt:    '#F1F5F9',   // Slightly off-white for input bg
  border:        '#E2E8F0',   // Dividers, input borders
  borderDark:    '#CBD5E1',
  lightGrey:     '#F1F5F9',
  mediumGrey:    '#E2E8F0',
  darkGrey:      '#94A3B8',   // Placeholder text, muted labels

  // ── Text ────────────────────────────────────────────────────────
  textDark:      '#0F172A',   // Headings
  textBody:      '#334155',   // Body text
  textMuted:     '#64748B',   // Captions, helper text
  textLight:     '#FFFFFF',
  textWarmBrown: '#64748B',   // Keep alias for backward compat

  // ── Transparent Tints ───────────────────────────────────────────
  primaryTransparent:   'rgba(37, 99, 235, 0.08)',
  secondaryTransparent: 'rgba(124, 58, 237, 0.08)',
  successTransparent:   'rgba(16, 185, 129, 0.08)',
  dangerTransparent:    'rgba(239, 68, 68, 0.08)',
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
    color: colors.secondary,
    badge: 'Premium',
  },
};

/** Shared design tokens */
export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
  },
};
