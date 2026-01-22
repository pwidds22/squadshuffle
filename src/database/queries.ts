import { getDatabase, generateId } from './db';
import type { Player, Game, Team, GameSession, NewPlayer, NewGame } from '../types';

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
    'INSERT INTO games (id, name, iconName, dateCreated) VALUES (?, ?, ?, ?)',
    [id, game.name, game.iconName, dateCreated]
  );

  return { id, name: game.name, iconName: game.iconName, dateCreated };
}

export async function getGames(): Promise<Game[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Game>('SELECT * FROM games ORDER BY name');
  return rows;
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
