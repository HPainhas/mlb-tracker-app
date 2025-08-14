import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ParlayProvider } from '@/context/ParlayContext';
import { notificationService } from '@/services/notificationService';
import { homeRunMonitor } from '@/services/homeRunMonitor';
import CustomSplashScreen from '@/components/CustomSplashScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        // Reset the home run monitor instance to ensure all methods are available
        homeRunMonitor.restartMonitoring();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    return () => {
      homeRunMonitor.stopMonitoring();
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Hide default splash screen immediately when component mounts
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!loaded || showSplash) {
    // Show custom splash screen while fonts are loading or splash animation is running
    return <CustomSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <ParlayProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ParlayProvider>
  );
}
