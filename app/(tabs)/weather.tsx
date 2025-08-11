
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchGames } from '@/services/mlbApi';
import { getWeatherForVenue, getWindDirectionText, WeatherData } from '@/services/weatherApi';
import { Game } from '@/types/mlb';

interface GameWithWeather extends Game {
  weather?: WeatherData | null;
}

export default function WeatherScreen() {
  const colorScheme = useColorScheme();
  const [gamesWithWeather, setGamesWithWeather] = useState<GameWithWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeatherData = async () => {
    try {
      const games = await fetchGames();
      
      const gamesWithWeatherPromises = games.map(async (game) => {
        if (game.venue?.name) {
          const weather = await getWeatherForVenue(game.venue.name);
          return { ...game, weather };
        }
        return { ...game, weather: null };
      });

      const gamesWithWeatherData = await Promise.all(gamesWithWeatherPromises);
      setGamesWithWeather(gamesWithWeatherData);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  const renderWeatherCard = ({ item: game }: { item: GameWithWeather }) => (
    <ThemedView style={[styles.weatherCard, { 
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      borderColor: Colors[colorScheme ?? 'light'].border,
    }]}>
      <ThemedView style={styles.gameInfo}>
        <ThemedText style={styles.gameTitle}>
          {game.teams.away.team.name} @ {game.teams.home.team.name}
        </ThemedText>
        <ThemedText style={[styles.gameTime, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {new Date(game.gameDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </ThemedText>
        {game.venue && (
          <ThemedText style={[styles.venue, {
            color: Colors[colorScheme ?? 'light'].muted
          }]}>
            📍 {game.venue.name}
          </ThemedText>
        )}
      </ThemedView>

      {game.weather ? (
        <ThemedView style={styles.weatherInfo}>
          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={[styles.weatherLabel, {
                color: Colors[colorScheme ?? 'light'].muted
              }]}>
                Temperature
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.temperature}°F
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={[styles.weatherLabel, {
                color: Colors[colorScheme ?? 'light'].muted
              }]}>
                Humidity
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.humidity}%
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={[styles.weatherLabel, {
                color: Colors[colorScheme ?? 'light'].muted
              }]}>
                Wind
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.windSpeed} mph {getWindDirectionText(game.weather.windDirection)}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={[styles.weatherLabel, {
                color: Colors[colorScheme ?? 'light'].muted
              }]}>
                Clouds
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.rainChance}%
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText style={[styles.weatherDescription, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {game.weather.description}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.noWeatherContainer}>
          <ThemedText style={[styles.noWeatherText, {
            color: Colors[colorScheme ?? 'light'].muted
          }]}>
            Weather data unavailable
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { 
        backgroundColor: Colors[colorScheme ?? 'light'].background 
      }]} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={Colors[colorScheme ?? 'light'].tint} 
          />
          <ThemedText style={[styles.loadingText, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            Loading weather data...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: Colors[colorScheme ?? 'light'].background 
    }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Weather Forecast
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          Today's game conditions
        </ThemedText>
      </ThemedView>
      
      <FlatList
        data={gamesWithWeather}
        renderItem={renderWeatherCard}
        keyExtractor={(item) => item.gamePk.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 17,
    fontWeight: '400',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  weatherCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  venue: {
    fontSize: 12,
    fontWeight: '400',
  },
  weatherInfo: {
    gap: 12,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherItem: {
    flex: 1,
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weatherDescription: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginTop: 8,
  },
  noWeatherContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noWeatherText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
