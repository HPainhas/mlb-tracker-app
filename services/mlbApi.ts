
import axios from 'axios';
import { MLBGame, MLBLineup, MLBPlayer } from '../types/mlb';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export class MLBApiService {
  static async getTodaysGames(): Promise<MLBGame[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `${MLB_API_BASE}/schedule?sportId=1&date=${today}&hydrate=team,venue`
      );
      return response.data.dates[0]?.games || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  static async getGameLineup(gameId: number, teamId: number): Promise<MLBPlayer[]> {
    try {
      const response = await axios.get(
        `${MLB_API_BASE}/game/${gameId}/boxscore`
      );
      
      const boxscore = response.data.teams;
      const teamData = boxscore.away.team.id === teamId ? boxscore.away : boxscore.home;
      
      const players: MLBPlayer[] = [];
      
      // Get batting lineup
      if (teamData.battingOrder) {
        for (const playerId of teamData.battingOrder) {
          const player = teamData.players[`ID${playerId}`];
          if (player?.person) {
            players.push({
              id: player.person.id,
              fullName: player.person.fullName,
              position: player.position,
              battingOrder: teamData.battingOrder.indexOf(playerId) + 1
            });
          }
        }
      }
      
      return players.sort((a, b) => (a.battingOrder || 0) - (b.battingOrder || 0));
    } catch (error) {
      console.error('Error fetching lineup:', error);
      return [];
    }
  }
}
