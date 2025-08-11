
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getSchedule } from '@/services/mlbApi';
import { getWeatherForVenue, getWindDirectionText, WeatherData } from '@/services/weatherApi';
import { Game } from '@/types/mlb';

interface GameWeather {
  game: Game;
  weather: WeatherData | null;
}

export default function WeatherScreen() {
  const [gameWeatherData, setGameWeatherData] = useState<GameWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const fetchWeatherData = async () => {
    try {
      const games = await getSchedule();
      const weatherPromises = games.map(async (game) => {
        const weather = await getWeatherForVenue(game.venue.name);
        return { game, weather };
      });
      
      const results = await Promise.all(weatherPromises);
      setGameWeatherData(results);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  const formatGameTime = (gameDate: string) => {
    const date = new Date(gameDate);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderWeatherCard = ({ game, weather }: GameWeather, index: number) => (
    <ThemedView key={index} style={[
      styles.weatherCard,
      { backgroundColor: Colors[colorScheme ?? 'light'].card }
    ]}>
      <ThemedView style={styles.gameInfo}>
        <ThemedText type="subtitle" style={styles.teams}>
          {game.teams.away.team.name} @ {game.teams.home.team.name}
        </ThemedText>
        <ThemedText style={[styles.venue, { color: Colors[colorScheme ?? 'light'].secondary }]}>
          {game.venue.name}
        </ThemedText>
        <ThemedText style={[styles.gameTime, { color: Colors[colorScheme ?? 'light'].secondary }]}>
          {formatGameTime(game.gameDate)}
        </ThemedText>
      </ThemedView>

      {weather ? (
        <ThemedView style={styles.weatherInfo}>
          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherLabel}>Temperature</ThemedText>
              <ThemedText style={styles.weatherValue}>{weather.temperature}°F</ThemedText>
            </ThemedView>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherLabel}>Humidity</ThemedText>
              <ThemedText style={styles.weatherValue}>{weather.humidity}%</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherLabel}>Wind</ThemedText>
              <ThemedText style={styles.weatherValue}>
                {weather.windSpeed} MPH {getWindDirectionText(weather.windDirection)}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherLabel}>Rain Chance</ThemedText>
              <ThemedText style={styles.weatherValue}>{weather.rainChance}%</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.conditionsContainer}>
            <ThemedText style={[styles.conditions, { color: Colors[colorScheme ?? 'light'].secondary }]}>
              {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.noWeatherContainer}>
          <ThemedText style={[styles.noWeatherText, { color: Colors[colorScheme ?? 'light'].secondary }]}>
            Weather data unavailable
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].secondary }]}>
          Loading weather data...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
      >
        <ThemedText type="title" style={styles.title}>
          Game Weather
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].secondary }]}>
          Weather conditions for today's MLB games
        </ThemedText>

        {gameWeatherData.length === 0 ? (
          <ThemedView style={styles.noGamesContainer}>
            <ThemedText style={[styles.noGamesText, { color: Colors[colorScheme ?? 'light'].secondary }]}>
              No games scheduled for today
            </ThemedText>
          </ThemedView>
        ) : (
          gameWeatherData.map((gameWeather, index) => renderWeatherCard(gameWeather, index))
        )}
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
  gameInfo: {
    marginBottom: 16,
  },
  teams: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  venue: {
    fontSize: 14,
    marginBottom: 2,
  },
  gameTime: {
    fontSize: 14,
  },
  weatherInfo: {
    marginTop: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherItem: {
    flex: 1,
    marginRight: 10,
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  conditionsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  conditions: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noWeatherContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noWeatherText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noGamesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noGamesText: {
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
