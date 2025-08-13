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
