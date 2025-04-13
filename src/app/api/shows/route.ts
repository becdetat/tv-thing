import { NextResponse } from 'next/server';
import { getShowDetails } from '@/lib/tmdb';
import db from '@/lib/db';

interface DatabaseShow {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  latest_jellyfin_season: number | null;
  latest_jellyfin_episodes: number | null;
}

interface TMDBShowDetails {
  id: number;
  name: string;
  seasons: Array<{
    season_number: number;
    episode_count: number;
    air_date: string | null;
  }>;
}

export async function GET() {
  try {
    // Get all shows from the database
    const shows = db.prepare(`
      SELECT s.id, s.tmdb_id, s.title, s.poster_path,
             MAX(js.season_number) as latest_jellyfin_season,
             MAX(js.episode_count) as latest_jellyfin_episodes
      FROM shows s
      LEFT JOIN seasons js ON s.id = js.show_id
      GROUP BY s.id
    `).all() as DatabaseShow[];

    // Get latest season info from TMDB for each show
    const showsWithLatestInfo = await Promise.all(
      shows.map(async (show) => {
        try {
          const tmdbShow = await getShowDetails(show.tmdb_id) as TMDBShowDetails;
          const latestSeason = tmdbShow.seasons?.[tmdbShow.seasons.length - 1];
          
          return {
            ...show,
            latest_tmdb_season: latestSeason?.season_number || null,
            latest_tmdb_episodes: latestSeason?.episode_count || null,
            latest_tmdb_air_date: latestSeason?.air_date || null,
          };
        } catch (error) {
          console.error(`Error fetching TMDB data for show ${show.title}:`, error);
          return {
            ...show,
            latest_tmdb_season: null,
            latest_tmdb_episodes: null,
            latest_tmdb_air_date: null,
          };
        }
      })
    );

    return NextResponse.json(showsWithLatestInfo);
  } catch (error) {
    console.error('Error fetching shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { tmdbId, title, posterPath } = await request.json();

    // Check if show already exists
    const existingShow = db.prepare('SELECT id FROM shows WHERE tmdb_id = ?').get(tmdbId);
    if (existingShow) {
      return NextResponse.json({ error: 'Show already exists' }, { status: 400 });
    }

    // Insert new show
    const result = db.prepare(`
      INSERT INTO shows (tmdb_id, title, poster_path)
      VALUES (?, ?, ?)
    `).run(tmdbId, title, posterPath);

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding show:', error);
    return NextResponse.json({ error: 'Failed to add show' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Show ID is required' }, { status: 400 });
    }

    // Delete the show and its associated seasons
    db.prepare('DELETE FROM seasons WHERE show_id = ?').run(id);
    db.prepare('DELETE FROM shows WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting show:', error);
    return NextResponse.json({ error: 'Failed to delete show' }, { status: 500 });
  }
} 