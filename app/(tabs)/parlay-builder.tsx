
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useParlayContext } from '@/context/ParlayContext';
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
  const [showGameModal, setShowGameModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameLineups, setGameLineups] = useState<{[key: string]: Player[]}>({});
  const { addParlay, usedPlayers } = useParlayContext();
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

  const fetchLineup = async (gameId: string) => {
    if (gameLineups[gameId]) return;
    
    try {
      const lineup = await getLineup(gameId);
      setGameLineups(prev => ({ ...prev, [gameId]: lineup }));
    } catch (error) {
      console.error('Error fetching lineup:', error);
    }
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    fetchLineup(game.gamePk.toString());
    setShowGameModal(false);
    setShowPlayerModal(true);
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
    setShowPlayerModal(false);
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
      odds: '+150', // Placeholder
      amount: 0,
      createdAt: new Date(),
    };
    
    addParlay(newParlay);
    setSelectedPlayers([]);
  };

  const isPlayerUsed = (playerId: string) => {
    return usedPlayers.includes(playerId);
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <TouchableOpacity
      style={[
        styles.playerItem,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: isPlayerUsed(item.id) ? Colors[colorScheme ?? 'light'].error : Colors[colorScheme ?? 'light'].border,
        }
      ]}
      onPress={() => handlePlayerSelect(item)}
      disabled={isPlayerUsed(item.id)}
    >
      <ThemedView style={styles.playerInfo}>
        <ThemedText style={styles.playerName}>{item.fullName}</ThemedText>
        <ThemedText style={[
          styles.playerPosition,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          {item.primaryPosition.name}
        </ThemedText>
      </ThemedView>
      {isPlayerUsed(item.id) && (
        <ThemedView style={[
          styles.usedBadge,
          { backgroundColor: Colors[colorScheme ?? 'light'].error }
        ]}>
          <ThemedText style={styles.usedText}>Used</ThemedText>
        </ThemedView>
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Build Parlay</ThemedText>
        <ThemedText style={[
          styles.subtitle,
          { color: Colors[colorScheme ?? 'light'].secondary }
        ]}>
          Create your perfect bet combination
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

        {/* Add Player Button */}
        <ThemedView style={styles.section}>
          <TouchableOpacity
            style={[
              styles.addButton,
              { 
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                shadowColor: Colors[colorScheme ?? 'light'].tint,
              }
            ]}
            onPress={() => setShowGameModal(true)}
          >
            <ThemedText style={styles.addButtonText}>+ Add Player</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Selected Players */}
        {selectedPlayers.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Selected Players</ThemedText>
            {selectedPlayers.map((player) => (
              <ThemedView
                key={player.id}
                style={[
                  styles.selectedPlayer,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].card,
                    borderColor: Colors[colorScheme ?? 'light'].border,
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
          </ThemedView>
        )}

        {/* Save Parlay Button */}
        {selectedPlayers.length > 0 && (
          <ThemedView style={styles.section}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].success }
              ]}
              onPress={saveParlayBet}
            >
              <ThemedText style={styles.saveButtonText}>Save Parlay ({selectedPlayers.length} legs)</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ScrollView>

      {/* Game Selection Modal */}
      <Modal
        visible={showGameModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Game</ThemedText>
            <TouchableOpacity onPress={() => setShowGameModal(false)}>
              <ThemedText style={[
                styles.modalClose,
                { color: Colors[colorScheme ?? 'light'].tint }
              ]}>
                Done
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <FlatList
            data={games}
            keyExtractor={(item) => item.gamePk.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.gameOption,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].card,
                    borderColor: Colors[colorScheme ?? 'light'].border,
                  }
                ]}
                onPress={() => handleGameSelect(item)}
              >
                <ThemedText style={styles.gameOptionText}>
                  {item.teams.away.team.name} @ {item.teams.home.team.name}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </ThemedView>
      </Modal>

      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Player</ThemedText>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <ThemedText style={[
                styles.modalClose,
                { color: Colors[colorScheme ?? 'light'].tint }
              ]}>
                Done
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          {selectedGame && (
            <FlatList
              data={gameLineups[selectedGame.gamePk.toString()] || []}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayer}
            />
          )}
        </ThemedView>
      </Modal>
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
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '500',
  },
  gameOption: {
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gameOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerPosition: {
    fontSize: 14,
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
});
