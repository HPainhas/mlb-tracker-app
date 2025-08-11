
import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function WeatherScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Weather
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Check weather conditions for MLB games
        </ThemedText>
        
        <ThemedView style={styles.weatherCard}>
          <ThemedText type="subtitle">Today's Weather</ThemedText>
          <ThemedText style={styles.weatherText}>
            Weather data will be displayed here
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#8E8E93',
  },
  weatherCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  weatherText: {
    fontSize: 16,
    color: '#3C3C43',
    marginTop: 8,
  },
});
