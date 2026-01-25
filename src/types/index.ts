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
  lowerScoreWins: boolean; // true for golf-style scoring
}

// Team - a group of players in a session
export interface Team {
  id: string;
  sessionId: string;
  name: string;
  playerIds: string[]; // stored as JSON in SQLite
  score: number | null;
  placement: number | null; // 1 = 1st place, 2 = 2nd, etc.
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

// Assignment mode for team randomization
export type AssignmentMode = 'round-robin' | 'fill-first';

// App settings
export interface AppSettings {
  defaultTeamCount: number;
  defaultAssignmentMode: AssignmentMode;
  removePlayerAfterPick: boolean;
}

// Player stats derived from game sessions
export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
}

// Team assignment result from randomizer
export interface TeamAssignment {
  name: string;
  playerIds: string[];
  playerNames: string[];
}

// Navigation types for Play flow
export type PlayStackParamList = {
  PlayHome: undefined;
  PlayerSelection: undefined;
  GameSelection: { selectedPlayerIds: string[] };
  TeamConfig: {
    selectedPlayerIds: string[];
    gameId: string;
    reuseTeams?: { name: string; playerIds: string[] }[];
  };
  Randomizer: {
    selectedPlayerIds: string[];
    gameId: string;
    teamCount: number;
    teamNames: string[];
    assignmentMode: AssignmentMode;
    removeAfterPick: boolean;
  };
  TeamReveal: { teams: TeamAssignment[]; gameId: string };
  ActiveGame: {
    sessionId: string;
    gameId?: string;
    selectedPlayerIds?: string[];
  };
};
