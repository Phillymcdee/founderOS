/**
 * Design system constants for Ideas Dashboard
 * Provides consistent spacing, colors, and typography
 */

export const colors = {
  // State colors (semantic - dark theme)
  state: {
    PENDING_REVIEW: { bg: '#fef3c71a', border: '#fbbf24', text: '#fcd34d' },
    BACKLOG: { bg: '#e0e7ff1a', border: '#818cf8', text: '#a5b4fc' },
    SCORING: { bg: '#dbeafe1a', border: '#60a5fa', text: '#93c5fd' },
    EXPERIMENTING: { bg: '#fce7f31a', border: '#f472b6', text: '#fbcfe8' },
    VALIDATED: { bg: '#d1fae51a', border: '#34d399', text: '#6ee7b7' },
    KILLED: { bg: '#fee2e21a', border: '#f87171', text: '#fca5a5' },
  },
  // Score colors
  score: {
    high: '#10b981', // 9-12
    medium: '#f59e0b', // 7-8
    low: '#ef4444', // <7
    none: '#9ca3af',
  },
  // UI colors (dark theme)
  ui: {
    background: '#0b1120',
    surface: '#111827',
    border: '#1f2937',
    text: {
      primary: '#f9fafb',
      secondary: '#9ca3af',
      tertiary: '#6b7280',
    },
    accent: '#3b82f6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
};

// Re-export for convenience
export const transitionsFast = transitions.fast;
export const transitionsNormal = transitions.normal;
export const transitionsSlow = transitions.slow;

