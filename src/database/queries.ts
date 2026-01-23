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
  await db.runAsync('DELETE FROM games WHERE id = ?', [id]);
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
  }>('SELECT * FROM teams WHERE sessionId = ?', [sessionId]);

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    playerIds: JSON.parse(row.playerIds),
    score: row.score,
  }));
}

export async function updateTeamScore(teamId: string, score: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE teams SET score = ? WHERE id = ?', [score, teamId]);
}

export async function endSession(
  sessionId: string,
  winningTeamId: string | null,
  notes?: string
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE sessions SET isComplete = 1, winningTeamId = ?, notes = ? WHERE id = ?',
    [winningTeamId, notes || null, sessionId]
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
