import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize the database
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('squadshuffle.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dateAdded INTEGER NOT NULL,
      isActive INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      iconName TEXT NOT NULL,
      dateCreated INTEGER NOT NULL,
      lowerScoreWins INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      date INTEGER NOT NULL,
      winningTeamId TEXT,
      isComplete INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (gameId) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      name TEXT NOT NULL,
      playerIds TEXT NOT NULL,
      score INTEGER,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration: Add lowerScoreWins column if it doesn't exist
  try {
    await db.runAsync('ALTER TABLE games ADD COLUMN lowerScoreWins INTEGER DEFAULT 0');
  } catch {
    // Column already exists, ignore error
  }

  // Migration: Add placement column to teams table (1 = 1st, 2 = 2nd, etc.)
  try {
    await db.runAsync('ALTER TABLE teams ADD COLUMN placement INTEGER');
  } catch {
    // Column already exists, ignore error
  }

  return db;
}

// Get the database instance
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
