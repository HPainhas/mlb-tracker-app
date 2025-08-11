
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParlayBet, MLBPlayer } from '../types/mlb';

interface ParlayContextType {
  parlays: ParlayBet[];
  usedPlayerIds: Set<number>;
  addParlay: (parlay: ParlayBet) => void;
  removeParlay: (parlayId: string) => void;
  isPlayerUsed: (playerId: number) => boolean;
}

const ParlayContext = createContext<ParlayContextType | undefined>(undefined);

export function ParlayProvider({ children }: { children: React.ReactNode }) {
  const [parlays, setParlays] = useState<ParlayBet[]>([]);
  const [usedPlayerIds, setUsedPlayerIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadParlays();
  }, []);

  useEffect(() => {
    const playerIds = new Set<number>();
    parlays.forEach(parlay => {
      parlay.players.forEach(player => {
        playerIds.add(player.id);
      });
    });
    setUsedPlayerIds(playerIds);
  }, [parlays]);

  const loadParlays = async () => {
    try {
      const stored = await AsyncStorage.getItem('parlays');
      if (stored) {
        setParlays(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading parlays:', error);
    }
  };

  const saveParlays = async (newParlays: ParlayBet[]) => {
    try {
      await AsyncStorage.setItem('parlays', JSON.stringify(newParlays));
    } catch (error) {
      console.error('Error saving parlays:', error);
    }
  };

  const addParlay = (parlay: ParlayBet) => {
    const newParlays = [...parlays, parlay];
    setParlays(newParlays);
    saveParlays(newParlays);
  };

  const removeParlay = (parlayId: string) => {
    const newParlays = parlays.filter(p => p.id !== parlayId);
    setParlays(newParlays);
    saveParlays(newParlays);
  };

  const isPlayerUsed = (playerId: number) => {
    return usedPlayerIds.has(playerId);
  };

  return (
    <ParlayContext.Provider value={{
      parlays,
      usedPlayerIds,
      addParlay,
      removeParlay,
      isPlayerUsed
    }}>
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  const context = useContext(ParlayContext);
  if (context === undefined) {
    throw new Error('useParlay must be used within a ParlayProvider');
  }
  return context;
}
