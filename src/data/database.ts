import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('neurochain.db');
  return db;
};

export const initDatabase = async () => {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      full_name TEXT,
      role TEXT CHECK(role IN ('PARENT', 'SPECIALIST', 'CAREGIVER')),
      tier_level TEXT CHECK(tier_level IN ('FREE', 'BASIC', 'PREMIUM')),
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      first_name TEXT,
      date_of_birth TEXT,
      gender TEXT,
      primary_concerns TEXT, -- Stored as JSON string
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities_log (
      id TEXT PRIMARY KEY,
      child_id TEXT,
      game_id TEXT,
      duration_ms INTEGER,
      accuracy_percentage INTEGER,
      timestamp TEXT,
      game_specific_metrics TEXT, -- JSON
      ai_vision_metrics TEXT, -- JSON
      created_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      child_id TEXT,
      test_type TEXT,
      raw_answers TEXT, -- JSON
      risk_score INTEGER,
      risk_level TEXT CHECK(risk_level IN ('LOW', 'MODERATE', 'HIGH')),
      timestamp TEXT,
      created_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);
  
  console.log('Database initialized successfully.');
};
