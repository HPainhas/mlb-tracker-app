import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';

export default function ParlaysScreen() {
  const colorScheme = useColorScheme();
  const { parlays, removeParlay, isLoading } = useParlay();

  const confirmDeleteParlay = (parlayId: string) => {
    Alert.alert(
      'Delete Parlay',
      'Are you sure you want to delete this parlay? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeParlay(parlayId),
        },
      ]
    );
  };

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
          onPress={() => confirmDeleteParlay(parlay.id)}
        >
          <ThemedText style={[styles.deleteButtonText, {
            color: Colors[colorScheme ?? 'light'].error
          }]}>
            Delete
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.betsContainer}>
        {(parlay.players || []).map((player: any, playerIndex: number) => (
          <ThemedView 
            key={playerIndex}
            style={[styles.betItem, {
              backgroundColor: Colors[colorScheme ?? 'light'].surface,
            }]}
          >
            <ThemedText style={styles.betPlayer}>
              {player.fullName}
            </ThemedText>
            <ThemedText style={[styles.betDetails, {
              color: Colors[colorScheme ?? 'light'].tint
            }]}>
              {player.threshold} {player.betType?.toUpperCase() || parlay.type}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.parlayFooter}>
        <ThemedText style={[styles.parlayDate, {
          color: Colors[colorScheme ?? 'light'].muted
        }]}>
          Created: {new Date(parlay.created).toLocaleDateString()} at {new Date(parlay.created).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </ThemedText>
        <ThemedText style={[styles.parlayOdds, {
          color: Colors[colorScheme ?? 'light'].tint
        }]}>
          {(parlay.players || []).length} players
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
        <ThemedView style={styles.headerTop}>
          <ThemedText type="title" style={styles.headerTitle}>
            My Parlays
          </ThemedText>
          <ThemedText style={[styles.appBrand, {
            color: Colors[colorScheme ?? 'light'].tint
          }]}>
            MLB Tracker
          </ThemedText>
        </ThemedView>
        <ThemedText style={[styles.headerSubtitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {parlays.length} saved parlay{parlays.length !== 1 ? 's' : ''}
        </ThemedText>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyTitle, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            Loading...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={parlays || []}
          renderItem={renderParlay}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            (!parlays || parlays.length === 0) && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  appBrand: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  listContainer: {
    paddingHorizontal: 16,
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
    fontSize: 10,
    fontWeight: '400',
  },
  parlayOdds: {
    fontSize: 12,
    fontWeight: '600',
  },
});