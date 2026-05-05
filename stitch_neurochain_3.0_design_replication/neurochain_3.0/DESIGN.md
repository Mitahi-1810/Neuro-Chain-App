---
name: NeuroChain 3.0
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#474552'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#787584'
  outline-variant: '#c8c4d4'
  surface-tint: '#5750ba'
  primary: '#554db7'
  on-primary: '#ffffff'
  primary-container: '#6e67d2'
  on-primary-container: '#fffbff'
  inverse-primary: '#c5c0ff'
  secondary: '#745b00'
  on-secondary: '#ffffff'
  secondary-container: '#fdcc22'
  on-secondary-container: '#6e5700'
  tertiary: '#544cbc'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e66d7'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c5c0ff'
  on-primary-fixed: '#130067'
  on-primary-fixed-variant: '#3f36a0'
  secondary-fixed: '#ffe08b'
  secondary-fixed-dim: '#f0c110'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c5c0ff'
  on-tertiary-fixed: '#130067'
  on-tertiary-fixed-variant: '#3f34a5'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  question-text:
    fontFamily: Nunito
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 32px
  headline-title:
    fontFamily: Nunito
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
  section-subtitle:
    fontFamily: Nunito
    fontSize: 17px
    fontWeight: '700'
    lineHeight: 24px
  body-default:
    fontFamily: Nunito
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-secondary:
    fontFamily: Nunito
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  metadata-small:
    fontFamily: Nunito
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 20px
  gutter: 16px
  card-padding: 16px
  list-item-gap: 12px
---

## Brand & Style

The brand personality is energetic, intellectually stimulating, and highly gamified. This design system is engineered to evoke a sense of progress and cognitive achievement, transforming a learning environment into a vibrant, high-stakes arena for mental growth. The interface balances academic rigor with the playfulness of a high-end mobile game.

The chosen style is **Tactile Modern**. It utilizes substantial border radii, subtle depth through soft shadows, and high-contrast accents to create a physical, "clickable" feel. The visual language is punctuated by chunky, flat vector illustrations featuring South Asian skin tones and bold primary colors, ensuring the interface feels inclusive, friendly, and grounded in a contemporary global aesthetic.

## Colors

The palette is anchored by a sophisticated hierarchy of purples, used to denote action and structural importance. The app background is a soft, off-white grey that allows the pure white cards to pop with clarity. 

Yellow Gold is the primary driver for conversion and celebration, reserved for Call-to-Action buttons, selected answers, and achievement highlights. For gamification elements, a distinct set of secondary vibrants—Teal, Green, and Orange—are used for badges and experience point tracking. This high-contrast approach ensures that "active" information is immediately distinguishable from static content.

## Typography

This design system exclusively utilizes Nunito to capitalize on its rounded, friendly terminals which mirror the soft UI shapes. The hierarchy is heavily weighted towards the top, with Question Text and Titles using Extra Bold (800) and Black (900) weights to dominate the visual field. 

Body text remains highly legible at 14px, utilizing a Semi-Bold (600) weight as the standard to maintain the "chunky" and robust feel of the brand. Secondary labels and metadata scale down in size and weight to provide clear informational relief without sacrificing readability.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with generous safe-area margins to ensure the content feels breathable. A 4px baseline grid governs all spatial relationships, with most components utilizing multiples of 8px for internal padding.

Vertical stacking is the primary layout rhythm. Mobile views should maintain a 20px horizontal margin. Elements within cards and list items are spaced to prioritize touch targets and visual grouping, ensuring that the interface remains accessible for fast-paced interaction.

## Elevation & Depth

Depth is conveyed through a **Tonal Layering** system combined with soft, ambient shadows. The primary canvas (#EBEBEB) acts as the lowest floor. Content is organized into white cards (#FFFFFF) that appear to float slightly above the surface.

Shadows are used sparingly and with high diffusion (0 2px 12px rgba(0,0,0,0.06)) to avoid a "heavy" look. The Purple Header Dark creates a sense of containment at the top of the viewport, while the Bottom Nav uses a soft top-edge shadow to indicate it sits on the highest Z-index, persistent above all other scrolling content.

## Shapes

The shape language is defined by extreme roundedness, reinforcing the approachable and tactile nature of the brand. Major content containers use a 20px radius, while interactive list items use a slightly tighter 16px radius.

A signature element of the design system is the use of **Hexagonal Badges**. These are created using a specific clip-path to denote achievement and status. Buttons and profile-level progress bars utilize a full pill shape (50px) to maximize the "friendly" aesthetic and provide clear affordance for tapping.

## Components

**Buttons & CTAs**  
Primary actions and selected answers must use the Yellow Gold (#F5C518) background with the pill-shaped (50px) geometry. Text within these buttons should be centered and set in Nunito 800.

**Cards & List Items**  
White cards (#FFFFFF) use a 20px radius and a 0 2px 12px shadow. List items within these cards or as standalone elements use a 16px radius and a subtle border or background change for active states.

**Progress Bars**  
Two distinct scales are used:
- **Profile/Header:** 36px tall pill-shaped tracks using Progress Bar Track (#E8E6FF) for the background and Primary Purple (#7B74E0) for the fill.
- **In-card/Small:** 8px tall tracks for secondary progress indicators.

**Hexagonal Badges**  
Used for achievements and rank icons. Use `clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`. These should be filled with the Teal, Green, or Orange badge colors.

**Bottom Navigation**  
A 72px tall persistent bar with a 24px top-left and top-right radius. It features a white background and a shadow to separate it from the app content.

**Input Fields & Questions**  
Question text should be prominent at 26px. Answer options should be styled as large, selectable cards that transition to Yellow Gold when active.