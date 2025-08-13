
import axios from 'axios';
import { Game, Player } from '../types/mlb';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export const getSchedule = async (): Promise<Game[]> => {
  try {
    // Get current date in ET (MLB's official timezone)
    const today = new Date();
    const etOffset = -5; // EST offset (adjust for EDT if needed)
    const etDate = new Date(today.getTime() + (etOffset * 60 * 60 * 1000));
    const dateStr = etDate.toISOString().split('T')[0];
    
    const response = await axios.get(
      `${MLB_API_BASE}/schedule?sportId=1&date=${dateStr}&hydrate=team,venue,linescore,probablePitcher`
    );
    
    if (!response.data.dates || response.data.dates.length === 0) {
      return [];
    }
    
    return response.data.dates[0].games.map((game: any) => ({
      gamePk: game.gamePk,
      gameDate: game.gameDate,
      status: {
        abstractGameState: game.status.abstractGameState,
        detailedState: game.status.detailedState
      },
      teams: {
        away: {
          team: {
            id: game.teams.away.team.id,
            name: game.teams.away.team.name,
            abbreviation: game.teams.away.team.abbreviation,
            teamName: game.teams.away.team.teamName
          },
          score: game.teams.away.score || 0,
          probablePitcher: game.teams.away.probablePitcher
        },
        home: {
          team: {
            id: game.teams.home.team.id,
            name: game.teams.home.team.name,
            abbreviation: game.teams.home.team.abbreviation,
            teamName: game.teams.home.team.teamName
          },
          score: game.teams.home.score || 0,
          probablePitcher: game.teams.home.probablePitcher
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
    // Try boxscore first for lineup
    const response = await axios.get(
      `${MLB_API_BASE}/game/${gameId}/boxscore`
    );
    
    const boxscore = response.data.teams;
    const teamData = boxscore.away.team.id === teamId ? boxscore.away : boxscore.home;
    
    const players: Player[] = [];
    
    // Get batting lineup
    if (teamData.battingOrder && teamData.battingOrder.length > 0) {
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
    
    // If no batting order, get all position players from boxscore
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
    
    // If still no players, fall back to roster
    if (players.length === 0) {
      return await getRoster(teamId);
    }
    
    return players.sort((a, b) => (a.battingOrder || 99) - (b.battingOrder || 99));
  } catch (error) {
    console.error('Error fetching lineup:', error);
    // Fallback to roster
    return await getRoster(teamId);
  }
};

export const getRoster = async (teamId: number): Promise<Player[]> => {
  try {
    const response = await axios.get(
      `${MLB_API_BASE}/teams/${teamId}/roster/Active`
    );
    
    const players: Player[] = response.data.roster
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
  } catch (error) {
    console.error('Error fetching roster:', error);
    return [];
  }
};

export const fetchLineupOrRoster = async (gameId: string) => {
  try {
    const game = await axios.get(`${MLB_API_BASE}/game/${gameId}/boxscore`);
    const homeTeamId = game.data.teams.home.team.id;
    const awayTeamId = game.data.teams.away.team.id;
    
    const [homeLineup, awayLineup] = await Promise.all([
      getLineup(parseInt(gameId), homeTeamId),
      getLineup(parseInt(gameId), awayTeamId)
    ]);
    
    return {
      home: homeLineup,
      away: awayLineup
    };
  } catch (error) {
    console.error('Error fetching lineup or roster:', error);
    return null;
  }
};

export const getAllPlayersForGames = async (): Promise<Player[]> => {
  try {
    const games = await getSchedule();
    const allPlayers: Player[] = [];
    
    // Get players from all games
    for (const game of games) {
      try {
        const homeRoster = await getRoster(game.teams.home.team.id);
        const awayRoster = await getRoster(game.teams.away.team.id);
        
        allPlayers.push(...homeRoster, ...awayRoster);
      } catch (error) {
        console.error(`Error fetching rosters for game ${game.gamePk}:`, error);
      }
    }
    
    // Remove duplicates based on player ID
    const uniquePlayers = allPlayers.filter((player, index, self) => 
      index === self.findIndex(p => p.id === player.id)
    );
    
    return uniquePlayers;
  } catch (error) {
    console.error('Error fetching all players:', error);
    return [];
  }
};

export const formatGameTime = (gameDate: string): string => {
  const date = new Date(gameDate);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneAbbr = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short'
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
  
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${time} ${timeZoneAbbr}`;
};

export const getPitcherStats = async (pitcherId: number): Promise<{ era?: string; handedness?: string }> => {
  try {
    const response = await axios.get(
      `${MLB_API_BASE}/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season],season=2024)`
    );
    
    const stats = response.data.people[0]?.stats?.[0]?.splits?.[0]?.stat;
    const handedness = response.data.people[0]?.batSide?.code || response.data.people[0]?.throwSide?.code;
    
    return {
      era: stats?.era ? parseFloat(stats.era).toFixed(2) : undefined,
      handedness: handedness === 'L' ? 'LHP' : handedness === 'R' ? 'RHP' : undefined
    };
  } catch (error) {
    console.error('Error fetching pitcher stats:', error);
    return {};
  }
};

export const getPlayerStats = async (playerId: string): Promise<{ homeRuns?: string; hits?: string; runs?: string; rbi?: string }> => {
  try {
    // Get current date to determine the correct season
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // January is 0
    
    // If we're in the first few months of the year, use previous year's stats
    // as the current season hasn't started yet
    const season = currentMonth < 4 ? currentYear - 1 : currentYear;
    
    const response = await axios.get(
      `${MLB_API_BASE}/people/${playerId}?hydrate=stats(group=[hitting],type=[season],season=${season})`
    );
    
    const stats = response.data.people[0]?.stats?.[0]?.splits?.[0]?.stat;
    
    // If no stats found for current season, try the previous year
    if (!stats && season === currentYear) {
      const fallbackResponse = await axios.get(
        `${MLB_API_BASE}/people/${playerId}?hydrate=stats(group=[hitting],type=[season],season=${currentYear - 1})`
      );
      
      const fallbackStats = fallbackResponse.data.people[0]?.stats?.[0]?.splits?.[0]?.stat;
      
      return {
        homeRuns: fallbackStats?.homeRuns ? fallbackStats.homeRuns.toString() : undefined,
        hits: fallbackStats?.hits ? fallbackStats.hits.toString() : undefined,
        runs: fallbackStats?.runs ? fallbackStats.runs.toString() : undefined,
        rbi: fallbackStats?.rbi ? fallbackStats.rbi.toString() : undefined
      };
    }
    
    return {
      homeRuns: stats?.homeRuns ? stats.homeRuns.toString() : undefined,
      hits: stats?.hits ? stats.hits.toString() : undefined,
      runs: stats?.runs ? stats.runs.toString() : undefined,
      rbi: stats?.rbi ? stats.rbi.toString() : undefined
    };
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return {};
  }
};

export const getPitchers = async (gameId: number, gameState?: string, gameData?: any): Promise<{ 
  away: { name: string | null; type: 'probable' | 'starting' | null; stats?: { era?: string; handedness?: string } }; 
  home: { name: string | null; type: 'probable' | 'starting' | null; stats?: { era?: string; handedness?: string } } 
}> => {
  try {
    // For scheduled games, use probable pitchers from schedule data
    if (gameState === 'Preview') {
      const awayPitcher = gameData?.teams?.away?.probablePitcher;
      const homePitcher = gameData?.teams?.home?.probablePitcher;
      
      // Fetch stats for probable pitchers if available
      const [awayStats, homeStats] = await Promise.all([
        awayPitcher?.id ? getPitcherStats(awayPitcher.id) : Promise.resolve({}),
        homePitcher?.id ? getPitcherStats(homePitcher.id) : Promise.resolve({})
      ]);
      
      return {
        away: { 
          name: awayPitcher?.fullName || null, 
          type: awayPitcher?.fullName ? 'probable' : null,
          stats: awayStats
        },
        home: { 
          name: homePitcher?.fullName || null, 
          type: homePitcher?.fullName ? 'probable' : null,
          stats: homeStats
        }
      };
    }
    
    // For live/finished games, get actual starting pitchers from boxscore
    const boxscoreResponse = await axios.get(
      `${MLB_API_BASE}/game/${gameId}/boxscore`
    );
    
    const boxscore = boxscoreResponse.data.teams;
    
    // Look for actual starting pitchers in the players list
    let awayPitcher = null;
    let homePitcher = null;
    let awayPitcherId = null;
    let homePitcherId = null;
    let awayPitcherType: 'probable' | 'starting' | null = null;
    let homePitcherType: 'probable' | 'starting' | null = null;
    
    // Check away team players for actual starting pitcher
    if (boxscore.away?.players) {
      for (const playerId in boxscore.away.players) {
        const player = boxscore.away.players[playerId];
        if (player?.position?.code === '1' && player?.person?.fullName) {
          awayPitcher = player.person.fullName;
          awayPitcherId = player.person.id;
          awayPitcherType = 'starting';
          break;
        }
      }
    }
    
    // Check home team players for actual starting pitcher
    if (boxscore.home?.players) {
      for (const playerId in boxscore.home.players) {
        const player = boxscore.home.players[playerId];
        if (player?.position?.code === '1' && player?.person?.fullName) {
          homePitcher = player.person.fullName;
          homePitcherId = player.person.id;
          homePitcherType = 'starting';
          break;
        }
      }
    }
    
    // Fetch stats for actual starting pitchers if available
    const [awayStats, homeStats] = await Promise.all([
      awayPitcherId ? getPitcherStats(awayPitcherId) : Promise.resolve({}),
      homePitcherId ? getPitcherStats(homePitcherId) : Promise.resolve({})
    ]);
    
    return {
      away: { name: awayPitcher, type: awayPitcherType, stats: awayStats },
      home: { name: homePitcher, type: homePitcherType, stats: homeStats }
    };
  } catch (error) {
    console.error('Error fetching pitchers:', error);
    return {
      away: { name: null, type: null, stats: {} },
      home: { name: null, type: null, stats: {} }
    };
  }
};
