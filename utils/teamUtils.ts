// Team utility functions for consistent team name formatting across the app

// Helper function to convert team names to abbreviation format
export const getTeamDisplayName = (teamName: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Arizona Diamondbacks': 'ARI Diamondbacks',
    'Atlanta Braves': 'ATL Braves',
    'Baltimore Orioles': 'BAL Orioles',
    'Boston Red Sox': 'BOS Red Sox',
    'Chicago Cubs': 'CHC Cubs',
    'Chicago White Sox': 'CWS White Sox',
    'Cincinnati Reds': 'CIN Reds',
    'Cleveland Guardians': 'CLE Guardians',
    'Colorado Rockies': 'COL Rockies',
    'Detroit Tigers': 'DET Tigers',
    'Houston Astros': 'HOU Astros',
    'Kansas City Royals': 'KC Royals',
    'Los Angeles Angels': 'LAA Angels',
    'Los Angeles Dodgers': 'LAD Dodgers',
    'Miami Marlins': 'MIA Marlins',
    'Milwaukee Brewers': 'MIL Brewers',
    'Minnesota Twins': 'MIN Twins',
    'New York Mets': 'NYM Mets',
    'New York Yankees': 'NYY Yankees',
    'Athletics': 'Athletics',
    'Philadelphia Phillies': 'PHI Phillies',
    'Pittsburgh Pirates': 'PIT Pirates',
    'San Diego Padres': 'SD Padres',
    'San Francisco Giants': 'SF Giants',
    'Seattle Mariners': 'SEA Mariners',
    'St. Louis Cardinals': 'STL Cardinals',
    'Tampa Bay Rays': 'TB Rays',
    'Texas Rangers': 'TEX Rangers',
    'Toronto Blue Jays': 'TOR Blue Jays',
    'Washington Nationals': 'WSH Nationals'
  };
  
  return abbreviations[teamName] || teamName;
};
