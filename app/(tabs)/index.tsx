
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MLBGame } from '@/types/mlb';
import { MLBApiService } from '@/services/mlbApi';
import { Collapsible } from '@/components/Collapsible';

export default function GamesScreen() {
  const [games, setGames] = useState<MLBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme() ?? 'dark';

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const todaysGames = await MLBApiService.getTodaysGames();
      setGames(todaysGames);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch games');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const formatGameTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getGameStatus = (game: MLBGame) => {
    if (game.status.abstractGameState === 'Final') {
      return `Final: ${game.teams.away.score} - ${game.teams.home.score}`;
    } else if (game.status.abstractGameState === 'Live') {
      return `Live: ${game.teams.away.score} - ${game.teams.home.score}`;
    } else {
      return formatGameTime(game.gameDate);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText type="title">Loading Today's Games...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title">Today's MLB Games</ThemedText>
          <ThemedText style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </ThemedText>
        </ThemedView>

        {games.length === 0 ? (
          <ThemedView style={styles.noGamesContainer}>
            <ThemedText type="subtitle">No games scheduled today</ThemedText>
          </ThemedView>
        ) : (
          games.map((game) => (
            <ThemedView 
              key={game.gamePk} 
              style={[
                styles.gameCard,
                { 
                  backgroundColor: Colors[colorScheme].card,
                  borderColor: Colors[colorScheme].border
                }
              ]}
            >
              <ThemedView style={styles.gameHeader}>
                <ThemedView style={styles.teamsContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.teamName}>
                    {game.teams.away.team.name}
                  </ThemedText>
                  <ThemedText style={styles.vs}>@</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.teamName}>
                    {game.teams.home.team.name}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.gameStatus}>
                  {getGameStatus(game)}
                </ThemedText>
              </ThemedView>
              
              <ThemedText style={styles.venue}>
                {game.venue.name}
              </ThemedText>

              <Collapsible title="View Lineups">
                <ThemedText style={styles.comingSoon}>
                  Lineups will be available here
                </ThemedText>
              </Collapsible>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    marginTop: 5,
    opacity: 0.7,
  },
  noGamesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  gameCard: {
    margin: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  gameHeader: {
    marginBottom: 8,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
  },
  vs: {
    marginHorizontal: 12,
    opacity: 0.7,
  },
  gameStatus: {
    textAlign: 'center',
    opacity: 0.8,
  },
  venue: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  comingSoon: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
  },
});
