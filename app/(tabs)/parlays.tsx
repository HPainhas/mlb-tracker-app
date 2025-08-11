import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlayContext } from '@/context/ParlayContext';

export default function ParlaysScreen() {
  const colorScheme = useColorScheme();
  const { parlays, removeParlay } = useParlayContext();

  const renderParlay = ({ item: parlay, index }: { item: any; index: number }) => (
    <ThemedView style={[styles.parlayCard, { 
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      borderColor: Colors[colorScheme ?? 'light'].border,
    }]}>
      <ThemedView style={styles.parlayHeader}>
        <ThemedText style={styles.parlayTitle}>
          Parlay #{index + 1}
        </ThemedText>
        <TouchableOpacity
          style={[styles.deleteButton, {
            backgroundColor: Colors[colorScheme ?? 'light'].error + '20',
          }]}
          onPress={() => removeParlay(parlay.id)}
        >
          <ThemedText style={[styles.deleteButtonText, {
            color: Colors[colorScheme ?? 'light'].error
          }]}>
            Delete
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.betsContainer}>
        {parlay.bets.map((bet: any, betIndex: number) => (
          <ThemedView 
            key={betIndex}
            style={[styles.betItem, {
              backgroundColor: Colors[colorScheme ?? 'light'].surface,
            }]}
          >
            <ThemedText style={styles.betPlayer}>
              {bet.player}
            </ThemedText>
            <ThemedText style={[styles.betDetails, {
              color: Colors[colorScheme ?? 'light'].tint
            }]}>
              {bet.threshold} {bet.betType}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.parlayFooter}>
        <ThemedText style={[styles.parlayDate, {
          color: Colors[colorScheme ?? 'light'].muted
        }]}>
          Created: {new Date(parlay.createdAt).toLocaleDateString()}
        </ThemedText>
        <ThemedText style={[styles.parlayOdds, {
          color: Colors[colorScheme ?? 'light'].tint
        }]}>
          {parlay.bets.length} legs
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={[styles.emptyTitle, {
        color: Colors[colorScheme ?? 'light'].secondary
      }]}>
        No Parlays Yet
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, {
        color: Colors[colorScheme ?? 'light'].muted
      }]}>
        Create your first parlay in the Builder tab
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: Colors[colorScheme ?? 'light'].background 
    }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          My Parlays
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {parlays.length} saved parlay{parlays.length !== 1 ? 's' : ''}
        </ThemedText>
      </ThemedView>

      <FlatList
        data={parlays}
        renderItem={renderParlay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          parlays.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
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
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  parlayCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parlayTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  betsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  betPlayer: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  betDetails: {
    fontSize: 12,
    fontWeight: '600',
  },
  parlayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#979797',
  },
  parlayDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  parlayOdds: {
    fontSize: 12,
    fontWeight: '600',
  },
});