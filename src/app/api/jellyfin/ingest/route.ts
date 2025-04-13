import { NextResponse } from 'next/server';
import { getShows, getShowSeasons } from '@/lib/jellyfin';
import db from '@/lib/db';

interface DatabaseShow {
  id: number;
}

interface DatabaseSeason {
  id: number;
}

export async function POST() {
  try {
    const jellyfinShows = await getShows();
    let showsProcessed = 0;
    let seasonsProcessed = 0;

    for (const show of jellyfinShows) {
      if (!show.ProviderIds?.Tmdb) continue;
      
      const tmdbId = parseInt(show.ProviderIds.Tmdb);
      if (isNaN(tmdbId)) continue;

      // Check if show exists
      const existingShow = db.prepare('SELECT id FROM shows WHERE tmdb_id = ?').get(tmdbId) as DatabaseShow | undefined;
      
      if (existingShow) {
        // Update existing show
        db.prepare('UPDATE shows SET title = ? WHERE id = ?').run(
          show.Name,
          existingShow.id
        );
      } else {
        // Insert new show
        db.prepare('INSERT INTO shows (tmdb_id, title) VALUES (?, ?)').run(
          tmdbId,
          show.Name
        );
      }
      showsProcessed++;

      // Process seasons
      const seasons = await getShowSeasons(show.Id);
      for (const season of seasons) {
        if (season.IndexNumber === null || season.IndexNumber === undefined) continue;
        
        const showId = existingShow?.id || (db.prepare('SELECT id FROM shows WHERE tmdb_id = ?').get(tmdbId) as DatabaseShow).id;
        
        // Check if season exists
        const existingSeason = db.prepare('SELECT id FROM seasons WHERE show_id = ? AND season_number = ?').get(
          showId,
          season.IndexNumber
        ) as DatabaseSeason | undefined;
        
        if (existingSeason) {
          // Update existing season
          db.prepare('UPDATE seasons SET episode_count = ? WHERE id = ?').run(
            season.ChildCount,
            existingSeason.id
          );
        } else {
          // Insert new season
          db.prepare('INSERT INTO seasons (show_id, season_number, episode_count) VALUES (?, ?, ?)').run(
            showId,
            season.IndexNumber,
            season.ChildCount
          );
        }
        seasonsProcessed++;
      }
    }

    return NextResponse.json({ 
      success: true,
      showsProcessed,
      seasonsProcessed
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ingest shows', details: error }, { status: 500 });
  }
} 