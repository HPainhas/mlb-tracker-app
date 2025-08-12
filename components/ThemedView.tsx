import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  useBackground?: boolean;
};

export function ThemedView({ style, lightColor, darkColor, useBackground = false, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useBackground 
    ? useThemeColor({ light: lightColor, dark: darkColor }, 'background')
    : undefined;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
