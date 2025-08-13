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
