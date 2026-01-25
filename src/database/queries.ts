import { getDatabase, generateId } from './db';
import type { Player, Game, Team, GameSession, NewPlayer, NewGame, AppSettings, AssignmentMode } from '../types';

// ============ PLAYERS ============

export async function addPlayer(player: NewPlayer): Promise<Player> {
  const db = getDatabase();
  const id = generateId();
  const dateAdded = Date.now();

  await db.runAsync(
    'INSERT INTO players (id, name, dateAdded, isActive) VALUES (?, ?, ?, ?)',
    [id, player.name, dateAdded, player.isActive ? 1 : 0]
  );

  return { id, name: player.name, dateAdded, isActive: player.isActive };
}

export async function getPlayers(activeOnly = true): Promise<Player[]> {
  const db = getDatabase();
  const query = activeOnly
    ? 'SELECT * FROM players WHERE isActive = 1 ORDER BY name'
    : 'SELECT * FROM players ORDER BY name';

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    dateAdded: number;
    isActive: number;
  }>(query);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    dateAdded: row.dateAdded,
    isActive: row.isActive === 1,
  }));
}

export async function updatePlayer(id: string, updates: Partial<Player>): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.isActive !== undefined) {
    fields.push('isActive = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    await db.runAsync(`UPDATE players SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deletePlayer(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM players WHERE id = ?', [id]);
}

// ============ GAMES ============

export async function addGame(game: NewGame): Promise<Game> {
  const db = getDatabase();
  const id = generateId();
  const dateCreated = Date.now();

  await db.runAsync(
    'INSERT INTO games (id, name, iconName, dateCreated, lowerScoreWins) VALUES (?, ?, ?, ?, ?)',
    [id, game.name, game.iconName, dateCreated, game.lowerScoreWins ? 1 : 0]
  );

  return { id, name: game.name, iconName: game.iconName, dateCreated, lowerScoreWins: game.lowerScoreWins };
}

export async function getGames(): Promise<Game[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    iconName: string;
    dateCreated: number;
    lowerScoreWins: number;
  }>('SELECT * FROM games ORDER BY name');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    iconName: row.iconName,
    dateCreated: row.dateCreated,
    lowerScoreWins: row.lowerScoreWins === 1,
  }));
}

export async function getGameById(id: string): Promise<Game | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    iconName: string;
    dateCreated: number;
    lowerScoreWins: number;
  }>('SELECT * FROM games WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    iconName: row.iconName,
    dateCreated: row.dateCreated,
    lowerScoreWins: row.lowerScoreWins === 1,
  };
}

export async function deleteGame(id: string): Promise<void> {
  const db = getDatabase();

  // Get all sessions for this game
  const sessions = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM sessions WHERE gameId = ?',
    [id]
  );

  // Delete teams for all sessions of this game
  for (const session of sessions) {
    await db.runAsync('DELETE FROM teams WHERE sessionId = ?', [session.id]);
  }

  // Delete all sessions for this game
  await db.runAsync('DELETE FROM sessions WHERE gameId = ?', [id]);

  // Delete the game itself
  await db.runAsync('DELETE FROM games WHERE id = ?', [id]);
}

// ============ CLEAR ALL DATA ============

export async function clearAllData(): Promise<void> {
  const db = getDatabase();
  // Delete in order to respect foreign key constraints
  await db.runAsync('DELETE FROM teams');
  await db.runAsync('DELETE FROM sessions');
  await db.runAsync('DELETE FROM games');
  await db.runAsync('DELETE FROM players');
  await db.runAsync('DELETE FROM settings');
}

// ============ SESSIONS ============

export async function createSession(
  gameId: string,
  teams: { name: string; playerIds: string[] }[]
): Promise<GameSession> {
  const db = getDatabase();
  const sessionId = generateId();
  const date = Date.now();

  // Insert session
  await db.runAsync(
    'INSERT INTO sessions (id, gameId, date, isComplete) VALUES (?, ?, ?, 0)',
    [sessionId, gameId, date]
  );

  // Insert teams
  for (const team of teams) {
    const teamId = generateId();
    await db.runAsync(
      'INSERT INTO teams (id, sessionId, name, playerIds, score) VALUES (?, ?, ?, ?, 0)',
      [teamId, sessionId, team.name, JSON.stringify(team.playerIds)]
    );
  }

  return {
    id: sessionId,
    gameId,
    date,
    winningTeamId: null,
    isComplete: false,
    notes: null,
  };
}

