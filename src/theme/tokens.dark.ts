/**
 * Design Tokens - Apple-Quality Design System
 * Dark Mode Tokens
 */

export const darkTokens = {
  // Color System - Semantic Colors (Dark Mode)
  colors: {
    // Primary - Purple gradient system (adjusted for dark)
    primary: {
      50: '#581c87',
      100: '#6b21a8',
      200: '#7e22ce',
      300: '#9333ea',
      400: '#a855f7',
      500: '#c084fc', // Main primary (brighter in dark mode)
      600: '#d8b4fe',
      700: '#e9d5ff',
      800: '#f3e8ff',
      900: '#faf5ff',
    },

    // Secondary - Blue gradient system (adjusted for dark)
    secondary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa', // Main secondary (brighter in dark mode)
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff',
    },

    // Success - Green (adjusted for dark)
    success: {
      50: '#14532d',
      100: '#166534',
      200: '#15803d',
      300: '#16a34a',
      400: '#22c55e',
      500: '#4ade80', // Main success (brighter in dark mode)
      600: '#86efac',
      700: '#bbf7d0',
      800: '#dcfce7',
      900: '#f0fdf4',
    },

    // Warning - Amber (adjusted for dark)
    warning: {
      50: '#78350f',
      100: '#92400e',
      200: '#b45309',
      300: '#d97706',
      400: '#f59e0b',
      500: '#fbbf24', // Main warning (brighter in dark mode)
      600: '#fcd34d',
      700: '#fde68a',
      800: '#fef3c7',
      900: '#fffbeb',
    },

    // Error - Red (adjusted for dark)
    error: {
      50: '#7f1d1d',
      100: '#991b1b',
      200: '#b91c1c',
      300: '#dc2626',
      400: '#ef4444',
      500: '#f87171', // Main error (brighter in dark mode)
      600: '#fca5a5',
      700: '#fecaca',
      800: '#fee2e2',
      900: '#fef2f2',
    },

    // Neutral - Gray scale (inverted for dark mode)
    neutral: {
      0: '#0a0a0a',
      50: '#171717',
      100: '#262626',
      200: '#404040',
      300: '#525252',
      400: '#737373',
      500: '#a3a3a3',
      600: '#d4d4d4',
      700: '#e5e5e5',
      800: '#f5f5f5',
      900: '#fafafa',
      950: '#ffffff',
    },

    // Semantic colors (dark mode)
    background: {
      primary: '#0a0a0a',
      secondary: '#171717',
      tertiary: '#262626',
      elevated: '#1a1a1a',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    text: {
      primary: '#fafafa',
      secondary: '#d4d4d4',
      tertiary: '#737373',
      inverse: '#171717',
      link: '#60a5fa',
    },

    border: {
      primary: '#404040',
      secondary: '#525252',
      focus: '#c084fc',
      error: '#f87171',
    },
  },

  // All other tokens remain the same as light mode
  // (spacing, typography, borderRadius, transitions, blur, zIndex, breakpoints)
}

export type DarkTokens = typeof darkTokens
