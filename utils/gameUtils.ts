/**
 * Formats game status text for display
 * @param detailedState - The detailed state from the MLB API
 * @returns Formatted status text
 */
export const formatGameStatus = (detailedState: string): string => {
  // Handle different variations of delayed start text
  return detailedState
    .replace('DELAYED START', 'DELAYED')
    .replace('Delayed Start', 'Delayed')
    .replace('delayed start', 'delayed');
};

/**
 * Formats game time for display
 * @param gameDate - Game date string from the MLB API
 * @returns Formatted time string with timezone
 */
export const formatGameTime = (gameDate: string): string => {
  const date = new Date(gameDate);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  };
  return date.toLocaleTimeString('en-US', options);
};

/**
 * Pitcher information interface
 */
interface PitcherInfo {
  name: string | null;
  type: 'probable' | 'starting' | null;
  stats?: {
    era?: string;
    handedness?: string;
  };
}

/**
 * Formats pitcher display information
 * @param pitcher - Pitcher information object
 * @returns Formatted pitcher display string
 */
export const formatPitcherDisplay = (pitcher: PitcherInfo): string => {
  if (!pitcher.name) return 'TBD';
  
  // Convert full name to abbreviated format (e.g., "Mitch Keller" -> "M. Keller")
  const nameParts = pitcher.name.split(' ');
  const abbreviatedName = nameParts.length > 1 
    ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
    : pitcher.name;
  
  // Format handedness as (L) or (R)
  let handednessDisplay = '';
  if (pitcher.stats?.handedness) {
    if (pitcher.stats.handedness === 'LHP') {
      handednessDisplay = '(L)';
    } else if (pitcher.stats.handedness === 'RHP') {
      handednessDisplay = '(R)';
    }
  }
  
  // Build the display string
  let display = abbreviatedName;
  if (handednessDisplay) {
    display += ` ${handednessDisplay}`;
  }
  if (pitcher.stats?.era) {
    display += ` • ${pitcher.stats.era} ERA`;
  }
  
  return display;
};

/**
 * Base game interface for sorting
 */
interface BaseGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
  };
}

/**
 * Sorts games by priority and time
 * Priority order: Live games > Scheduled/Delayed > Final/Game Over/Postponed/Cancelled
 * Within each priority group, games are sorted chronologically
 * @param games - Array of games to sort
 * @returns Sorted array of games
 */
export const sortGamesByPriority = <T extends BaseGame>(games: T[]): T[] => {
  return games.sort((a, b) => {
    // Define priority groups
    const getPriority = (game: T) => {
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
