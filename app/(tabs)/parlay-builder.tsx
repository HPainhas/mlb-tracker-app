import { StyleSheet, FlatList, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';
import { fetchGames, getLineup, getRoster, getPitchers } from '@/services/mlbApi';
import { getTeamLogoUrl } from '@/services/teamLogos';
import { getTeamDisplayName } from '@/utils/teamUtils';
import { Game, Player } from '@/types/mlb';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

interface SelectedPlayer {
  player: Player;
  betType: string;
  threshold: string;
  gameId: number;
  gameInfo: {
    awayTeam: string;
    homeTeam: string;
    gameTime: string;
  };
}

interface GameWithPlayers extends Game {
  homeTeamPlayers: Player[];
  awayTeamPlayers: Player[];
  pitchers?: { 
    away: { name: string | null; type: 'probable' | 'starting' | null }; 
    home: { name: string | null; type: 'probable' | 'starting' | null } 
  } | null;
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
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = async () => {
    try {
      const fetchedGames = await fetchGames();

      const gamesWithPlayers = await Promise.all(
        fetchedGames.map(async (game) => {
          try {
            // Try to get lineups first, fallback to roster
            const [homeTeamPlayers, awayTeamPlayers, pitchers] = await Promise.all([
              getLineup(game.gamePk, game.teams.home.team.id).catch(() => 
                getRoster(game.teams.home.team.id)
              ),
              getLineup(game.gamePk, game.teams.away.team.id).catch(() => 
                getRoster(game.teams.away.team.id)
              ),
              getPitchers(game.gamePk, game.status.abstractGameState, game)
            ]);

            return {
              ...game,
              homeTeamPlayers: homeTeamPlayers || [],
              awayTeamPlayers: awayTeamPlayers || [],
              pitchers
            };
          } catch (error) {
            console.error(`Error loading players for game ${game.gamePk}:`, error);
            return {
              ...game,
              homeTeamPlayers: [],
              awayTeamPlayers: [],
              pitchers: null
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

  useEffect(() => {
    loadData(); // Initial load

    // Set up interval for auto-refresh
    refreshIntervalRef.current = setInterval(loadData, 60000); // Refresh every 60 seconds

    // Cleanup interval on component unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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

  const isGameExpandable = (gameStatus: string) => {
    return ['In Progress', 'Scheduled', 'Delayed'].includes(gameStatus);
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

  const handlePlayerSelect = (player: Player, threshold: string, game: GameWithPlayers) => {
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
          updated[existingIndex] = { 
            player, 
            betType: selectedBetType, 
            threshold,
            gameId: game.gamePk,
            gameInfo: {
              awayTeam: getTeamDisplayName(game.teams.away.team.name),
              homeTeam: getTeamDisplayName(game.teams.home.team.name),
              gameTime: formatGameTime(game.gameDate)
            }
          };
          return updated;
        }
      } else {
        // New selection
        return [...prev, { 
          player, 
          betType: selectedBetType, 
          threshold,
          gameId: game.gamePk,
          gameInfo: {
            awayTeam: getTeamDisplayName(game.teams.away.team.name),
            homeTeam: getTeamDisplayName(game.teams.home.team.name),
            gameTime: formatGameTime(game.gameDate)
          }
        }];
      }
    });
  };

  const removePlayer = (playerId: string, betType: string) => {
    setSelectedPlayers(prev => 
      prev.filter(p => !(p.player.id === playerId && p.betType === betType))
    );
  };

  const removeAllSelections = () => {
    setSelectedPlayers([]);
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
        battingOrder: undefined,
        threshold: sp.threshold,
        betType: sp.betType
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

  const groupSelectedPlayersByGame = () => {
    const grouped = selectedPlayers.reduce((acc, player) => {
      const gameKey = player.gameId;
      if (!acc[gameKey]) {
        acc[gameKey] = {
          gameInfo: player.gameInfo,
          players: []
        };
      }
      acc[gameKey].players.push(player);
      return acc;
    }, {} as Record<number, { gameInfo: { awayTeam: string; homeTeam: string; gameTime: string }; players: SelectedPlayer[] }>);

    return Object.values(grouped);
  };

  const renderPlayer = (player: Player, index: number, totalPlayers: number, game: GameWithPlayers) => {
    const playerSelection = getPlayerSelection(player);

    return (
      <ThemedView 
        key={player.id}
        style={[styles.playerRow, { 
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderColor: Colors[colorScheme ?? 'light'].border,
          borderBottomWidth: index === totalPlayers - 1 ? 0 : StyleSheet.hairlineWidth,
        }]}
      >
        <ThemedText style={styles.playerName}>
          {player.fullName}
        </ThemedText>
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
                onPress={() => handlePlayerSelect(player, threshold, game)}
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

  const renderTeamSection = (teamName: string, players: Player[], game: GameWithPlayers) => {
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
        <ThemedView style={[styles.playersContainer, {
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderColor: Colors[colorScheme ?? 'light'].border,
        }]}>
          {players.map((player, index) => renderPlayer(player, index, players.length, game))}
        </ThemedView>
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
          style={styles.gameContainer}
          onPress={() => toggleGameExpansion(game.gamePk)}
          disabled={!isGameExpandable(game.status.detailedState)}
        >
          <ThemedView style={styles.gameHeader}>
            <ThemedView style={styles.gameHeaderLeft}>
              <ThemedText style={[styles.gameTime, {
                color: Colors[colorScheme ?? 'light'].secondary
              }]}>
                {formatGameTime(game.gameDate)}
              </ThemedText>
            </ThemedView>
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

          <ThemedView style={styles.gameContent}>
            <ThemedView style={styles.gameTitleContainer}>
              <ThemedView style={styles.teamsAndScoresRow}>
                <ThemedView style={styles.teamsColumn}>
                  <ThemedView style={styles.teamTitleRow}>
                    <ThemedView style={styles.teamInfo}>
                      <Image 
                        source={{ uri: getTeamLogoUrl(game.teams.away.team.name) || undefined }} 
                        style={styles.teamLogo}
                        resizeMode="contain"
                      />
                      <ThemedView style={styles.teamNameContainer}>
                        <ThemedText style={styles.gameTitle}>
                          {getTeamDisplayName(game.teams.away.team.name)}
                        </ThemedText>
                        {game.pitchers?.away.name ? (
                          <ThemedText style={[styles.pitcherText, {
                            color: Colors[colorScheme ?? 'light'].muted
                          }]}>
                            P: {game.pitchers.away.name}
                          </ThemedText>
                        ) : (
                          <ThemedText style={[styles.pitcherText, {
                            color: Colors[colorScheme ?? 'light'].muted
                          }]}>
                            P: TBD
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                  <ThemedView style={styles.teamTitleRow}>
                    <ThemedView style={styles.teamInfo}>
                      <Image 
                        source={{ uri: getTeamLogoUrl(game.teams.home.team.name) || undefined }} 
                        style={styles.teamLogo}
                        resizeMode="contain"
                      />
                      <ThemedView style={styles.teamNameContainer}>
                        <ThemedText style={[styles.gameTitle, {
                          color: Colors[colorScheme ?? 'light'].secondary
                        }]}>
                          @ <ThemedText style={{ color: '#ffffff' }}>{getTeamDisplayName(game.teams.home.team.name)}</ThemedText>
                        </ThemedText>
                        {game.pitchers?.home.name ? (
                          <ThemedText style={[styles.pitcherText, {
                            color: Colors[colorScheme ?? 'light'].muted
                          }]}>
                            P: {game.pitchers.home.name}
                          </ThemedText>
                        ) : (
                          <ThemedText style={[styles.pitcherText, {
                            color: Colors[colorScheme ?? 'light'].muted
                          }]}>
                            P: TBD
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.scoresColumn}>
                  {isGameStarted && (
                    <ThemedView style={[styles.scoreBox, {
                      backgroundColor: Colors[colorScheme ?? 'light'].surface,
                      borderColor: Colors[colorScheme ?? 'light'].border,
                    }]}>
                      <ThemedText style={[styles.teamScore, {
                        color: Colors[colorScheme ?? 'light'].text
                      }]}>
                        {game.teams.away.score}
                      </ThemedText>
                    </ThemedView>
                  )}
                  {isGameStarted && (
                    <ThemedView style={[styles.scoreBox, {
                      backgroundColor: Colors[colorScheme ?? 'light'].surface,
                      borderColor: Colors[colorScheme ?? 'light'].border,
                      marginTop: 18,
                    }]}>
                      <ThemedText style={[styles.teamScore, {
                        color: Colors[colorScheme ?? 'light'].text
                      }]}>
                        {game.teams.home.score}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedView>
            
            {/* Expand Icon positioned separately */}
            {isGameExpandable(game.status.detailedState) && (
              <ThemedText style={[styles.expandIcon, {
                color: Colors[colorScheme ?? 'light'].tint
              }]}>
                {isExpanded ? '▼' : '▶'}
              </ThemedText>
            )}
          </ThemedView>
        </TouchableOpacity>

        {isExpanded && (
          <ThemedView style={styles.expandedGameContent}>
            {renderTeamSection(game.teams.away.team.name, game.awayTeamPlayers, game)}
            {renderTeamSection(game.teams.home.team.name, game.homeTeamPlayers, game)}
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  const renderSelectedPlayer = ({ item, index }: { item: SelectedPlayer; index: number }) => (
    <ThemedView style={styles.selectedPlayerRow}>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removePlayer(item.player.id, item.betType)}
      >
        <ThemedText style={styles.removeButtonText}>
          −
        </ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.selectedPlayerContent}>
        <ThemedText style={styles.selectedPlayerName}>
          {item.player.fullName}
        </ThemedText>
        <ThemedText style={[styles.selectedPlayerAction, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {item.threshold} {item.betType.toUpperCase()}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  const renderGameGroup = ({ item }: { item: { gameInfo: { awayTeam: string; homeTeam: string; gameTime: string }; players: SelectedPlayer[] } }) => (
    <ThemedView style={styles.gameGroupContainer}>
      <ThemedView style={[styles.gameGroupHeader, {
        backgroundColor: Colors[colorScheme ?? 'light'].card,
      }]}>
        <ThemedText style={[styles.gameGroupTitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
          {item.gameInfo.awayTeam} @ {item.gameInfo.homeTeam}
        </ThemedText>
        <ThemedText style={[styles.gameGroupTime, {
          color: Colors[colorScheme ?? 'light'].muted
        }]}>
          {item.gameInfo.gameTime}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.gameGroupPlayers}>
        {item.players.map((player, index) => (
          <ThemedView key={`${player.player.id}-${player.betType}`} style={styles.selectedPlayerRow}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePlayer(player.player.id, player.betType)}
            >
              <ThemedText style={styles.removeButtonText}>
                −
              </ThemedText>
            </TouchableOpacity>
            <ThemedView style={styles.selectedPlayerContent}>
              <ThemedText style={styles.selectedPlayerName}>
                {player.player.fullName}
              </ThemedText>
              <ThemedText style={[styles.selectedPlayerAction, {
                color: Colors[colorScheme ?? 'light'].secondary
              }]}>
                {player.threshold} {player.betType.toUpperCase()}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
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
            maxHeight: isSelectedExpanded ? '80%' : undefined,
          }
        ]}>
          <TouchableOpacity
            style={styles.selectedHeader}
            onPress={() => setIsSelectedExpanded(!isSelectedExpanded)}
          >
            <ThemedView style={styles.selectedHeaderLeft}>
              <ThemedView style={[styles.betCountBadge, {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              }]}>
                <ThemedText style={styles.betCountText}>
                  {selectedPlayers.length}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.selectedTitle}>
                Selected Players Parlay
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.selectedHeaderRight}>
              <ThemedText style={[styles.parlaySummary, {
                color: Colors[colorScheme ?? 'light'].secondary
              }]}>
                {selectedPlayers.length} selections
              </ThemedText>
              <ThemedText style={[styles.parlayExpandIcon, {
                color: Colors[colorScheme ?? 'light'].tint
              }]}>
                {isSelectedExpanded ? '▼' : '▲'}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>

          {isSelectedExpanded && (
            <>
              <FlatList
                data={groupSelectedPlayersByGame()}
                renderItem={renderGameGroup}
                keyExtractor={(item) => `${item.gameInfo.awayTeam}-${item.gameInfo.homeTeam}`}
                style={styles.selectedList}
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity
                style={[styles.removeAllButton, {
                  backgroundColor: Colors[colorScheme ?? 'light'].card,
                  borderColor: Colors[colorScheme ?? 'light'].border,
                }]}
                onPress={removeAllSelections}
              >
                <ThemedText style={[styles.removeAllButtonText, {
                  color: Colors[colorScheme ?? 'light'].text
                }]}>
                  Remove All Selections
                </ThemedText>
              </TouchableOpacity>

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
            </>
          )}
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
  betTypeContainer: {
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#979797',
    marginBottom: 12,
  },
  betTypeScrollContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  betTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 100,
    alignItems: 'center',
  },
  betTypeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  gameContainer: {
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameHeaderLeft: {
    flex: 1,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitleContainer: {
    marginBottom: 4,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  teamsAndScoresRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamsColumn: {
    flex: 1,
  },
  scoresColumn: {
    width: 50,
    alignItems: 'flex-start',
    gap: 8,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  teamNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pitcherText: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
  },
  teamLogo: {
    width: 20,
    height: 20,
    marginTop: 2,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameTitleSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  gameTime: {
    fontSize: 12,
    fontWeight: '600',
  },

  scoreBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  teamScore: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  gameStatus: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 80,
    textAlign: 'right',
  },
  gameContent: {
    position: 'relative',
    paddingRight: 100,
    marginTop: 12,
  },

  expandIcon: {
    fontSize: 20,
    fontWeight: '600',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -35 }],
    zIndex: 1,
  },
  parlayExpandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedGameContent: {
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
  playersContainer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playerInfo: {
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '500',
  },
  thresholdContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  thresholdButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    minWidth: 32,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  betCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  selectedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parlaySummary: {
    fontSize: 11,
    fontWeight: '500',
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  selectedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#38383A',
    gap: 12,
  },
  selectedPlayerContent: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedPlayerAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedPlayerBet: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  removeAllButton: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createParlayButton: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createParlayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameGroupContainer: {
    marginBottom: 16,
  },
  gameGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  gameGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameGroupTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameGroupPlayers: {
    paddingLeft: 16,
  },
});