export async function getSessions(limit = 50): Promise<GameSession[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    gameId: string;
    date: number;
    winningTeamId: string | null;
    isComplete: number;
    notes: string | null;
  }>('SELECT * FROM sessions ORDER BY date DESC LIMIT ?', [limit]);

  return rows.map((row) => ({
    id: row.id,
    gameId: row.gameId,
    date: row.date,
    winningTeamId: row.winningTeamId,
    isComplete: row.isComplete === 1,
    notes: row.notes,
  }));
}

export async function getTeamsForSession(sessionId: string): Promise<Team[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    sessionId: string;
    name: string;
    playerIds: string;
    score: number | null;
    placement: number | null;
  }>('SELECT * FROM teams WHERE sessionId = ?', [sessionId]);

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    playerIds: JSON.parse(row.playerIds),
    score: row.score,
    placement: row.placement,
  }));
}

export async function updateTeamScore(teamId: string, score: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE teams SET score = ? WHERE id = ?', [score, teamId]);
}

export async function endSession(
  sessionId: string,
  winningTeamId: string | null,
  notes?: string | null
): Promise<void> {
  const db = getDatabase();

  // Get session and game info to determine scoring direction
  const session = await db.getFirstAsync<{ gameId: string }>(
    'SELECT gameId FROM sessions WHERE id = ?',
    [sessionId]
  );
  if (!session) throw new Error('Session not found');

  const game = await getGameById(session.gameId);
  const lowerScoreWins = game?.lowerScoreWins ?? false;

  // Get all teams and their scores
  const teams = await getTeamsForSession(sessionId);

  // Sort teams by score to determine placements
  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    return lowerScoreWins ? scoreA - scoreB : scoreB - scoreA;
  });

  // Assign placements (handle ties by giving same placement)
  let currentPlacement = 1;
  let previousScore: number | null = null;

  for (let i = 0; i < sortedTeams.length; i++) {
    const team = sortedTeams[i];
    const teamScore = team.score ?? 0;

    if (i === 0) {
      currentPlacement = 1;
    } else if (teamScore !== previousScore) {
      currentPlacement = i + 1; // Skip to actual position (e.g., if 2 tied for 1st, next is 3rd)
    }
    // If score equals previous, keep same placement

    await db.runAsync(
      'UPDATE teams SET placement = ? WHERE id = ?',
      [currentPlacement, team.id]
    );

    previousScore = teamScore;
  }

  // Use provided winningTeamId, or auto-detect from placement if not provided or null
  let finalWinningTeamId = winningTeamId;
  if (finalWinningTeamId === null && sortedTeams.length > 0) {
    // Check if there's a clear winner (no tie for first)
    const firstPlaceScore = sortedTeams[0]?.score ?? 0;
    const secondPlaceScore = sortedTeams[1]?.score ?? 0;
    if (sortedTeams.length === 1 || firstPlaceScore !== secondPlaceScore) {
      finalWinningTeamId = sortedTeams[0].id;
    }
  }

  await db.runAsync(
    'UPDATE sessions SET isComplete = 1, winningTeamId = ?, notes = ? WHERE id = ?',
    [finalWinningTeamId, notes || null, sessionId]
  );
}

// ============ SETTINGS ============

const DEFAULT_SETTINGS: AppSettings = {
  defaultTeamCount: 2,
  defaultAssignmentMode: 'round-robin',
  removePlayerAfterPick: true,
};

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );

  if (!row) {
    return DEFAULT_SETTINGS[key];
  }

  // Parse based on expected type
  const defaultValue = DEFAULT_SETTINGS[key];
  if (typeof defaultValue === 'boolean') {
    return (row.value === 'true') as AppSettings[K];
  }
  if (typeof defaultValue === 'number') {
    return parseInt(row.value, 10) as AppSettings[K];
  }
  return row.value as AppSettings[K];
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, String(value)]
  );
}

export async function getSettings(): Promise<AppSettings> {
  const [defaultTeamCount, defaultAssignmentMode, removePlayerAfterPick] = await Promise.all([
    getSetting('defaultTeamCount'),
    getSetting('defaultAssignmentMode'),
    getSetting('removePlayerAfterPick'),
  ]);

  return {
    defaultTeamCount,
    defaultAssignmentMode,
    removePlayerAfterPick,
  };
}

// ============ STATS ============

export interface PlayerStatsResult {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  avgMargin: number; // Average point differential (positive = winning by more)
}

