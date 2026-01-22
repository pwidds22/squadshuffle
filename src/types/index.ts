// Player - someone who participates in games
export interface Player {
  id: string;
  name: string;
  dateAdded: number; // timestamp
  isActive: boolean;
}

// Game - a type of game (e.g., "Roblox", "Trivia")
export interface Game {
  id: string;
  name: string;
  iconName: string; // Ionicons name
  dateCreated: number;
}

// Team - a group of players in a session
export interface Team {
  id: string;
  sessionId: string;
  name: string;
  playerIds: string[]; // stored as JSON in SQLite
  score: number | null;
}

// GameSession - a single game session with teams
export interface GameSession {
  id: string;
  gameId: string;
  date: number;
  winningTeamId: string | null;
  isComplete: boolean;
  notes: string | null;
}

// For creating new entities (without id)
export type NewPlayer = Omit<Player, 'id' | 'dateAdded'>;
export type NewGame = Omit<Game, 'id' | 'dateCreated'>;
export type NewTeam = Omit<Team, 'id'>;
export type NewGameSession = Omit<GameSession, 'id' | 'date'>;

// Player stats derived from game sessions
export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
}
