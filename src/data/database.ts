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

    CREATE TABLE IF NOT EXISTS video_screenings (
      id TEXT PRIMARY KEY,
      child_id TEXT,
      original_risk TEXT,
      adjusted_risk TEXT,
      concern_score INTEGER,
      task_results TEXT,
      created_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS specialists (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT,
      medical_reg_number TEXT,
      specialty TEXT,
      clinic_name TEXT,
      city TEXT,
      consultation_fee_bdt INTEGER,
      languages TEXT, -- JSON
      bio TEXT,
      profile_photo_url TEXT,
      bank_account_encrypted TEXT,
      calendly_url TEXT,
      status TEXT CHECK(status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
      is_verified INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      specialist_id TEXT,
      child_id TEXT,
      scheduled_at TEXT,
      session_type TEXT,
      status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
      amount_paid_bdt REAL,
      discount_applied_pct REAL DEFAULT 0,
      payment_gateway TEXT,
      payment_reference TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clinical_soap_notes (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      ai_generated_json TEXT, -- JSON
      specialist_edited_json TEXT, -- JSON
      is_signed INTEGER DEFAULT 0,
      signed_at TEXT,
      signed_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS specialist_blocked_slots (
      id TEXT PRIMARY KEY,
      specialist_id TEXT,
      slot_start TEXT,
      slot_end TEXT,
      reason TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE
    );
  `);
  
  console.log('Database initialized successfully.');
};

export const ensureSpecialistSchema = async () => {
  const database = await getDatabase();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS specialists (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT,
      medical_reg_number TEXT,
      specialty TEXT,
      clinic_name TEXT,
      city TEXT,
      consultation_fee_bdt INTEGER,
      languages TEXT,
      bio TEXT,
      profile_photo_url TEXT,
      bank_account_encrypted TEXT,
      calendly_url TEXT,
      status TEXT CHECK(status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
      is_verified INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      specialist_id TEXT,
      child_id TEXT,
      scheduled_at TEXT,
      session_type TEXT,
      status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
      amount_paid_bdt REAL,
      discount_applied_pct REAL DEFAULT 0,
      payment_gateway TEXT,
      payment_reference TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clinical_soap_notes (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      ai_generated_json TEXT,
      specialist_edited_json TEXT,
      is_signed INTEGER DEFAULT 0,
      signed_at TEXT,
      signed_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS specialist_blocked_slots (
      id TEXT PRIMARY KEY,
      specialist_id TEXT,
      slot_start TEXT,
      slot_end TEXT,
      reason TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status INTEGER DEFAULT 0,
      FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE
    );
  `);
};

export const migrateCalendlyUrl = async () => {
  const database = await getDatabase();
  try {
    await database.execAsync('ALTER TABLE specialists ADD COLUMN calendly_url TEXT;');
  } catch {
    // Column already exists — safe to ignore
  }
};
