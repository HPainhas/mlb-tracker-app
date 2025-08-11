import { StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchGames } from '@/services/mlbApi';
import { Game } from '@/types/mlb';

// Helper function to format game time with timezone
const formatGameTime = (gameDate: string) => {
  const date = new Date(gameDate);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  };
  return date.toLocaleTimeString('en-US', options);
};

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGames = async () => {
    try {
      const fetchedGames = await fetchGames();
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  const renderGame = ({ item: game }: { item: Game }) => {
    const isGameStarted = game.status.abstractGameState !== 'Preview';

    return (
      <ThemedView style={[styles.gameCard, { 
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }]}>
        <ThemedView style={styles.gameHeader}>
          <ThemedText style={[styles.gameTime, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {formatGameTime(game.gameDate)}
          </ThemedText>
          <ThemedText style={[styles.gameStatus, {
            color: game.status.abstractGameState === 'Live' 
              ? Colors[colorScheme ?? 'light'].success
              : game.status.abstractGameState === 'Final'
              ? Colors[colorScheme ?? 'light'].muted
              : Colors[colorScheme ?? 'light'].tint
          }]}>
            {game.status.detailedState}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.teamsContainer}>
          <ThemedView style={styles.teamRow}>
            <ThemedText style={styles.teamName}>
              {game.teams.away.team.name}
            </ThemedText>
            {isGameStarted && (
              <ThemedText style={[styles.teamScore, {
                color: Colors[colorScheme ?? 'light'].text
              }]}>
                {game.teams.away.score}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedText style={[styles.vsText, {
            color: Colors[colorScheme ?? 'light'].muted
          }]}>
            @
          </ThemedText>

          <ThemedView style={styles.teamRow}>
            <ThemedText style={styles.teamName}>
              {game.teams.home.team.name}
            </ThemedText>
            {isGameStarted && (
              <ThemedText style={[styles.teamScore, {
                color: Colors[colorScheme ?? 'light'].text
              }]}>
                {game.teams.home.score}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {game.venue && (
          <ThemedText style={[styles.venue, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {game.venue.name}
          </ThemedText>
        )}
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: Colors[colorScheme ?? 'light'].background 
    }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Today's Games
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          See the latest MLB matchups
        </ThemedText>
      </ThemedView>

      <FlatList
        data={games}
        renderItem={renderGame}
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
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamsContainer: {
    marginBottom: 8,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  vsText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 2,
  },
  venue: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});