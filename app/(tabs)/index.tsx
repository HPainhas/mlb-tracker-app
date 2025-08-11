
import { StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchGames } from '@/services/mlbApi';
import { Game } from '@/types/mlb';

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

  const renderGame = ({ item: game }: { item: Game }) => (
    <ThemedView style={[styles.gameCard, { 
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      borderColor: Colors[colorScheme ?? 'light'].border,
    }]}>
      <ThemedView style={styles.gameHeader}>
        <ThemedText style={styles.gameTime}>
          {new Date(game.gameDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </ThemedText>
        <ThemedText style={[styles.gameStatus, {
          color: Colors[colorScheme ?? 'light'].muted
        }]}>
          {game.status.abstractGameState}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.teamsContainer}>
        <ThemedView style={styles.teamRow}>
          <ThemedText style={styles.teamName}>
            {game.teams.away.team.name}
          </ThemedText>
          <ThemedText style={styles.teamScore}>
            {game.teams.away.score || '0'}
          </ThemedText>
        </ThemedView>
        
        <ThemedText style={[styles.vsText, {
          color: Colors[colorScheme ?? 'light'].muted
        }]}>
          vs
        </ThemedText>
        
        <ThemedView style={styles.teamRow}>
          <ThemedText style={styles.teamName}>
            {game.teams.home.team.name}
          </ThemedText>
          <ThemedText style={styles.teamScore}>
            {game.teams.home.score || '0'}
          </ThemedText>
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

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: Colors[colorScheme ?? 'light'].background 
    }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Today's Games
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#979797',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
