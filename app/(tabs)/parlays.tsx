
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlayContext } from '@/context/ParlayContext';

export default function ParlaysScreen() {
  const { parlays, removeParlay } = useParlayContext();
  const colorScheme = useColorScheme();

  const confirmDelete = (parlayId: string) => {
    Alert.alert(
      'Delete Parlay',
      'Are you sure you want to delete this parlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removeParlay(parlayId)
        },
      ]
    );
  };

  const renderParlay = ({ item }: { item: any }) => (
    <ThemedView style={[
      styles.parlayCard,
      {
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }
    ]}>
      <ThemedView style={styles.parlayHeader}>
        <ThemedView style={styles.parlayInfo}>
          <ThemedText style={styles.parlayType}>{item.type}</ThemedText>
          <ThemedText style={[
            styles.parlayDate,
            { color: Colors[colorScheme ?? 'light'].secondary }
          ]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </ThemedView>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: Colors[colorScheme ?? 'light'].error }
          ]}
          onPress={() => confirmDelete(item.id)}
        >
          <ThemedText style={styles.deleteButtonText}>×</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.playersContainer}>
        {item.players.map((player: any, index: number) => (
          <ThemedView key={player.id} style={styles.playerRow}>
            <ThemedView style={[
              styles.playerDot,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint }
            ]} />
            <ThemedText style={styles.playerName}>{player.fullName}</ThemedText>
            <ThemedText style={[
              styles.playerPosition,
              { color: Colors[colorScheme ?? 'light'].secondary }
            ]}>
              {player.primaryPosition?.name || 'N/A'}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.parlayFooter}>
        <ThemedView style={[
          styles.oddsBadge,
          { backgroundColor: Colors[colorScheme ?? 'light'].success }
        ]}>
          <ThemedText style={styles.oddsText}>{item.odds}</ThemedText>
        </ThemedView>
        <ThemedText style={[
          styles.legCount,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {item.players.length} legs
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  if (parlays.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>My Parlays</ThemedText>
          <ThemedText style={[
            styles.subtitle,
            { color: Colors[colorScheme ?? 'light'].secondary }
          ]}>
            Track your bets and manage selections
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.emptyContainer}>
          <ThemedView style={[
            styles.emptyIcon,
            { backgroundColor: Colors[colorScheme ?? 'light'].accent }
          ]}>
            <ThemedText style={styles.emptyIconText}>📊</ThemedText>
          </ThemedView>
          <ThemedText style={styles.emptyTitle}>No Parlays Yet</ThemedText>
          <ThemedText style={[
            styles.emptySubtitle,
            { color: Colors[colorScheme ?? 'light'].secondary }
          ]}>
            Start building your first parlay in the Builder tab
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>My Parlays</ThemedText>
        <ThemedText style={[
          styles.subtitle,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {parlays.length} active {parlays.length === 1 ? 'parlay' : 'parlays'}
        </ThemedText>
      </ThemedView>

      <FlatList
        data={parlays}
        renderItem={renderParlay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  parlayCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  parlayInfo: {
    flex: 1,
  },
  parlayType: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  parlayDate: {
    fontSize: 14,
    fontWeight: '400',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  playersContainer: {
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  playerPosition: {
    fontSize: 14,
    fontWeight: '400',
  },
  parlayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 60, 67, 0.1)',
  },
  oddsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  oddsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  legCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
});
