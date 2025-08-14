import axios from 'axios';
import { fetchGames, getGameDetails } from './mlbApi';
import { notificationService, HomeRunNotification } from './notificationService';

interface GameState {
  gameId: number;
  lastHomeRunCount: number;
  lastChecked: number;
}

export class HomeRunMonitor {
  private static instance: HomeRunMonitor;
  private gameStates: Map<number, GameState> = new Map();
  private isMonitoring = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): HomeRunMonitor {
    if (!HomeRunMonitor.instance) {
      HomeRunMonitor.instance = new HomeRunMonitor();
    }
    return HomeRunMonitor.instance;
  }

  // Force recreate instance to ensure all methods are available
  static resetInstance(): void {
    HomeRunMonitor.instance = new HomeRunMonitor();
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('Starting home run monitoring...');

    // Initial check
    await this.checkForHomeRuns();

    // Set up interval to check every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkForHomeRuns();
    }, 30000); // 30 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopped home run monitoring');
  }

  async restartMonitoring(): Promise<void> {
    console.log('Restarting home run monitoring...');
    this.stopMonitoring();
    this.clearGameStates();
    // Reset the instance to ensure all methods are available
    HomeRunMonitor.resetInstance();
    await this.startMonitoring();
  }

  private async checkForHomeRuns(): Promise<void> {
    try {
      const games = await fetchGames();
      
      // Only monitor live games
      const liveGames = games.filter(game => 
        game.status.abstractGameState === 'Live'
      );

      console.log(`Found ${liveGames.length} live games to monitor`);
      
      // Log details of live games for debugging
      liveGames.forEach(game => {
        console.log(`Live game: ${game.teams.away.team.name} @ ${game.teams.home.team.name} (ID: ${game.gamePk})`);
      });

      for (const game of liveGames) {
        try {
          await this.checkGameForHomeRuns(game);
        } catch (error) {
          console.error(`Error checking game ${game.gamePk} for home runs:`, error);
          // Continue with other games even if one fails
        }
      }
    } catch (error) {
      console.error('Error checking for home runs:', error);
    }
  }

  private async checkGameForHomeRuns(game: any): Promise<void> {
    try {
      const gameDetails = await getGameDetails(game.gamePk);
      if (!gameDetails) {
        // Try alternative approach - check boxscore for recent scoring plays
        await this.checkBoxscoreForHomeRunsFallback(game);
        return;
      }

      const currentHomeRunCount = this.getTotalHomeRuns(gameDetails);
      const gameState = this.gameStates.get(game.gamePk);

      if (!gameState) {
        // First time checking this game
        this.gameStates.set(game.gamePk, {
          gameId: game.gamePk,
          lastHomeRunCount: currentHomeRunCount,
          lastChecked: Date.now(),
        });
        return;
      }

      // Check if home run count increased
      if (currentHomeRunCount > gameState.lastHomeRunCount) {
        const newHomeRuns = currentHomeRunCount - gameState.lastHomeRunCount;
        console.log(`Home run detected in game ${game.gamePk}! Count increased by ${newHomeRuns}`);
        
        // Get the most recent home run details
        const recentHomeRun = this.getMostRecentHomeRun(gameDetails);
        
        if (recentHomeRun) {
          const notification: HomeRunNotification = {
            playerName: recentHomeRun.playerName,
            homeRunCount: recentHomeRun.homeRunCount,
            description: recentHomeRun.description,
            gameId: game.gamePk,
          };

          await notificationService.showHomeRunNotification(notification);
        }
      }

      // Update game state
      this.gameStates.set(game.gamePk, {
        gameId: game.gamePk,
        lastHomeRunCount: currentHomeRunCount,
        lastChecked: Date.now(),
      });
    } catch (error: any) {
      // Don't log 404 errors as they're expected for games without live feed
      if (error.response?.status !== 404) {
        console.error(`Error checking game ${game.gamePk} for home runs:`, error);
      }
    }
  }

  private getTotalHomeRuns(gameDetails: any): number {
    try {
      // Parse live feed data to count home runs
      const liveData = gameDetails.liveData;
      if (!liveData || !liveData.plays) {
        console.log('No live data or plays available');
        return 0;
      }

      let homeRunCount = 0;
      
      // Count home runs from play-by-play data
      if (liveData.plays.allPlays) {
        console.log(`Checking ${liveData.plays.allPlays.length} plays for home runs`);
        for (const play of liveData.plays.allPlays) {
          if (play.result && play.result.eventType === 'home_run') {
            homeRunCount++;
            console.log(`Found home run: ${play.matchup?.batter?.fullName || 'Unknown'} - ${play.result.description}`);
          }
        }
      }

      console.log(`Total home runs in game: ${homeRunCount}`);
      return homeRunCount;
    } catch (error) {
      console.error('Error getting total home runs:', error);
      return 0;
    }
  }

  private getMostRecentHomeRun(gameDetails: any): any {
    try {
      const liveData = gameDetails.liveData;
      if (!liveData || !liveData.plays) return null;

      // Find the most recent home run from play-by-play data
      if (liveData.plays.allPlays) {
        for (let i = liveData.plays.allPlays.length - 1; i >= 0; i--) {
          const play = liveData.plays.allPlays[i];
          if (play.result && play.result.eventType === 'home_run') {
            const player = play.matchup?.batter;
            const description = play.result?.description || 'home run';
            
            return {
              playerName: player?.fullName || 'Unknown Player',
              homeRunCount: this.getPlayerHomeRunCount(gameDetails, player?.id),
              description: description,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting most recent home run:', error);
      return null;
    }
  }

  private getPlayerHomeRunCount(gameDetails: any, playerId: number): number {
    try {
      if (!playerId) return 1;

      const liveData = gameDetails.liveData;
      if (!liveData || !liveData.plays) return 1;

      let homeRunCount = 0;
      
      // Count home runs for this specific player in this game
      if (liveData.plays.allPlays) {
        for (const play of liveData.plays.allPlays) {
          if (play.result && 
              play.result.eventType === 'home_run' && 
              play.matchup?.batter?.id === playerId) {
            homeRunCount++;
          }
        }
      }

      return homeRunCount;
    } catch (error) {
      console.error('Error getting player home run count:', error);
      return 1;
    }
  }

  clearGameStates(): void {
    this.gameStates.clear();
  }

  private async checkBoxscoreForHomeRunsFallback(game: any): Promise<void> {
    try {
      // Try to get boxscore data as an alternative
      const response = await axios.get(
        `https://statsapi.mlb.com/api/v1/game/${game.gamePk}/boxscore`
      );
      
      const boxscore = response.data;
      const awayScore = boxscore.teams?.away?.score || 0;
      const homeScore = boxscore.teams?.home?.score || 0;
      const totalScore = awayScore + homeScore;
      
      const gameState = this.gameStates.get(game.gamePk);
      
      if (!gameState) {
        // First time checking this game
        this.gameStates.set(game.gamePk, {
          gameId: game.gamePk,
          lastHomeRunCount: totalScore, // Use total score as proxy
          lastChecked: Date.now(),
        });
        return;
      }

      // Check if score increased (potential home run)
      if (totalScore > gameState.lastHomeRunCount) {
        const scoreIncrease = totalScore - gameState.lastHomeRunCount;
        console.log(`Score increase detected in game ${game.gamePk}! Score increased by ${scoreIncrease}`);
        
        // This is a simplified approach - we can't get player details from boxscore
        // but we can at least notify that something happened
        const notification: HomeRunNotification = {
          playerName: 'Player', // We don't have player details from boxscore
          homeRunCount: 1,
          description: 'home run detected',
          gameId: game.gamePk,
        };

        await notificationService.showHomeRunNotification(notification);
      }

      // Update game state
      this.gameStates.set(game.gamePk, {
        gameId: game.gamePk,
        lastHomeRunCount: totalScore,
        lastChecked: Date.now(),
      });
    } catch (error: any) {
      console.error(`Error checking boxscore for game ${game.gamePk}:`, error);
    }
  }
}

export const homeRunMonitor = HomeRunMonitor.getInstance();
