
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
      { 
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }
    ]}>
      <ThemedView style={styles.gameHeader}>
        <ThemedText style={styles.gameTime}>{item.gameDate}</ThemedText>
        <ThemedView style={[
          styles.statusBadge,
          { backgroundColor: Colors[colorScheme ?? 'light'].accent }
        ]}>
          <ThemedText style={styles.statusText}>{item.status.abstractGameState}</ThemedText>
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.teamsContainer}>
        <ThemedView style={styles.teamSection}>
          <ThemedText style={styles.teamName}>{item.teams.away.team.name}</ThemedText>
          <ThemedText style={styles.teamRecord}>
            ({item.teams.away.leagueRecord.wins}-{item.teams.away.leagueRecord.losses})
          </ThemedText>
        </ThemedView>
        
        <ThemedText style={styles.vsText}>@</ThemedText>
        
        <ThemedView style={styles.teamSection}>
          <ThemedText style={styles.teamName}>{item.teams.home.team.name}</ThemedText>
          <ThemedText style={styles.teamRecord}>
            ({item.teams.home.leagueRecord.wins}-{item.teams.home.leagueRecord.losses})
          </ThemedText>
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.venueContainer}>
        <ThemedText style={[
          styles.venueText,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {item.venue.name}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Today's Games</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Today's Games</ThemedText>
        <ThemedText style={[
          styles.subtitle,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {games.length} games scheduled
        </ThemedText>
      </ThemedView>
      
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.gamePk.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamSection: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamRecord: {
    fontSize: 14,
    fontWeight: '400',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  venueContainer: {
    alignItems: 'center',
  },
  venueText: {
    fontSize: 14,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