export interface TeamRecordResult {
  playerIds: string[];
  playerNames: string[];
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  placements: PlacementBreakdown;
  avgFinish: number;
}

export async function getPlayerStats(gameId?: string): Promise<PlayerStatsResult[]> {
  const db = getDatabase();

  // Get all completed sessions (optionally filtered by game)
  const sessionsQuery = gameId
    ? 'SELECT * FROM sessions WHERE isComplete = 1 AND gameId = ?'
    : 'SELECT * FROM sessions WHERE isComplete = 1';
  const sessionsParams = gameId ? [gameId] : [];

  const sessions = await db.getAllAsync<{
    id: string;
    gameId: string;
    winningTeamId: string | null;
  }>(sessionsQuery, sessionsParams);

  // Get all players
  const players = await getPlayers(false);
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  // Track stats per player
  const statsMap = new Map<string, {
    wins: number;
    losses: number;
    totalMargin: number;
    games: number;
  }>();

  // Initialize stats for all players
  players.forEach((p) => {
    statsMap.set(p.id, { wins: 0, losses: 0, totalMargin: 0, games: 0 });
  });

  // Process each session
  for (const session of sessions) {
    const teams = await getTeamsForSession(session.id);

    for (const team of teams) {
      const isWinner = team.id === session.winningTeamId;
      const teamScore = team.score ?? 0;

      // Find opponent score (for margin calculation)
      const opponentTeam = teams.find((t) => t.id !== team.id);
      const opponentScore = opponentTeam?.score ?? 0;
      const margin = teamScore - opponentScore;

      // Update stats for each player on this team
      for (const playerId of team.playerIds) {
        const stats = statsMap.get(playerId);
        if (stats) {
          stats.games++;
          if (session.winningTeamId) {
            if (isWinner) {
              stats.wins++;
            } else {
              stats.losses++;
            }
          }
          stats.totalMargin += margin;
        }
      }
    }
  }

  // Convert to result array
  const results: PlayerStatsResult[] = [];
  statsMap.forEach((stats, playerId) => {
    const playerName = playerMap.get(playerId);
    if (playerName && stats.games > 0) {
      results.push({
        playerId,
        playerName,
        totalGames: stats.games,
        wins: stats.wins,
        losses: stats.losses,
        winPercentage: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
        avgMargin: stats.games > 0 ? stats.totalMargin / stats.games : 0,
      });
    }
  });

  // Sort by wins (descending), then win percentage
  results.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winPercentage - a.winPercentage;
  });

  return results;
}

export async function getTeamRecords(gameId?: string): Promise<TeamRecordResult[]> {
  const db = getDatabase();

  // Get all completed sessions (optionally filtered by game)
  const sessionsQuery = gameId
    ? 'SELECT * FROM sessions WHERE isComplete = 1 AND gameId = ?'
    : 'SELECT * FROM sessions WHERE isComplete = 1';
  const sessionsParams = gameId ? [gameId] : [];

  const sessions = await db.getAllAsync<{
    id: string;
    winningTeamId: string | null;
  }>(sessionsQuery, sessionsParams);

  // Get all players for name lookup
  const players = await getPlayers(false);
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  // Track team combination records
  // Key: sorted player IDs joined with comma
  const teamRecords = new Map<string, {
    playerIds: string[];
    wins: number;
    losses: number;
    games: number;
    placements: { first: number; second: number; third: number; other: number };
  }>();

  for (const session of sessions) {
    const teams = await getTeamsForSession(session.id);

    for (const team of teams) {
      // Sort player IDs to create consistent key
      const sortedIds = [...team.playerIds].sort();
      const key = sortedIds.join(',');

      if (!teamRecords.has(key)) {
        teamRecords.set(key, {
          playerIds: sortedIds,
          wins: 0,
          losses: 0,
          games: 0,
          placements: { first: 0, second: 0, third: 0, other: 0 },
        });
      }

      const record = teamRecords.get(key)!;
      record.games++;

      if (session.winningTeamId) {
        if (team.id === session.winningTeamId) {
          record.wins++;
        } else {
          record.losses++;
        }
      }

      // Track placement
      if (team.placement === 1) record.placements.first++;
      else if (team.placement === 2) record.placements.second++;
      else if (team.placement === 3) record.placements.third++;
      else if (team.placement) record.placements.other++;
    }
  }

  // Convert to result array
  const results: TeamRecordResult[] = [];
  teamRecords.forEach((record) => {
    if (record.games > 0) {
      const { first, second, third, other } = record.placements;
      const totalPlacements = first + second + third + other;
      const avgFinish = totalPlacements > 0
        ? (first * 1 + second * 2 + third * 3 + other * 4) / totalPlacements
        : 0;

      results.push({
        playerIds: record.playerIds,
        playerNames: record.playerIds.map((id) => playerMap.get(id) || 'Unknown'),
        totalGames: record.games,
        wins: record.wins,
        losses: record.losses,
        winPercentage: record.games > 0 ? (record.wins / record.games) * 100 : 0,
        placements: record.placements,
        avgFinish,
      });
    }
  });

  // Sort by win percentage (best first), then by wins, then by games played
  results.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalGames - a.totalGames;
  });

  return results;
}

