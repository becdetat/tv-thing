import { NextResponse } from 'next/server';
import db from '@/lib/db';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

export async function POST() {
  try {
    // Close the current database connection
    db.close();

    // Delete the database file
    const dbPath = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_DATABASE_PATH || '/data/database.sqlite'
      : path.join(process.cwd(), 'database.sqlite');

    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    // Recreate the database
    const newDb = new Database(dbPath);

    // Initialize the database with required tables
    newDb.exec(`
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
} 