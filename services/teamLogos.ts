// ESPN CDN Team Logo Service
// ESPN provides free team logos through their CDN

export interface TeamLogoInfo {
    teamId: number;
    teamName: string;
    abbreviation: string;
    logoUrl: string;
  }
  
  // ESPN CDN base URL for team logos
  const ESPN_CDN_BASE = 'https://a.espncdn.com/i/teamlogos/mlb/500';
  
  // MLB team mappings for ESPN CDN
  // ESPN uses team abbreviations that may differ from MLB API
  const TEAM_ABBREVIATIONS: { [key: string]: string } = {
    'Arizona Diamondbacks': 'ari',
    'Atlanta Braves': 'atl',
    'Baltimore Orioles': 'bal',
    'Boston Red Sox': 'bos',
    'Chicago Cubs': 'chc',
    'Chicago White Sox': 'cws',
    'Cincinnati Reds': 'cin',
    'Cleveland Guardians': 'cle',
    'Colorado Rockies': 'col',
    'Detroit Tigers': 'det',
    'Houston Astros': 'hou',
    'Kansas City Royals': 'kc',
    'Los Angeles Angels': 'laa',
    'Los Angeles Dodgers': 'lad',
    'Miami Marlins': 'mia',
    'Milwaukee Brewers': 'mil',
    'Minnesota Twins': 'min',
    'New York Mets': 'nym',
    'New York Yankees': 'nyy',
    'Athletics': 'ath',
    'Philadelphia Phillies': 'phi',
    'Pittsburgh Pirates': 'pit',
    'San Diego Padres': 'sd',
    'San Francisco Giants': 'sf',
    'Seattle Mariners': 'sea',
    'St. Louis Cardinals': 'stl',
    'Tampa Bay Rays': 'tb',
    'Texas Rangers': 'tex',
    'Toronto Blue Jays': 'tor',
    'Washington Nationals': 'was'
  };
  
  /**
   * Get the ESPN CDN logo URL for a team
   * @param teamName - Full team name from MLB API
   * @returns Logo URL or null if not found
   */
  export const getTeamLogoUrl = (teamName: string): string | null => {
    const abbreviation = TEAM_ABBREVIATIONS[teamName];
    if (!abbreviation) {
      console.warn(`No ESPN logo mapping found for team: ${teamName}`);
      return null;
    }
    
    return `${ESPN_CDN_BASE}/${abbreviation}.png`;
  };
  
  /**
   * Get team logo URL with fallback
   * @param teamName - Full team name from MLB API
   * @param teamId - Team ID from MLB API
   * @returns Logo URL with fallback options
   */
  export const getTeamLogoWithFallback = (teamName: string, teamId: number): string => {
    const espnLogo = getTeamLogoUrl(teamName);
    if (espnLogo) {
      return espnLogo;
    }
    
    // Fallback: Try using team ID with ESPN CDN
    return `${ESPN_CDN_BASE}/${teamId}.png`;
  };
  
  /**
   * Get all team logo URLs for the current teams
   * @param teams - Array of team names
   * @returns Array of team logo info
   */
  export const getAllTeamLogos = (teams: string[]): TeamLogoInfo[] => {
    return teams.map(teamName => {
      const abbreviation = TEAM_ABBREVIATIONS[teamName];
      return {
        teamId: 0, // Would need to be passed in
        teamName,
        abbreviation: abbreviation || teamName.split(' ').pop()?.toLowerCase() || '',
        logoUrl: getTeamLogoUrl(teamName) || ''
      };
    }).filter(team => team.logoUrl);
  };