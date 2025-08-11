
import { StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';
import { fetchGames } from '@/services/mlbApi';
import { Game, Player } from '@/types/mlb';

interface SelectedPlayer {
  player: Player;
  betType: string;
  threshold: string;
}

const betTypes = ['Hits', 'Total Bases', 'RBIs', 'Runs', 'Strikeouts'];
const thresholds = ['1+', '2+', '3+', '4+'];

export default function ParlayBuilderScreen() {
  const colorScheme = useColorScheme();
  const { addParlay, isPlayerUsed } = useParlay();
  
  const [games, setGames] = useState<Game[]>([]);
  const [selectedBetType, setSelectedBetType] = useState('Hits');
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const fetchedGames = await fetchGames();
        setGames(fetchedGames);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  

  const handlePlayerSelect = (player: Player, threshold: string) => {
    const key = `${player.id}-${selectedBetType}`;
    
    setSelectedPlayers(prev => {
      const existingIndex = prev.findIndex(p => 
        p.player.id === player.id && p.betType === selectedBetType
      );
      
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.threshold === threshold) {
          // Same threshold clicked, remove the selection
          return prev.filter((_, index) => index !== existingIndex);
        } else {
          // Different threshold, update it
          const updated = [...prev];
          updated[existingIndex] = { player, betType: selectedBetType, threshold };
          return updated;
        }
      } else {
        // New selection
        return [...prev, { player, betType: selectedBetType, threshold }];
      }
    });
  };

  const removePlayer = (playerId: string, betType: string) => {
    setSelectedPlayers(prev => 
      prev.filter(p => !(p.player.id === playerId && p.betType === betType))
    );
  };

  const getPlayerSelection = (player: Player): string | null => {
    const selection = selectedPlayers.find(p => 
      p.player.id === player.id && p.betType === selectedBetType
    );
    return selection ? selection.threshold : null;
  };

  const renderPlayer = ({ item: player }: { item: Player }) => {
    const playerSelection = getPlayerSelection(player);
    
    return (
      <ThemedView style={[styles.playerCard, { 
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }]}>
        <ThemedView style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>
            {player.fullName}
          </ThemedText>
          <ThemedText style={[styles.playerPosition, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {player.primaryPosition?.abbreviation}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.thresholdContainer}>
          {thresholds.map((threshold) => {
            const isSelected = playerSelection === threshold;
            
            return (
              <TouchableOpacity
                key={threshold}
                style={[
                  styles.thresholdButton,
                  {
                    backgroundColor: isSelected 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].surface,
                    borderColor: isSelected 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                  }
                ]}
                onPress={() => handlePlayerSelect(player, threshold)}
              >
                <ThemedText style={[
                  styles.thresholdText,
                  { color: isSelected ? '#ffffff' : Colors[colorScheme ?? 'light'].text }
                ]}>
                  {threshold}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderSelectedPlayer = ({ item }: { item: SelectedPlayer }) => (
    <ThemedView style={[styles.selectedPlayerCard, { 
      backgroundColor: Colors[colorScheme ?? 'light'].tint + '10',
      borderColor: Colors[colorScheme ?? 'light'].tint,
    }]}>
      <ThemedView style={styles.selectedPlayerInfo}>
        <ThemedText style={styles.selectedPlayerName}>
          {item.player.fullName}
        </ThemedText>
        <ThemedText style={[styles.selectedPlayerBet, {
          color: Colors[colorScheme ?? 'light'].tint
        }]}>
          {item.threshold} {item.betType}
        </ThemedText>
      </ThemedView>
      <TouchableOpacity
        style={[styles.removeButton, {
          backgroundColor: Colors[colorScheme ?? 'light'].error + '20',
        }]}
        onPress={() => removePlayer(item.player.id, item.betType)}
      >
        <ThemedText style={[styles.removeButtonText, {
          color: Colors[colorScheme ?? 'light'].error
        }]}>
          ✕
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const getAllPlayers = (): Player[] => {
    const allPlayers: Player[] = [];
    
    games.forEach(game => {
      if (game.teams.home.players) {
        Object.values(game.teams.home.players).forEach(player => {
          if (player.person) {
            allPlayers.push({
              id: player.person.id.toString(),
              fullName: player.person.fullName,
              primaryPosition: player.position || null,
            });
          }
        });
      }
      
      if (game.teams.away.players) {
        Object.values(game.teams.away.players).forEach(player => {
          if (player.person) {
            allPlayers.push({
              id: player.person.id.toString(),
              fullName: player.person.fullName,
              primaryPosition: player.position || null,
            });
          }
        });
      }
    });

    return allPlayers.filter((player, index, self) => 
      index === self.findIndex(p => p.id === player.id)
    );
  };

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: Colors[colorScheme ?? 'light'].background 
    }]} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Parlay Builder
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          Select players and bet types
        </ThemedText>
      </ThemedView>

      {/* Bet Type Selector */}
      <ThemedView style={styles.betTypeContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.betTypeScrollContainer}
        >
          {betTypes.map((betType) => (
            <TouchableOpacity
              key={betType}
              style={[
                styles.betTypeButton,
                {
                  backgroundColor: selectedBetType === betType 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : Colors[colorScheme ?? 'light'].card,
                  borderColor: selectedBetType === betType 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : Colors[colorScheme ?? 'light'].border,
                }
              ]}
              onPress={() => setSelectedBetType(betType)}
            >
              <ThemedText style={[
                styles.betTypeText,
                { 
                  color: selectedBetType === betType 
                    ? '#ffffff' 
                    : Colors[colorScheme ?? 'light'].text 
                }
              ]}>
                {betType}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Players List */}
      <FlatList
        data={getAllPlayers()}
        renderItem={renderPlayer}
        keyExtractor={(item) => `${item.id}-${selectedBetType}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Selected Players */}
      {selectedPlayers.length > 0 && (
        <ThemedView style={[styles.selectedSection, {
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
        }]}>
          <ThemedText style={styles.selectedTitle}>
            Selected Players ({selectedPlayers.length})
          </ThemedText>
          
          <FlatList
            data={selectedPlayers}
            renderItem={renderSelectedPlayer}
            keyExtractor={(item) => `${item.player.id}-${item.betType}`}
            style={styles.selectedList}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#979797',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 4,
  },
  betTypeContainer: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#979797',
  },
  betTypeScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  betTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  betTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 200,
  },
  playerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerInfo: {
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerPosition: {
    fontSize: 14,
    fontWeight: '500',
  },
  thresholdContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 200,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedList: {
    paddingHorizontal: 20,
  },
  selectedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  selectedPlayerInfo: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedPlayerBet: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
