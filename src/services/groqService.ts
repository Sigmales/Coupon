// Service pour récupérer les logos d'équipes via API
// Note: Groq est pour l'IA, pas pour les logos. On utilise une API gratuite alternative

// Fallback: API gratuite pour les logos de football
const FOOTBALL_API = 'https://www.thesportsdb.com/api/v1/json/3';

// Cache des logos pour éviter les appels répétés
const logoCache = new Map<string, string>();

/**
 * Recherche le logo d'une équipe de football
 */
export async function getTeamLogo(teamName: string): Promise<string> {
  // Vérifier le cache
  if (logoCache.has(teamName.toLowerCase())) {
    return logoCache.get(teamName.toLowerCase())!;
  }

  try {
    // Recherche via TheSportsDB API (gratuit)
    const response = await fetch(
      `${FOOTBALL_API}/searchteams.php?t=${encodeURIComponent(teamName)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch team logo');
    }

    const data = await response.json();
    
    if (data.teams && data.teams.length > 0) {
      const logoUrl = data.teams[0].strTeamBadge || data.teams[0].strTeamLogo;
      
      if (logoUrl) {
        // Mettre en cache
        logoCache.set(teamName.toLowerCase(), logoUrl);
        return logoUrl;
      }
    }

    // Si pas trouvé, retourner un placeholder
    return generatePlaceholderLogo(teamName);
  } catch (error) {
    console.error(`Error fetching logo for ${teamName}:`, error);
    return generatePlaceholderLogo(teamName);
  }
}

/**
 * Génère un logo placeholder avec les initiales de l'équipe
 */
function generatePlaceholderLogo(teamName: string): string {
  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // SVG avec les initiales
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#7c3aed"/>
      <text x="50" y="50" font-size="36" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Récupère les logos pour plusieurs équipes en parallèle
 */
export async function getMultipleTeamLogos(
  teams: string[]
): Promise<Map<string, string>> {
  const logos = new Map<string, string>();

  const promises = teams.map(async (team) => {
    const logo = await getTeamLogo(team);
    logos.set(team, logo);
  });

  await Promise.all(promises);
  return logos;
}

/**
 * Précharge les logos des équipes populaires
 */
export async function preloadPopularTeamLogos() {
  const popularTeams = [
    'Manchester United', 'Real Madrid', 'Barcelona', 'Liverpool',
    'Bayern Munich', 'Paris Saint-Germain', 'Juventus', 'Chelsea',
    'Arsenal', 'Manchester City', 'AC Milan', 'Inter Milan'
  ];

  await getMultipleTeamLogos(popularTeams);
}

/**
 * Efface le cache des logos
 */
export function clearLogoCache() {
  logoCache.clear();
}