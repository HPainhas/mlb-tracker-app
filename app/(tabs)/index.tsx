import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchGames, fetchLineupOrRoster, getPitchers } from '@/services/mlbApi';
import { getTeamLogoUrl } from '@/services/teamLogos';
import { getTeamDisplayName } from '@/utils/teamUtils';
import { formatGameStatus, formatPitcherDisplay } from '@/utils/gameUtils';
import { Game, LineupOrRoster } from '@/types/mlb';

interface GameWithLineup extends Game {
  lineupOrRoster?: LineupOrRoster | null;
  pitchers?: { 
    away: { name: string | null; type: 'probable' | 'starting' | null; stats?: { era?: string; handedness?: string } }; 
    home: { name: string | null; type: 'probable' | 'starting' | null; stats?: { era?: string; handedness?: string } } 
  } | null;
}

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

// Helper function to sort games by priority and time
const sortGamesByPriority = (games: GameWithLineup[]) => {
  return games.sort((a, b) => {
    // Define priority groups
    const getPriority = (game: GameWithLineup) => {
      const state = game.status.abstractGameState;
      if (state === 'Live') return 1;
      if (state === 'Preview') return 2;
      if (['Final', 'Game Over', 'Postponed', 'Cancelled'].includes(state)) return 3;
      return 4; // Any other states
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    // If different priorities, sort by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If same priority, sort by game time
    return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
  });
};

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const [games, setGames] = useState<GameWithLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  const loadGames = async () => {
    try {
      const fetchedGames = await fetchGames();

      const gamesWithLineupPromises = fetchedGames.map(async (game) => {
        const [lineupOrRoster, pitchers] = await Promise.all([
          fetchLineupOrRoster(game.gamePk.toString()),
          getPitchers(game.gamePk, game.status.abstractGameState, game)
        ]);
        return { ...game, lineupOrRoster, pitchers };
      });

      const gamesWithLineupData = await Promise.all(gamesWithLineupPromises);
      const sortedGames = sortGamesByPriority(gamesWithLineupData);
      setGames(sortedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGames();

    // Set up auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(() => {
      loadGames();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
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

  const renderLineupOrRoster = (
    lineupOrRoster: LineupOrRoster | null | undefined,
    team: "away" | "home",
  ) => {
    if (!lineupOrRoster) {
      return (
        <ThemedText
          style={[
            styles.noLineupText,
            { color: Colors[colorScheme ?? "light"].muted },
          ]}
        >
          No lineup data available
        </ThemedText>
      );
    }

    const teamData = lineupOrRoster[team];
    if (!teamData || teamData.length === 0) {
      return (
        <ThemedText
          style={[
            styles.noLineupText,
            { color: Colors[colorScheme ?? "light"].muted },
          ]}
        >
          No roster data available
        </ThemedText>
      );
    }

    return (
      <ThemedView style={styles.lineupContainer}>
        {teamData.map((player, index) => (
          <ThemedText
            key={index}
            style={[
              styles.playerText,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {player.fullName}
          </ThemedText>
        ))}
      </ThemedView>
    );
  };

  const renderGame = ({ item: game }: { item: GameWithLineup }) => {
    const isGameStarted = game.status.abstractGameState !== 'Preview';
    const isExpanded = expandedGames.has(game.gamePk);

    return (
      <ThemedView style={[styles.gameCard, { 
        backgroundColor: Colors[colorScheme ?? 'light'].card,
        borderColor: Colors[colorScheme ?? 'light'].border,
      }]}>
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
            {formatGameStatus(game.status.detailedState)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.teamsContainer}>
          <ThemedView style={styles.teamRow}>
            <ThemedView style={styles.teamInfo}>
              <Image 
                source={{ uri: getTeamLogoUrl(game.teams.away.team.name) || undefined }} 
                style={styles.teamLogo}
                resizeMode="contain"
              />
              <ThemedView style={styles.teamNameContainer}>
                <ThemedText style={[styles.teamName, {
                  color: '#ffffff'
                }]}>
                  {getTeamDisplayName(game.teams.away.team.name)}
                </ThemedText>
                <ThemedText style={[styles.pitcherText, {
                  color: Colors[colorScheme ?? 'light'].muted
                }]}>
                  P: {formatPitcherDisplay(game.pitchers?.away || { name: null, type: null })}
                </ThemedText>
              </ThemedView>
            </ThemedView>
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
          </ThemedView>

          <ThemedView style={styles.teamRow}>
            <ThemedView style={styles.teamInfo}>
              <Image 
                source={{ uri: getTeamLogoUrl(game.teams.home.team.name) || undefined }} 
                style={styles.teamLogo}
                resizeMode="contain"
              />
              <ThemedView style={styles.teamNameContainer}>
                <ThemedText style={[styles.teamName, {
                  color: Colors[colorScheme ?? 'light'].secondary
                }]}>
                  @ <ThemedText style={{ color: '#ffffff' }}>{getTeamDisplayName(game.teams.home.team.name)}</ThemedText>
                </ThemedText>
                <ThemedText style={[styles.pitcherText, {
                  color: Colors[colorScheme ?? 'light'].muted
                }]}>
                  P: {formatPitcherDisplay(game.pitchers?.home || { name: null, type: null })}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            {isGameStarted && (
              <ThemedView style={[styles.scoreBox, {
                backgroundColor: Colors[colorScheme ?? 'light'].surface,
                borderColor: Colors[colorScheme ?? 'light'].border,
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

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleGameExpansion(game.gamePk)}
          >
            <ThemedText style={[styles.expandButtonText, {
              color: Colors[colorScheme ?? 'light'].tint
            }]}>
              {isExpanded ? 'Hide Lineups' : 'Show Lineups'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {isExpanded && (
          <ThemedView style={[styles.lineupSection, {
            borderTopColor: Colors[colorScheme ?? 'light'].border,
          }]}>
            <ThemedText style={[styles.lineupTitle, {
              color: Colors[colorScheme ?? 'light'].text,
            }]}>
              Lineups
            </ThemedText>
            <ThemedView style={styles.lineupsContainer}>
              <ThemedView style={styles.teamLineupContainer}>
                <ThemedText style={[styles.teamLineupName, {
                  color: Colors[colorScheme ?? 'light'].secondary,
                }]}>
                  {game.teams.away.team.name}
                </ThemedText>
                {renderLineupOrRoster(game.lineupOrRoster, "away")}
              </ThemedView>
              <ThemedView style={styles.teamLineupContainer}>
                <ThemedText style={[styles.teamLineupName, {
                  color: Colors[colorScheme ?? 'light'].secondary,
                }]}>
                  {game.teams.home.team.name}
                </ThemedText>
                {renderLineupOrRoster(game.lineupOrRoster, "home")}
              </ThemedView>
            </ThemedView>
          </ThemedView>
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
        <ThemedText style={[styles.headerSubtitle, {
          color: Colors[colorScheme ?? 'light'].secondary
        }]}>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameHeaderLeft: {
    flex: 1,
  },
  gameTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  gameStatus: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  teamsContainer: {
    marginBottom: 8,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
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
    flexShrink: 1,
  },
  pitcherText: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
    lineHeight: 12,
    flexShrink: 1,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scoreBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lineupSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lineupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  lineupsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  teamLineupContainer: {
    flex: 1,
  },
  teamLineupName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  lineupContainer: {
    gap: 4,
  },
  playerText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  noLineupText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  morePlayersText: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});