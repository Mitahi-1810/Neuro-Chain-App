import { colors } from './colors';

/**
 * NeuroChain Typography System
 * Playful, chunky display + clean reading body.
 */

export const typography = {
  // Hero / Display — landing/welcome
  hero: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 40,
    fontWeight: '800' as const,
    color: colors.textDark,
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  // Screen Title (h1)
  h1: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 30,
    fontWeight: '800' as const,
    color: colors.textDark,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  // Section Heading (h2)
  h2: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.textDark,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  // Card Title (h3)
  h3: {
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textDark,
    lineHeight: 22,
  },
  // Subheading
  h4: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textDark,
    lineHeight: 20,
  },
  // Body Large
  bodyLg: {
    fontFamily: 'Nunito',
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textBody,
    lineHeight: 24,
  },
  // Body
  body: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textBody,
    lineHeight: 21,
  },
  // Label
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textBody,
    letterSpacing: 0.2,
  },
  // Caption / Muted
  caption: {
    fontFamily: 'Nunito',
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Badge / Tag
  badge: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  // Eyebrow (tiny screaming caps)
  eyebrow: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.primary,
  },
  // CTA / Button Text
  btnText: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
};