export async function getPlayerDetailStats(playerId: string): Promise<{
  overall: PlayerStatsResult;
  byGame: { game: Game; stats: PlayerStatsResult }[];
}> {
  const games = await getGames();
  const players = await getPlayers(false);
  const player = players.find((p) => p.id === playerId);

  if (!player) {
    throw new Error('Player not found');
  }

  // Get overall stats
  const allStats = await getPlayerStats();
  const overall = allStats.find((s) => s.playerId === playerId) || {
    playerId,
    playerName: player.name,
    totalGames: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    avgMargin: 0,
  };

  // Get per-game stats
  const byGame: { game: Game; stats: PlayerStatsResult }[] = [];
  for (const game of games) {
    const gameStats = await getPlayerStats(game.id);
    const playerGameStats = gameStats.find((s) => s.playerId === playerId);
    if (playerGameStats && playerGameStats.totalGames > 0) {
      byGame.push({ game, stats: playerGameStats });
    }
  }

  return { overall, byGame };
}

// ============ ADVANCED STATS ============

export interface HeadToHeadRecord {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  ties: number;
  totalGames: number;
  winPercentage: number;
  // Format context for each matchup
  formatBreakdown: {
    solo: number;      // 1v1
    twoVTwo: number;   // 2v2
    threeVThree: number; // 3v3
    fourPlus: number;  // 4v4+
  };
  fieldSizeBreakdown: {
    twoTeam: number;   // vs 1 opponent
    threeTeam: number; // vs 2 opponents
    fourPlus: number;  // vs 3+ opponents
  };
}

export interface PlacementBreakdown {
  first: number;
  second: number;
  third: number;
  other: number;
}

export interface FieldSizeRecord {
  games: number;
  wins: number;
  losses: number;
}

export interface FieldSizeBreakdown {
  twoTeam: FieldSizeRecord;      // 1v1 (2 teams total)
  threeTeam: FieldSizeRecord;    // vs 2 opponents (3 teams total)
  fourPlusTeam: FieldSizeRecord; // vs 3+ opponents (4+ teams total)
}

export interface TeamSizeBreakdown {
  solo: number;         // 1 player per team
  twoVTwo: number;      // 2v2
  threeVThree: number;  // 3v3
  fourPlus: number;     // 4+ per team
}

export interface AdvancedPlayerStats {
  playerId: string;
  playerName: string;
  // Basic stats
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  avgMargin: number;
  // Weighted wins (wins vs more teams count more)
  weightedWins: number;
  // Placement breakdown
  placements: PlacementBreakdown;
  // Field size breakdown (how many teams in each game)
  fieldSize: FieldSizeBreakdown;
  // Team size breakdown (how many players per team)
  teamSize: TeamSizeBreakdown;
  // Average field size (teams per game)
  avgFieldSize: number;
  // Strength of Schedule (average win % of opponents faced, weighted by field size)
  strengthOfSchedule: number;
  // Head-to-head records against each opponent
  headToHead: HeadToHeadRecord[];
}

