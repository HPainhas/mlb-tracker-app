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

  private async checkForHomeRuns(): Promise<void> {
    try {
      const games = await fetchGames();
      
      // Only monitor live games
      const liveGames = games.filter(game => 
        game.status.abstractGameState === 'Live'
      );

      console.log(`Found ${liveGames.length} live games to monitor`);

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
        return;
      }

      const currentHomeRunCount = this.getTotalHomeRuns(gameDetails);
      const gameState = this.gameStates.get(game.gamePk);

      if (!gameState) {
        // First time checking this game
        console.log(`Starting to monitor game ${game.gamePk} for home runs (current count: ${currentHomeRunCount})`);
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
      if (!liveData || !liveData.plays) return 0;

      let homeRunCount = 0;
      
      // Count home runs from play-by-play data
      if (liveData.plays.allPlays) {
        for (const play of liveData.plays.allPlays) {
          if (play.result && play.result.eventType === 'home_run') {
            homeRunCount++;
          }
        }
      }

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
}

export const homeRunMonitor = HomeRunMonitor.getInstance();
