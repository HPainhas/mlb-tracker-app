import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fetchGames } from "@/services/mlbApi";
import { getTeamLogoUrl } from "@/services/teamLogos";
import { getTeamDisplayName } from "@/utils/teamUtils";
import {
  getWeatherForVenue,
  WeatherData,
} from "@/services/weatherApi";
import { Game } from "@/types/mlb";

interface GameWithDetails extends Game {
  weather?: WeatherData | null;
}

const formatGameTime = (gameDate: string): string => {
  const date = new Date(gameDate);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  return time;
};

const getWindDirectionArrow = (direction: number): string => {
  // Convert degrees to cardinal directions
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(direction / 22.5) % 16;
  const cardinalDirection = directions[index];
  
  // Map cardinal directions to arrows
  const directionMap: { [key: string]: string } = {
    'N': '↑',
    'NNE': '↑',
    'NE': '↗',
    'ENE': '↗',
    'E': '→',
    'ESE': '→',
    'SE': '↘',
    'SSE': '↘',
    'S': '↓',
    'SSW': '↓',
    'SW': '↙',
    'WSW': '↙',
    'W': '←',
    'WNW': '←',
    'NW': '↖',
    'NNW': '↖',
  };
  return directionMap[cardinalDirection] || '↑';
};

const getWeatherIcon = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
  if (desc.includes('snow')) return '❄️';
  if (desc.includes('cloud') || desc.includes('overcast')) return '☁️';
  if (desc.includes('clear') || desc.includes('sun')) return '☀️';
  if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
  if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
  return '🌤️'; // default
};

export default function WeatherScreen() {
  const colorScheme = useColorScheme();
  const [gamesWithDetails, setGamesWithDetails] = useState<GameWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGameDetails = async () => {
    try {
      const games = await fetchGames();

      const gamesWithDetailsPromises = games.map(async (game) => {
        const weather = game.venue?.name
          ? await getWeatherForVenue(game.venue.name)
          : null;
        return { ...game, weather };
      });

      const gamesWithDetailsData = await Promise.all(gamesWithDetailsPromises);
      setGamesWithDetails(gamesWithDetailsData);
    } catch (error) {
      console.error("Error loading game details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGameDetails();

    // Set up auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(() => {
      loadGameDetails();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGameDetails();
  };



  const renderWeatherCard = ({ item: game }: { item: GameWithDetails }) => (
    <ThemedView
      style={[
        styles.weatherCard,
        {
          backgroundColor: Colors[colorScheme ?? "light"].card,
          borderColor: Colors[colorScheme ?? "light"].border,
        },
      ]}
    >
      <ThemedView style={styles.gameHeader}>
        <ThemedText style={[styles.gameTime, {
          color: Colors[colorScheme ?? "light"].secondary,
        }]}>
          {formatGameTime(game.gameDate)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.gameInfo}>
        <ThemedView style={styles.gameTitleContainer}>
          <ThemedView style={styles.teamTitleRow}>
            <Image 
              source={{ uri: getTeamLogoUrl(game.teams.away.team.name) || undefined }} 
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <ThemedText style={[styles.gameTitle, {
              color: '#ffffff'
            }]}>
              {getTeamDisplayName(game.teams.away.team.name)}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.teamTitleRow}>
            <Image 
              source={{ uri: getTeamLogoUrl(game.teams.home.team.name) || undefined }} 
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <ThemedText style={[styles.gameTitleSeparator, {
              color: Colors[colorScheme ?? "light"].secondary
            }]}>
              @ <ThemedText style={{ color: '#ffffff' }}>{getTeamDisplayName(game.teams.home.team.name)}</ThemedText>
            </ThemedText>
          </ThemedView>
        </ThemedView>
        {game.venue && (
          <ThemedText
            style={[
              styles.venue,
              {
                color: Colors[colorScheme ?? "light"].muted,
              },
            ]}
          >
            📍 {game.venue.name}
          </ThemedText>
        )}
        {game.weather && (
          <ThemedView style={styles.forecastContainer}>
            <ThemedText style={styles.forecastIcon}>
              {getWeatherIcon(game.weather.description)}
            </ThemedText>
            <ThemedText
              style={[
                styles.forecastText,
                {
                  color: Colors[colorScheme ?? "light"].secondary,
                },
              ]}
            >
              {game.weather.description}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {game.weather ? (
        <ThemedView style={styles.weatherInfo}>
          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherIcon}>🌡️</ThemedText>
              <ThemedText
                style={[
                  styles.weatherLabel,
                  {
                    color: Colors[colorScheme ?? "light"].muted,
                  },
                ]}
              >
                Temperature
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.temperature}°F
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherIcon}>💧</ThemedText>
              <ThemedText
                style={[
                  styles.weatherLabel,
                  {
                    color: Colors[colorScheme ?? "light"].muted,
                  },
                ]}
              >
                Humidity
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.humidity}%
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.weatherRow}>
            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherIcon}>💨</ThemedText>
              <ThemedText
                style={[
                  styles.weatherLabel,
                  {
                    color: Colors[colorScheme ?? "light"].muted,
                  },
                ]}
              >
                Wind
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.windSpeed} mph{" "}
                {getWindDirectionArrow(game.weather.windDirection)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.weatherItem}>
              <ThemedText style={styles.weatherIcon}>☁️</ThemedText>
              <ThemedText
                style={[
                  styles.weatherLabel,
                  {
                    color: Colors[colorScheme ?? "light"].muted,
                  },
                ]}
              >
                Precipitation
              </ThemedText>
              <ThemedText style={styles.weatherValue}>
                {game.weather.rainChance}%
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedView style={styles.noWeatherContainer}>
          <ThemedText
            style={[
              styles.noWeatherText,
              {
                color: Colors[colorScheme ?? "light"].muted,
              },
            ]}
          >
            Weather data unavailable
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: Colors[colorScheme ?? "light"].background,
          },
        ]}
        edges={["top", "left", "right"]}
      >
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText
            style={[
              styles.loadingText,
              {
                color: Colors[colorScheme ?? "light"].secondary,
              },
            ]}
          >
            Loading game data...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
      ]}
      edges={["top", "left", "right"]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          MLB Games
        </ThemedText>
        <ThemedText
          style={[
            styles.headerSubtitle,
            {
              color: Colors[colorScheme ?? "light"].secondary,
            },
          ]}
        >
          Today's match-ups and forecasts
        </ThemedText>
      </ThemedView>

      <FlatList
        data={gamesWithDetails}
        renderItem={renderWeatherCard}
        keyExtractor={(item) => item.gamePk.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? "light"].tint}
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
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 17,
    fontWeight: "400",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  weatherCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameHeader: {
    marginBottom: 12,
  },
  gameTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  gameInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 0,
  },
  gameTitleContainer: {
    marginBottom: 4,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  teamLogo: {
    width: 20,
    height: 20,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  gameTitleSeparator: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
  },
  venue: {
    fontSize: 12,
    fontWeight: "400",
  },
  forecastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  forecastIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  forecastText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
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
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.04)',
    marginHorizontal: 4,
  },
  weatherIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  weatherDescription: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    textTransform: "capitalize",
    marginTop: 8,
  },
  noWeatherContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  noWeatherText: {
    fontSize: 14,
    fontWeight: "500",
  },
});