import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationComplete?: () => void;
}

export default function CustomSplashScreen({ onAnimationComplete }: CustomSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
      // Scale animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      // Wait longer to ensure animation is fully complete and user can see the result
      setTimeout(() => {
        onAnimationComplete?.();
      }, 3000);
    });
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationComplete]);

  return (
    <LinearGradient
      colors={['#007AFF', '#0056CC', '#003399']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* App Name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          MLB Tracker
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Real-time baseball tracking
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 320,
    height: 320,
    borderRadius: 36,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
});
