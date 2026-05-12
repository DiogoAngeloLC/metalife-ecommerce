---
name: High-Velocity Pilates Marketplace
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#5c3f40'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#906f70'
  outline-variant: '#e5bdbe'
  surface-tint: '#be0037'
  primary: '#b80035'
  on-primary: '#ffffff'
  primary-container: '#e11d48'
  on-primary-container: '#fffaf9'
  inverse-primary: '#ffb3b6'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#535b71'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c738a'
  on-tertiary-container: '#fcfaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b6'
  on-primary-fixed: '#40000c'
  on-primary-fixed-variant: '#920028'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-price:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-tag:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 20px
---

## Brand & Style

This design system is engineered for high-velocity commerce within the Pilates equipment sector. It adopts a **High-Contrast / Bold** aesthetic that prioritizes transactional clarity and psychological urgency. The brand personality is aggressive yet professional—mimicking the efficiency of a high-end industrial classifieds platform. 

The visual narrative focuses on "The Deal." By utilizing a high density of information and prominent price anchoring, the system moves away from lifestyle aspiration and toward functional acquisition. The style leverages thin, precise borders and a rigid structure to convey reliability, while "Urgent" color accents trigger immediate user action.

## Colors

The palette is designed for maximum functional contrast. 
- **Action Red (#E11D48):** Reserved exclusively for conversion points: "Buy Now" buttons, "Price Drop" indicators, and "Sale" tags.
- **Trust Blue (#2563EB):** Used for "Verified Seller," "Certified Refurbished," and "Secure Transaction" badges to provide a calming counterpoint to the aggressive primary red.
- **Backgrounds:** Use a bright white (#FFFFFF) for primary surfaces and a very light gray (#F8FAFC) for section grouping to maintain a "clean sheets" professional look.
- **Typography & Borders:** Use a deep Slate (#0F172A) for high-readability text and a cool gray (#E2E8F0) for structural borders.

## Typography

The typography system is split between **Montserrat** for high-impact display and **Inter** for dense data presentation. 
- **Headlines:** Use tight tracking (letter-spacing) to create a sense of compactness and urgency. 
- **Prices:** Numbers are treated as the primary visual hook. Large, heavy-weight Montserrat digits ensure the price is the first thing a user sees.
- **Labels:** Small, uppercase labels with slightly wider tracking are used for secondary metadata (e.g., "LOCATION," "CONDITION") to maintain the classifieds aesthetic.

## Layout & Spacing

This system utilizes a **12-column Fixed Grid** for desktop and a **4-column Fluid Grid** for mobile. 
- **Density:** Spacing is intentionally tight to maximize information above the fold. Gutters are fixed at 16px to allow for more content columns in product listings.
- **Alignment:** Use hard-left alignment for all text to emphasize the structured, list-based nature of classifieds.
- **Breakpoints:** 
  - Mobile: < 600px (16px margins)
  - Tablet: 600px - 1024px (24px margins)
  - Desktop: 1024px+ (Fixed 1200px max-width container)

## Elevation & Depth

To maintain a professional and "grounded" feel, this design system avoids soft shadows and blurs.
- **Bold Borders:** Depth is communicated through 1px solid borders (#E2E8F0).
- **Tonal Layers:** High-priority cards or "Featured" listings should use a very subtle light gray background (#F1F5F9) rather than a shadow to separate themselves from the main canvas.
- **Flat UI:** Buttons and inputs are flat. Interaction states (hover/active) are communicated via color shifts (e.g., Action Red darkening by 10%) rather than physical elevation.

## Shapes

The shape language is rigid and industrial. A universal **4px radius** (Soft) is applied to all buttons, input fields, and product cards. This small radius maintains a "precision tool" feel appropriate for expensive Pilates machinery while avoiding the clinical harshness of 0px sharp corners.

## Components

- **Buttons:** Primary buttons use Action Red (#E11D48) with white, bold Montserrat text in all-caps. Secondary buttons use a 1px Slate border with no fill.
- **Price Highlights:** Prices should be encapsulated in high-contrast containers or simply set in the `display-price` style. For discounts, show the original price in a small, strikethrough gray font next to the red sale price.
- **Badges:** Use "Trust Blue" for technical specs (e.g., "BALANCED BODY®") and Action Red for scarcity (e.g., "ONLY 1 LEFT"). Badges are rectangular with 2px corners.
- **Product Cards:** High-density cards. Include image, title, price, location, and a "Save" icon. Use thin borders to separate cards in a grid rather than whitespace.
- **Input Fields:** Squared-off corners, 1px Slate-200 border. Labels sit directly above the field in `label-bold` style.
- **Flash Sales/Countdown:** Use a prominent bar at the top of the screen or within a card using Action Red background and white text to drive immediate clicks.