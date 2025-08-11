
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlay } from '@/context/ParlayContext';
import { getSchedule, getLineup } from '@/services/mlbApi';
import { Game, Player } from '@/types/mlb';

const PARLAY_TYPES = [
  { id: '1hit', name: '1+ Hit', description: 'Player gets 1 or more hits' },
  { id: '2hit', name: '2+ Hits', description: 'Player gets 2 or more hits' },
  { id: '1base', name: '1+ Total Bases', description: 'Player gets 1 or more total bases' },
  { id: '2base', name: '2+ Total Bases', description: 'Player gets 2 or more total bases' },
  { id: 'hr', name: 'Home Run', description: 'Player hits a home run' },
];

export default function ParlayBuilderScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedType, setSelectedType] = useState(PARLAY_TYPES[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [gameLineups, setGameLineups] = useState<{[key: string]: { home: Player[], away: Player[] }}>({});
  const [loadingLineups, setLoadingLineups] = useState<Set<string>>(new Set());
  const { addParlay, isPlayerUsed } = useParlay();
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gameData = await getSchedule();
      setGames(gameData);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchLineup = async (gameId: string, teamId: number) => {
    try {
      const lineup = await getLineup(parseInt(gameId), teamId);
      return lineup.filter(player => 
        player.primaryPosition.code !== '1' // Filter out pitchers (code '1')
      );
    } catch (error) {
      console.error('Error fetching lineup:', error);
      return [];
    }
  };

  const toggleGameExpansion = async (game: Game) => {
    const gameId = game.gamePk.toString();
    const newExpanded = new Set(expandedGames);
    
    if (expandedGames.has(gameId)) {
      newExpanded.delete(gameId);
    } else {
      newExpanded.add(gameId);
      
      // Fetch lineups if not already loaded
      if (!gameLineups[gameId]) {
        setLoadingLineups(prev => new Set(prev).add(gameId));
        
        const [homeLineup, awayLineup] = await Promise.all([
          fetchLineup(gameId, game.teams.home.team.id),
          fetchLineup(gameId, game.teams.away.team.id)
        ]);
        
        setGameLineups(prev => ({
          ...prev,
          [gameId]: { home: homeLineup, away: awayLineup }
        }));
        
        setLoadingLineups(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameId);
          return newSet;
        });
      }
    }
    
    setExpandedGames(newExpanded);
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectedPlayers.find(p => p.id === player.id) && !isPlayerUsed(parseInt(player.id))) {
      setSelectedPlayers(prev => [...prev, player]);
    }
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const saveParlayBet = () => {
    if (selectedPlayers.length === 0) return;
    
    const newParlay = {
      id: Date.now().toString(),
      type: selectedType.name,
      players: selectedPlayers,
      odds: '+150',
      amount: 0,
      createdAt: new Date(),
    };
    
    addParlay(newParlay);
    setSelectedPlayers([]);
  };

  const formatGameTime = (gameDate: string) => {
    const date = new Date(gameDate);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderPlayer = (player: Player, teamName: string) => {
    const isUsed = isPlayerUsed(parseInt(player.id));
    const isSelected = selectedPlayers.find(p => p.id === player.id);
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerRow,
          {
            backgroundColor: isSelected 
              ? Colors[colorScheme ?? 'light'].tint + '20'
              : Colors[colorScheme ?? 'light'].background,
            borderColor: isSelected 
              ? Colors[colorScheme ?? 'light'].tint
              : Colors[colorScheme ?? 'light'].border,
            opacity: isUsed ? 0.5 : 1,
          }
        ]}
        onPress={() => handlePlayerSelect(player)}
        disabled={isUsed}
      >
        <ThemedView style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>{player.fullName}</ThemedText>
          <ThemedText style={[
            styles.playerDetails,
            { color: Colors[colorScheme ?? 'light'].secondary }
          ]}>
            {teamName} • {player.primaryPosition.name} • #{player.battingOrder || 'Sub'}
          </ThemedText>
        </ThemedView>
        {isUsed && (
          <ThemedView style={[
            styles.usedBadge,
            { backgroundColor: Colors[colorScheme ?? 'light'].error }
          ]}>
            <ThemedText style={styles.usedText}>Used</ThemedText>
          </ThemedView>
        )}
        {isSelected && !isUsed && (
          <ThemedView style={[
            styles.selectedBadge,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]}>
            <ThemedText style={styles.selectedText}>✓</ThemedText>
          </ThemedView>
        )}
      </TouchableOpacity>
    );
  };

  const renderGameCard = (game: Game) => {
    const gameId = game.gamePk.toString();
    const isExpanded = expandedGames.has(gameId);
    const isLoading = loadingLineups.has(gameId);
    const lineups = gameLineups[gameId];

    return (
      <ThemedView
        key={gameId}
        style={[
          styles.gameCard,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].card,
            borderColor: Colors[colorScheme ?? 'light'].border,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.gameHeader}
          onPress={() => toggleGameExpansion(game)}
        >
          <ThemedView style={styles.gameInfo}>
            <ThemedText style={styles.gameTitle}>
              {game.teams.away.team.name} @ {game.teams.home.team.name}
            </ThemedText>
            <ThemedText style={[
              styles.gameTime,
              { color: Colors[colorScheme ?? 'light'].secondary }
            ]}>
              {formatGameTime(game.gameDate)} • {game.venue.name}
            </ThemedText>
          </ThemedView>
          <ThemedText style={[
            styles.expandIcon,
            { color: Colors[colorScheme ?? 'light'].tint }
          ]}>
            {isExpanded ? '−' : '+'}
          </ThemedText>
        </TouchableOpacity>

        {isExpanded && (
          <ThemedView style={styles.gameContent}>
            {isLoading ? (
              <ThemedView style={styles.loadingContainer}>
                <ThemedText style={[
                  styles.loadingText,
                  { color: Colors[colorScheme ?? 'light'].secondary }
                ]}>
                  Loading lineups...
                </ThemedText>
              </ThemedView>
            ) : lineups ? (
              <>
                {/* Away Team */}
                <ThemedView style={styles.teamSection}>
                  <ThemedText style={styles.teamHeader}>
                    {game.teams.away.team.name} (Away)
                  </ThemedText>
                  {lineups.away.map(player => 
                    renderPlayer(player, game.teams.away.team.abbreviation)
                  )}
                </ThemedView>

                {/* Home Team */}
                <ThemedView style={styles.teamSection}>
                  <ThemedText style={styles.teamHeader}>
                    {game.teams.home.team.name} (Home)
                  </ThemedText>
                  {lineups.home.map(player => 
                    renderPlayer(player, game.teams.home.team.abbreviation)
                  )}
                </ThemedView>
              </>
            ) : (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={[
                  styles.errorText,
                  { color: Colors[colorScheme ?? 'light'].error }
                ]}>
                  Unable to load lineups
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Build Parlay</ThemedText>
        <ThemedText style={[
          styles.subtitle,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          Select players from today's games
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Parlay Type Selection */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Bet Type</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ThemedView style={styles.typeContainer}>
              {PARLAY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: selectedType.id === type.id 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].card,
                      borderColor: Colors[colorScheme ?? 'light'].border,
                    }
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <ThemedText style={[
                    styles.typeButtonText,
                    {
                      color: selectedType.id === type.id 
                        ? '#FFFFFF'
                        : Colors[colorScheme ?? 'light'].text
                    }
                  ]}>
                    {type.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ScrollView>
        </ThemedView>

        {/* Games Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Today's Games</ThemedText>
          {games.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={[
                styles.emptyText,
                { color: Colors[colorScheme ?? 'light'].secondary }
              ]}>
                No games scheduled for today
              </ThemedText>
            </ThemedView>
          ) : (
            games.map(renderGameCard)
          )}
        </ThemedView>

        {/* Selected Players */}
        {selectedPlayers.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Selected Players ({selectedPlayers.length})
            </ThemedText>
            {selectedPlayers.map((player) => (
              <ThemedView
                key={player.id}
                style={[
                  styles.selectedPlayer,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].card,
                    borderColor: Colors[colorScheme ?? 'light'].tint,
                  }
                ]}
              >
                <ThemedView style={styles.selectedPlayerInfo}>
                  <ThemedText style={styles.selectedPlayerName}>{player.fullName}</ThemedText>
                  <ThemedText style={[
                    styles.selectedPlayerDetails,
                    { color: Colors[colorScheme ?? 'light'].secondary }
                  ]}>
                    {selectedType.name} • {player.primaryPosition.name}
                  </ThemedText>
                </ThemedView>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    { backgroundColor: Colors[colorScheme ?? 'light'].error }
                  ]}
                  onPress={() => removePlayer(player.id)}
                >
                  <ThemedText style={styles.removeButtonText}>×</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ))}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].success }
              ]}
              onPress={saveParlayBet}
            >
              <ThemedText style={styles.saveButtonText}>
                Save Parlay ({selectedPlayers.length} legs)
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
    fontWeight: '400',
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  gameContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  teamSection: {
    marginBottom: 20,
  },
  teamHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerDetails: {
    fontSize: 13,
    fontWeight: '400',
  },
  usedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  usedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
  },
  selectedPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  selectedPlayerInfo: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedPlayerDetails: {
    fontSize: 14,
    fontWeight: '400',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
