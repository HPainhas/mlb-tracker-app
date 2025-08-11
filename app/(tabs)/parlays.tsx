
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';
import { ParlayBet } from '@/types/mlb';

export default function ParlaysScreen() {
  const { parlays, removeParlay } = useParlay();
  const colorScheme = useColorScheme() ?? 'dark';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const confirmDelete = (parlayId: string) => {
    Alert.alert(
      'Delete Parlay',
      'Are you sure you want to delete this parlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeParlay(parlayId) }
      ]
    );
  };

  const ParlayCard = ({ parlay }: { parlay: ParlayBet }) => (
    <ThemedView 
      style={[
        styles.parlayCard,
        {
          backgroundColor: Colors[colorScheme].card,
          borderColor: Colors[colorScheme].border
        }
      ]}
    >
      <ThemedView style={styles.parlayHeader}>
        <ThemedView>
          <ThemedText type="defaultSemiBold" style={styles.parlayType}>
            {parlay.type} Parlay
          </ThemedText>
          <ThemedText style={styles.parlayDate}>
            Created {formatDate(parlay.created)}
          </ThemedText>
        </ThemedView>
        <TouchableOpacity
          onPress={() => confirmDelete(parlay.id)}
          style={styles.deleteButton}
        >
          <ThemedText style={[styles.deleteText, { color: Colors[colorScheme].error }]}>
            Delete
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.playersSection}>
        <ThemedText type="subtitle" style={styles.playersTitle}>
          Players ({parlay.players.length})
        </ThemedText>
        {parlay.players.map((player) => (
          <ThemedView key={player.id} style={styles.playerRow}>
            <ThemedText style={styles.playerName}>{player.fullName}</ThemedText>
            <ThemedText style={styles.playerPosition}>
              {player.position.name}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Parlays</ThemedText>
          <ThemedText style={styles.subtitle}>
            {parlays.length} active parlay{parlays.length !== 1 ? 's' : ''}
          </ThemedText>
        </ThemedView>

        {parlays.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Parlays Yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              Head to the Parlay Builder to create your first parlay!
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.parlaysContainer}>
            {parlays.map((parlay) => (
              <ParlayCard key={parlay.id} parlay={parlay} />
            ))}
          </ThemedView>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    marginTop: 5,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  parlaysContainer: {
    padding: 20,
    paddingTop: 10,
  },
  parlayCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  parlayType: {
    fontSize: 18,
  },
  parlayDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  playersSection: {
    gap: 8,
  },
  playersTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playerName: {
    flex: 1,
  },
  playerPosition: {
    fontSize: 12,
    opacity: 0.7,
  },
});
