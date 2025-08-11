
import axios from 'axios';
import { Game, Player } from '../types/mlb';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export const getSchedule = async (): Promise<Game[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(
      `${MLB_API_BASE}/schedule?sportId=1&date=${today}&hydrate=team,venue`
    );
    
    if (!response.data.dates || response.data.dates.length === 0) {
      return [];
    }
    
    return response.data.dates[0].games.map((game: any) => ({
      gamePk: game.gamePk,
      gameDate: game.gameDate,
      status: game.status,
      teams: {
        away: {
          team: {
            id: game.teams.away.team.id,
            name: game.teams.away.team.name,
            abbreviation: game.teams.away.team.abbreviation,
            teamName: game.teams.away.team.teamName
          },
          score: game.teams.away.score
        },
        home: {
          team: {
            id: game.teams.home.team.id,
            name: game.teams.home.team.name,
            abbreviation: game.teams.home.team.abbreviation,
            teamName: game.teams.home.team.teamName
          },
          score: game.teams.home.score
        }
      },
      venue: {
        name: game.venue.name
      }
    }));
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
};

// Export fetchGames as an alias for getSchedule for backwards compatibility
export const fetchGames = getSchedule;

export const getLineup = async (gameId: number, teamId: number): Promise<Player[]> => {
  try {
    // Try boxscore first
    const response = await axios.get(
      `${MLB_API_BASE}/game/${gameId}/boxscore`
    );
    
    const boxscore = response.data.teams;
    const teamData = boxscore.away.team.id === teamId ? boxscore.away : boxscore.home;
    
    const players: Player[] = [];
    
    // Get batting lineup
    if (teamData.battingOrder) {
      for (const playerId of teamData.battingOrder) {
        const player = teamData.players[`ID${playerId}`];
        if (player?.person) {
          players.push({
            id: player.person.id.toString(),
            fullName: player.person.fullName,
            primaryPosition: {
              code: player.position?.code || '',
              name: player.position?.name || '',
              type: player.position?.type || ''
            },
            battingOrder: teamData.battingOrder.indexOf(playerId) + 1
          });
        }
      }
    }
    
    // If no batting order, get all batters from players
    if (players.length === 0 && teamData.players) {
      Object.values(teamData.players).forEach((playerData: any) => {
        if (playerData?.person && playerData?.position?.code !== '1') { // Exclude pitchers
          players.push({
            id: playerData.person.id.toString(),
            fullName: playerData.person.fullName,
            primaryPosition: {
              code: playerData.position?.code || '',
              name: playerData.position?.name || '',
              type: playerData.position?.type || ''
            },
            battingOrder: undefined
          });
        }
      });
    }
    
    return players.sort((a, b) => (a.battingOrder || 99) - (b.battingOrder || 99));
  } catch (error) {
    console.error('Error fetching lineup:', error);
    // Fallback: try to get roster data
    try {
      const rosterResponse = await axios.get(
        `${MLB_API_BASE}/teams/${teamId}/roster/Active`
      );
      
      const players: Player[] = rosterResponse.data.roster
        .filter((player: any) => player.position.code !== '1') // Exclude pitchers
        .map((player: any) => ({
          id: player.person.id.toString(),
          fullName: player.person.fullName,
          primaryPosition: {
            code: player.position.code,
            name: player.position.name,
            type: player.position.type
          },
          battingOrder: undefined
        }));
      
      return players;
    } catch (fallbackError) {
      console.error('Error fetching roster:', fallbackError);
      return [];
    }
  }
};
