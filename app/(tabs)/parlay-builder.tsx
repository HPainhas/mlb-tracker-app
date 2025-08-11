
import { StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';
import { fetchGames, getLineup, getRoster } from '@/services/mlbApi';
import { Game, Player } from '@/types/mlb';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

interface SelectedPlayer {
  player: Player;
  betType: string;
  threshold: string;
}

interface GameWithPlayers extends Game {
  homeTeamPlayers: Player[];
  awayTeamPlayers: Player[];
}

const betTypes = ['Hits', 'Total Bases', 'Home Runs', 'H+R+RBIs'];
const thresholds = ['1+', '2+', '3+', '4+'];

export default function ParlayBuilderScreen() {
  const colorScheme = useColorScheme();
  const { addParlay } = useParlay();
  const bottomTabHeight = useBottomTabOverflow();

  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [selectedBetType, setSelectedBetType] = useState('Hits');
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());
  const [isSelectedExpanded, setIsSelectedExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedGames = await fetchGames();
        
        const gamesWithPlayers = await Promise.all(
          fetchedGames.map(async (game) => {
            try {
              // Try to get lineups first, fallback to roster
              const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
                getLineup(game.gamePk, game.teams.home.team.id).catch(() => 
                  getRoster(game.teams.home.team.id)
                ),
                getLineup(game.gamePk, game.teams.away.team.id).catch(() => 
                  getRoster(game.teams.away.team.id)
                )
              ]);

              return {
                ...game,
                homeTeamPlayers: homeTeamPlayers || [],
                awayTeamPlayers: awayTeamPlayers || []
              };
            } catch (error) {
              console.error(`Error loading players for game ${game.gamePk}:`, error);
              return {
                ...game,
                homeTeamPlayers: [],
                awayTeamPlayers: []
              };
            }
          })
        );

        setGames(gamesWithPlayers);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatGameTime = (gameDate: string) => {
    const date = new Date(gameDate);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  };

  const toggleGameExpansion = (gameId: number) => {
    setExpandedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const handlePlayerSelect = (player: Player, threshold: string) => {
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

  const createParlay = () => {
    if (selectedPlayers.length === 0) return;

    const parlay = {
      id: Date.now().toString(),
      type: selectedBetType as any,
      players: selectedPlayers.map(sp => ({
        id: parseInt(sp.player.id),
        fullName: sp.player.fullName,
        position: sp.player.primaryPosition || { code: '', name: '', type: '' },
        battingOrder: undefined
      })),
      gameId: 1, // Mock game ID
      created: new Date().toISOString(),
    };

    addParlay(parlay);
    setSelectedPlayers([]);
  };

  const getPlayerSelection = (player: Player): string | null => {
    const selection = selectedPlayers.find(p => 
      p.player.id === player.id && p.betType === selectedBetType
    );
    return selection ? selection.threshold : null;
  };

  const renderPlayer = (player: Player) => {
    const playerSelection = getPlayerSelection(player);

    return (
      <ThemedView 
        key={player.id}
        style={[styles.playerCard, { 
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderColor: Colors[colorScheme ?? 'light'].border,
        }]}
      >
        <ThemedView style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>
            {player.fullName}
          </ThemedText>
          <ThemedText style={[styles.playerPosition, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {player.primaryPosition?.name || player.primaryPosition?.code}
            {player.battingOrder && ` • #${player.battingOrder}`}
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
                      : Colors[colorScheme ?? 'light'].card,
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

  const renderTeamSection = (teamName: string, players: Player[]) => {
    if (players.length === 0) {
      return (
        <ThemedView style={styles.teamSection}>
          <ThemedText style={[styles.teamHeader, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            {teamName}
          </ThemedText>
          <ThemedText style={[styles.noPlayersText, {
            color: Colors[colorScheme ?? 'light'].muted
          }]}>
            No players available
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.teamSection}>
        <ThemedText style={[styles.teamHeader, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {teamName} ({players.length} players)
        </ThemedText>
        {players.map(player => renderPlayer(player))}
      </ThemedView>
    );
  };

  const renderGame = ({ item: game }: { item: GameWithPlayers }) => {
    const isExpanded = expandedGames.has(game.gamePk);
    const isGameStarted = game.status.abstractGameState !== 'Preview';

    return (
      <ThemedView style={[styles.gameCard, { 
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }]}>
        <TouchableOpacity
          style={styles.gameHeader}
          onPress={() => toggleGameExpansion(game.gamePk)}
        >
          <ThemedView style={styles.gameInfo}>
            <ThemedText style={styles.gameTitle}>
              {game.teams.away.team.name} @ {game.teams.home.team.name}
            </ThemedText>
            <ThemedText style={[styles.gameTime, {
              color: Colors[colorScheme ?? 'light'].secondary
            }]}>
              {formatGameTime(game.gameDate)}
            </ThemedText>
            <ThemedText style={[styles.gameStatus, {
              color: isGameStarted ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].muted
            }]}>
              {game.status.detailedState}
            </ThemedText>
          </ThemedView>
          <ThemedText style={[styles.expandIcon, {
            color: Colors[colorScheme ?? 'light'].tint
          }]}>
            {isExpanded ? '▼' : '▶'}
          </ThemedText>
        </TouchableOpacity>

        {isExpanded && (
          <ThemedView style={styles.gameContent}>
            {renderTeamSection(game.teams.away.team.name, game.awayTeamPlayers)}
            {renderTeamSection(game.teams.home.team.name, game.homeTeamPlayers)}
          </ThemedView>
        )}
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
          Select players by game and team
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

      {/* Games List */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, {
            color: Colors[colorScheme ?? 'light'].secondary
          }]}>
            Loading games and players...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={(item) => item.gamePk.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Selected Players */}
      {selectedPlayers.length > 0 && (
        <ThemedView style={[
          styles.selectedSection, 
          {
            backgroundColor: Colors[colorScheme ?? 'light'].surface,
            borderTopColor: Colors[colorScheme ?? 'light'].border,
            paddingBottom: bottomTabHeight + 16,
            maxHeight: isSelectedExpanded ? '50%' : undefined,
          }
        ]}>
          <TouchableOpacity
            style={styles.selectedHeader}
            onPress={() => selectedPlayers.length > 2 && setIsSelectedExpanded(!isSelectedExpanded)}
            disabled={selectedPlayers.length <= 2}
          >
            <ThemedText style={styles.selectedTitle}>
              Selected Players ({selectedPlayers.length})
            </ThemedText>
            {selectedPlayers.length > 2 && (
              <ThemedText style={[styles.expandIcon, {
                color: Colors[colorScheme ?? 'light'].tint
              }]}>
                {isSelectedExpanded ? '▼' : '▲'}
              </ThemedText>
            )}
          </TouchableOpacity>

          <FlatList
            data={isSelectedExpanded ? selectedPlayers : selectedPlayers.slice(0, 2)}
            renderItem={renderSelectedPlayer}
            keyExtractor={(item) => `${item.player.id}-${item.betType}`}
            style={[styles.selectedList, { flex: isSelectedExpanded ? 1 : undefined }]}
            showsVerticalScrollIndicator={false}
          />

          {selectedPlayers.length > 2 && !isSelectedExpanded && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setIsSelectedExpanded(true)}
            >
              <ThemedText style={[styles.showMoreText, {
                color: Colors[colorScheme ?? 'light'].tint
              }]}>
                Show {selectedPlayers.length - 2} more players
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.createParlayButton, {
              backgroundColor: Colors[colorScheme ?? 'light'].tint,
            }]}
            onPress={createParlay}
          >
            <ThemedText style={[styles.createParlayButtonText, {
              color: '#ffffff'
            }]}>
              Create Parlay ({selectedPlayers.length} players)
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  gameCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  teamSection: {
    gap: 8,
  },
  teamHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noPlayersText: {
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  playerCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  playerInfo: {
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '500',
  },
  thresholdContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 140,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  showMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedList: {
    paddingHorizontal: 20,
  },
  selectedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
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
  createParlayButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createParlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
