
/**
 * Apple-inspired color scheme for MLB Parlay Tracker
 * Clean, premium aesthetic with blacks, grays, and modern blues
 */

const tintColorLight = '#0088cc';
const tintColorDark = '#0088cc';

export const Colors = {
  light: {
    text: '#000000',
    background: '#eeeeee',
    tint: tintColorLight,
    icon: '#666666',
    tabIconDefault: '#979797',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: '#979797',
    error: '#FF3B30',
    success: '#34C759',
    secondary: '#666666',
    accent: '#ffffff',
    surface: '#ffffff',
    muted: '#979797',
  },
  dark: {
    text: '#eeeeee',
    background: '#000000',
    tint: tintColorDark,
    icon: '#979797',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    card: '#1a1a1a',
    border: '#333333',
    error: '#FF453A',
    success: '#30D158',
    secondary: '#979797',
    accent: '#1a1a1a',
    surface: '#1a1a1a',
    muted: '#666666',
  },
};
