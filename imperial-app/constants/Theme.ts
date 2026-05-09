// Imperial App Design System
export const Colors = {
  background: '#050505', // Ultra Dark
  surface: '#121212',    // Card Background
  surfaceLight: '#1C1C1E', // Apple-style Secondary Surface
  primary: '#D4AF37',    // Imperial Gold
  primaryDark: '#B8860B',
  accent: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: '#2C2C2E',     // Subtle Borders
  error: '#FF453A',      // Apple Red
  success: '#32D74B',    // Apple Green
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20, // Premium Rounded Corners
  xl: 28,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
};
