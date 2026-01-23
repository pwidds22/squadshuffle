import type { Player, TeamAssignment } from '../types';

/**
 * Fisher-Yates shuffle for fair randomization.
 * Each permutation has equal probability.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distribute players evenly across teams using round-robin assignment.
 * Teams will differ by at most 1 player.
 */
export function assignPlayersToTeams(
  players: Player[],
  teamCount: number,
  teamNames: string[]
): TeamAssignment[] {
  // Shuffle players randomly
  const shuffledPlayers = shuffleArray(players);

  // Initialize teams
  const teams: TeamAssignment[] = teamNames.slice(0, teamCount).map((name) => ({
    name,
    playerIds: [],
    playerNames: [],
  }));

  // Round-robin assignment
  shuffledPlayers.forEach((player, index) => {
    const teamIndex = index % teamCount;
    teams[teamIndex].playerIds.push(player.id);
    teams[teamIndex].playerNames.push(player.name);
  });

  return teams;
}

/**
 * Team colors for visual distinction
 */
export const TeamColors = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F59E0B', // Amber
];

export function getTeamColor(index: number): string {
  return TeamColors[index % TeamColors.length];
}
