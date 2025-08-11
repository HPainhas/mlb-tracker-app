
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MLBGame, MLBPlayer, ParlayBet } from '@/types/mlb';
import { MLBApiService } from '@/services/mlbApi';
import { useParlay } from '@/context/ParlayContext';
import { Collapsible } from '@/components/Collapsible';

const PARLAY_TYPES = [
  '1+ Hit', '2+ Hits', '3+ Hits', '4+ Hits',
  '1+ Bases', '2+ Bases', '3+ Bases', 'HR'
] as const;

export default function ParlayBuilderScreen() {
  const [games, setGames] = useState<MLBGame[]>([]);
  const [selectedType, setSelectedType] = useState<typeof PARLAY_TYPES[number]>('1+ Hit');
  const [selectedPlayers, setSelectedPlayers] = useState<MLBPlayer[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [lineups, setLineups] = useState<{[key: string]: MLBPlayer[]}>({});
  const [loading, setLoading] = useState(true);
  
  const { addParlay, isPlayerUsed } = useParlay();
  const colorScheme = useColorScheme() ?? 'dark';

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const todaysGames = await MLBApiService.getTodaysGames();
      setGames(todaysGames.filter(game => 
        game.status.abstractGameState === 'Preview' || 
        game.status.abstractGameState === 'Live'
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const fetchLineup = async (gameId: number, teamId: number) => {
    const key = `${gameId}-${teamId}`;
    if (lineups[key]) return lineups[key];

    try {
      const lineup = await MLBApiService.getGameLineup(gameId, teamId);
      setLineups(prev => ({ ...prev, [key]: lineup }));
      return lineup;
    } catch (error) {
      console.error('Error fetching lineup:', error);
      return [];
    }
  };

  const togglePlayer = (player: MLBPlayer, gameId: number) => {
    const isSelected = selectedPlayers.some(p => p.id === player.id);
    
    if (isSelected) {
      setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    } else {
      if (selectedGameId && selectedGameId !== gameId) {
        Alert.alert('Different Game', 'You can only select players from one game per parlay.');
        return;
      }
      
      setSelectedPlayers(prev => [...prev, player]);
      setSelectedGameId(gameId);
    }
  };

  const createParlay = () => {
    if (selectedPlayers.length === 0) {
      Alert.alert('No Players', 'Please select at least one player.');
      return;
    }

    const parlay: ParlayBet = {
      id: Date.now().toString(),
      type: selectedType,
      players: selectedPlayers,
      gameId: selectedGameId!,
      created: new Date().toISOString(),
    };

    addParlay(parlay);
    
    // Reset selections
    setSelectedPlayers([]);
    setSelectedGameId(null);
    
    Alert.alert('Success', `Parlay created with ${selectedPlayers.length} player(s)!`);
  };

  const PlayerItem = ({ player, gameId }: { player: MLBPlayer; gameId: number }) => {
    const isSelected = selectedPlayers.some(p => p.id === player.id);
    const isUsed = isPlayerUsed(player.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.playerItem,
          {
            backgroundColor: Colors[colorScheme].card,
            borderColor: isSelected 
              ? Colors[colorScheme].success 
              : isUsed 
                ? Colors[colorScheme].error 
                : Colors[colorScheme].border,
            borderWidth: isSelected || isUsed ? 2 : 1,
          }
        ]}
        onPress={() => togglePlayer(player, gameId)}
      >
        <ThemedView style={styles.playerInfo}>
          <ThemedText type="defaultSemiBold">{player.fullName}</ThemedText>
          <ThemedText style={styles.playerPosition}>
            {player.position.name} {player.battingOrder ? `(#${player.battingOrder})` : ''}
          </ThemedText>
        </ThemedView>
        {isUsed && (
          <ThemedText style={[styles.usedIndicator, { color: Colors[colorScheme].error }]}>
            Used
          </ThemedText>
        )}
        {isSelected && (
          <ThemedText style={[styles.selectedIndicator, { color: Colors[colorScheme].success }]}>
            ✓
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText type="title">Loading Games...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Parlay Builder</ThemedText>
          
          {/* Parlay Type Selector */}
          <ThemedView style={styles.typeSelector}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Bet Type</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ThemedView style={styles.typeButtons}>
                {PARLAY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: selectedType === type 
                          ? Colors[colorScheme].tint 
                          : Colors[colorScheme].card,
                        borderColor: Colors[colorScheme].border,
                      }
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <ThemedText 
                      style={[
                        styles.typeButtonText,
                        { color: selectedType === type ? '#000' : Colors[colorScheme].text }
                      ]}
                    >
                      {type}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ScrollView>
          </ThemedView>

          {/* Selected Players */}
          {selectedPlayers.length > 0 && (
            <ThemedView style={styles.selectedSection}>
              <ThemedText type="subtitle">Selected Players ({selectedPlayers.length})</ThemedText>
              {selectedPlayers.map((player) => (
                <ThemedText key={player.id} style={styles.selectedPlayer}>
                  • {player.fullName}
                </ThemedText>
              ))}
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { backgroundColor: Colors[colorScheme].success }
                ]}
                onPress={createParlay}
              >
                <ThemedText style={styles.createButtonText}>
                  Create {selectedType} Parlay
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>

        {/* Games List */}
        <ThemedView style={styles.gamesSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Select Players</ThemedText>
          
          {games.length === 0 ? (
            <ThemedView style={styles.noGamesContainer}>
              <ThemedText>No games available for betting</ThemedText>
            </ThemedView>
          ) : (
            games.map((game) => (
              <ThemedView key={game.gamePk} style={styles.gameSection}>
                <Collapsible 
                  title={`${game.teams.away.team.name} @ ${game.teams.home.team.name}`}
                >
                  <ThemedView style={styles.teamsContainer}>
                    {/* Away Team */}
                    <ThemedView style={styles.teamSection}>
                      <ThemedText type="defaultSemiBold" style={styles.teamHeader}>
                        {game.teams.away.team.name}
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.loadLineupButton}
                        onPress={() => fetchLineup(game.gamePk, game.teams.away.team.id)}
                      >
                        <ThemedText style={styles.loadLineupText}>Load Lineup</ThemedText>
                      </TouchableOpacity>
                      {lineups[`${game.gamePk}-${game.teams.away.team.id}`]?.map((player) => (
                        <PlayerItem key={player.id} player={player} gameId={game.gamePk} />
                      ))}
                    </ThemedView>

                    {/* Home Team */}
                    <ThemedView style={styles.teamSection}>
                      <ThemedText type="defaultSemiBold" style={styles.teamHeader}>
                        {game.teams.home.team.name}
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.loadLineupButton}
                        onPress={() => fetchLineup(game.gamePk, game.teams.home.team.id)}
                      >
                        <ThemedText style={styles.loadLineupText}>Load Lineup</ThemedText>
                      </TouchableOpacity>
                      {lineups[`${game.gamePk}-${game.teams.home.team.id}`]?.map((player) => (
                        <PlayerItem key={player.id} player={player} gameId={game.gamePk} />
                      ))}
                    </ThemedView>
                  </ThemedView>
                </Collapsible>
              </ThemedView>
            ))
          )}
        </ThemedView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
  },
  typeSelector: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  selectedPlayer: {
    marginLeft: 8,
    marginVertical: 2,
  },
  createButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  gamesSection: {
    padding: 20,
    paddingTop: 0,
  },
  gameSection: {
    marginBottom: 16,
  },
  noGamesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  teamsContainer: {
    gap: 16,
  },
  teamSection: {
    gap: 8,
  },
  teamHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  loadLineupButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadLineupText: {
    fontSize: 12,
    opacity: 0.8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  playerInfo: {
    flex: 1,
  },
  playerPosition: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  usedIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