export async function getAdvancedPlayerStats(
  playerId: string,
  gameId?: string
): Promise<AdvancedPlayerStats> {
  const db = getDatabase();

  // Get player info
  const players = await getPlayers(false);
  const player = players.find((p) => p.id === playerId);
  if (!player) throw new Error('Player not found');

  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  // Get all completed sessions
  const sessionsQuery = gameId
    ? 'SELECT * FROM sessions WHERE isComplete = 1 AND gameId = ?'
    : 'SELECT * FROM sessions WHERE isComplete = 1';
  const sessionsParams = gameId ? [gameId] : [];

  const sessions = await db.getAllAsync<{
    id: string;
    gameId: string;
    winningTeamId: string | null;
  }>(sessionsQuery, sessionsParams);

  // Track stats
  let totalGames = 0;
  let wins = 0;
  let losses = 0;
  let weightedWins = 0;
  let totalMargin = 0;
  let totalFieldSize = 0;
  const placements: PlacementBreakdown = { first: 0, second: 0, third: 0, other: 0 };
  const fieldSize: FieldSizeBreakdown = {
    twoTeam: { games: 0, wins: 0, losses: 0 },
    threeTeam: { games: 0, wins: 0, losses: 0 },
    fourPlusTeam: { games: 0, wins: 0, losses: 0 },
  };
  const teamSize: TeamSizeBreakdown = { solo: 0, twoVTwo: 0, threeVThree: 0, fourPlus: 0 };

  // Track opponents faced and results against them
  const opponentStats = new Map<string, {
    wins: number;
    losses: number;
    ties: number;
    // Format tracking per opponent
    format: { solo: number; twoVTwo: number; threeVThree: number; fourPlus: number };
    fieldSize: { twoTeam: number; threeTeam: number; fourPlus: number };
  }>();
  const allOpponents = new Set<string>();
  // Track opponent encounters weighted by field size for better SOS
  const opponentEncounters = new Map<string, { count: number; totalFieldSize: number }>();

  for (const session of sessions) {
    const teams = await getTeamsForSession(session.id);

    // Find the team this player was on
    const playerTeam = teams.find((t) => t.playerIds.includes(playerId));
    if (!playerTeam) continue;

    totalGames++;
    const numTeams = teams.length;
    const numPlayersPerTeam = playerTeam.playerIds.length;
    totalFieldSize += numTeams;

    // Track field size (how many teams) with record
    const isWinner = playerTeam.id === session.winningTeamId;
    const hasWinner = session.winningTeamId !== null;

    if (numTeams === 2) {
      fieldSize.twoTeam.games++;
      if (hasWinner) {
        if (isWinner) fieldSize.twoTeam.wins++;
        else fieldSize.twoTeam.losses++;
      }
    } else if (numTeams === 3) {
      fieldSize.threeTeam.games++;
      if (hasWinner) {
        if (isWinner) fieldSize.threeTeam.wins++;
        else fieldSize.threeTeam.losses++;
      }
    } else {
      fieldSize.fourPlusTeam.games++;
      if (hasWinner) {
        if (isWinner) fieldSize.fourPlusTeam.wins++;
        else fieldSize.fourPlusTeam.losses++;
      }
    }

    // Track team size (players per team)
    if (numPlayersPerTeam === 1) teamSize.solo++;
    else if (numPlayersPerTeam === 2) teamSize.twoVTwo++;
    else if (numPlayersPerTeam === 3) teamSize.threeVThree++;
    else teamSize.fourPlus++;

    // Track placement
    if (playerTeam.placement === 1) placements.first++;
    else if (playerTeam.placement === 2) placements.second++;
    else if (playerTeam.placement === 3) placements.third++;
    else if (playerTeam.placement) placements.other++;

    // Track win/loss with weighting
    if (hasWinner) {
      if (isWinner) {
        wins++;
        // Weight wins by field size: beating 3 teams > beating 1 team
        // 2 teams = 1.0x, 3 teams = 1.5x, 4 teams = 2.0x, etc.
        weightedWins += 1 + (numTeams - 2) * 0.5;
      } else {
        losses++;
      }
    }

    // Calculate margin against all opponents
    const playerScore = playerTeam.score ?? 0;
    const opponentTeams = teams.filter((t) => t.id !== playerTeam.id);

    for (const oppTeam of opponentTeams) {
      const oppScore = oppTeam.score ?? 0;
      totalMargin += playerScore - oppScore;

      // Track H2H against each opponent player
      for (const oppPlayerId of oppTeam.playerIds) {
        allOpponents.add(oppPlayerId);

        // Track encounter with field size context
        if (!opponentEncounters.has(oppPlayerId)) {
          opponentEncounters.set(oppPlayerId, { count: 0, totalFieldSize: 0 });
        }
        const enc = opponentEncounters.get(oppPlayerId)!;
        enc.count++;
        enc.totalFieldSize += numTeams;

        if (!opponentStats.has(oppPlayerId)) {
          opponentStats.set(oppPlayerId, {
            wins: 0,
            losses: 0,
            ties: 0,
            format: { solo: 0, twoVTwo: 0, threeVThree: 0, fourPlus: 0 },
            fieldSize: { twoTeam: 0, threeTeam: 0, fourPlus: 0 },
          });
        }

        const h2h = opponentStats.get(oppPlayerId)!;
        if (session.winningTeamId === playerTeam.id) {
          h2h.wins++;
        } else if (session.winningTeamId === oppTeam.id) {
          h2h.losses++;
        } else {
          h2h.ties++;
        }

        // Track format for this opponent matchup
        if (numPlayersPerTeam === 1) h2h.format.solo++;
        else if (numPlayersPerTeam === 2) h2h.format.twoVTwo++;
        else if (numPlayersPerTeam === 3) h2h.format.threeVThree++;
        else h2h.format.fourPlus++;

        // Track field size for this opponent
        if (numTeams === 2) h2h.fieldSize.twoTeam++;
        else if (numTeams === 3) h2h.fieldSize.threeTeam++;
        else h2h.fieldSize.fourPlus++;
      }
    }
  }

  // Calculate Strength of Schedule
  // Weight by opponent win rate AND field size (playing good players in big fields = harder)
  const allStats = await getPlayerStats(gameId);
  const statsMap = new Map(allStats.map((s) => [s.playerId, s]));

  let totalWeightedOpponentScore = 0;
  let totalWeight = 0;

  opponentEncounters.forEach((enc, oppId) => {
    const oppStats = statsMap.get(oppId);
    if (oppStats && oppStats.totalGames > 0) {
      // Weight by: opponent's win rate * average field size of encounters
      const avgFieldSize = enc.totalFieldSize / enc.count;
      const weight = enc.count * avgFieldSize;
      totalWeightedOpponentScore += oppStats.winPercentage * weight;
      totalWeight += weight;
    }
  });

  const strengthOfSchedule = totalWeight > 0 ? totalWeightedOpponentScore / totalWeight : 50;
  const avgFieldSize = totalGames > 0 ? totalFieldSize / totalGames : 2;

  // Build H2H records
  const headToHead: HeadToHeadRecord[] = [];
  opponentStats.forEach((stats, oppId) => {
    const oppName = playerMap.get(oppId) || 'Unknown';
    const total = stats.wins + stats.losses + stats.ties;
    headToHead.push({
      opponentId: oppId,
      opponentName: oppName,
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      totalGames: total,
      winPercentage: total > 0 ? (stats.wins / total) * 100 : 0,
      formatBreakdown: stats.format,
      fieldSizeBreakdown: stats.fieldSize,
    });
  });

  // Sort H2H by games played
  headToHead.sort((a, b) => b.totalGames - a.totalGames);

  return {
    playerId,
    playerName: player.name,
    totalGames,
    wins,
    losses,
    winPercentage: totalGames > 0 ? (wins / totalGames) * 100 : 0,
    avgMargin: totalGames > 0 ? totalMargin / totalGames : 0,
    weightedWins,
    placements,
    fieldSize,
    teamSize,
    avgFieldSize,
    strengthOfSchedule,
    headToHead,
  };
}

// Get leaderboard with SOS included
export interface LeaderboardEntry extends PlayerStatsResult {
  strengthOfSchedule: number;
  weightedWins: number;
  avgFieldSize: number;
  placements: PlacementBreakdown;
  avgFinish: number; // Average placement (1.0 = always 1st, 2.0 = always 2nd, etc.)
}

export async function getLeaderboard(gameId?: string): Promise<LeaderboardEntry[]> {
  const basicStats = await getPlayerStats(gameId);

  const results: LeaderboardEntry[] = [];

  for (const stat of basicStats) {
    const advanced = await getAdvancedPlayerStats(stat.playerId, gameId);

    // Calculate average finish position
    const { first, second, third, other } = advanced.placements;
    const totalPlacements = first + second + third + other;
    // Assume "other" averages to 4th place for calculation
    const avgFinish = totalPlacements > 0
      ? (first * 1 + second * 2 + third * 3 + other * 4) / totalPlacements
      : 0;

    results.push({
      ...stat,
      strengthOfSchedule: advanced.strengthOfSchedule,
      weightedWins: advanced.weightedWins,
      avgFieldSize: advanced.avgFieldSize,
      placements: advanced.placements,
      avgFinish,
    });
  }

  return results;
}
