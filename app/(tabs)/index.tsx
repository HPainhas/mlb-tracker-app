import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getSchedule } from '@/services/mlbApi';
import { Game } from '@/types/mlb';

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const fetchGames = async () => {
    try {
      const gameData = await getSchedule();
      setGames(gameData);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const renderGame = ({ item }: { item: Game }) => (
    <ThemedView style={[
      styles.gameCard,
      { backgroundColor: Colors[colorScheme ?? 'light'].card }
    ]}>
      <ThemedView style={styles.gameHeader}>
        <ThemedText style={styles.gameTeams}>
          {item.teams.away.team.name} @ {item.teams.home.team.name}
        </ThemedText>
        <ThemedText style={[
          styles.gameStatus,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {item.status.detailedState}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.gameDetails}>
        <ThemedText style={[
          styles.gameTime,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {new Date(item.gameDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </ThemedText>

        <ThemedText style={[
          styles.gameVenue,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {item.venue.name}
        </ThemedText>
      </ThemedView>

      {(item.teams.away.score !== undefined || item.teams.home.score !== undefined) && (
        <ThemedView style={styles.scoreContainer}>
          <ThemedText style={styles.score}>
            {item.teams.away.team.abbreviation}: {item.teams.away.score || 0}
          </ThemedText>
          <ThemedText style={styles.score}>
            {item.teams.home.team.abbreviation}: {item.teams.home.score || 0}
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
          Loading today's games...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.header}>Today's Games</ThemedText>

      {games.length === 0 ? (
        <ThemedView style={styles.centerContent}>
          <ThemedText style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].secondary }]}>
            No games scheduled for today
          </ThemedText>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={onRefresh}
          >
            <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.gamePk.toString()}
          renderItem={renderGame}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  gameCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameHeader: {
    marginBottom: 12,
  },
  gameTeams: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameVenue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
  },
});