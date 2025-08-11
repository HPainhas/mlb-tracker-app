
/**
 * Apple-inspired color scheme for MLB Parlay Tracker
 * Clean, premium aesthetic with whites, blacks, and space grays
 */

const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF';

export const Colors = {
  light: {
    text: '#1D1D1F',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    card: '#F2F2F7',
    border: '#D1D1D6',
    error: '#FF3B30',
    success: '#34C759',
    secondary: '#6D6D70',
    accent: '#F2F2F7',
  },
  dark: {
    text: '#F2F2F7',
    background: '#000000',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
    card: '#1C1C1E',
    border: '#38383A',
    error: '#FF453A',
    success: '#30D158',
    secondary: '#98989D',
    accent: '#2C2C2E',
  },
};
