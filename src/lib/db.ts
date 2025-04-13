import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.NEXT_PUBLIC_DATABASE_PATH || 
  (process.env.NODE_ENV === 'production' 
    ? '/data/database.sqlite'
    : path.join(process.cwd(), 'database.sqlite'));

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize the database with required tables
db.exec(`
  CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    show_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id),
    UNIQUE(show_id, season_number)
  );

  CREATE TABLE IF NOT EXISTS jellyfin_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jellyfin_id TEXT UNIQUE NOT NULL,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tmdb_id) REFERENCES shows(tmdb_id)
  );
`);

export default db; 