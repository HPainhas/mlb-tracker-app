/**
 * Apple-inspired color scheme for MLB Parlay Tracker
 * Clean, premium aesthetic with blacks, grays, and modern blues
 */

const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF';

export const Colors = {
  light: {
    text: '#1D1D1F',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E5EA',
    tint: tintColorLight,
    secondary: '#6D6D80',
    muted: '#8E8E93',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    accent: '#FF2D92',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    border: '#38383A',
    tint: tintColorDark,
    secondary: '#98989D',
    muted: '#8E8E93',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    accent: '#FF2D92',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
  },
};