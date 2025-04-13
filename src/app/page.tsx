'use client';

import { useState, useEffect } from 'react';
import { searchShows } from '@/lib/tmdb';
import { Show } from '@/lib/tmdb';
import Link from 'next/link';

interface ShowWithSeasons {
  id: number;
  title: string;
  poster_path: string | null;
  latest_jellyfin_season: number | null;
  latest_jellyfin_episodes: number | null;
  latest_tmdb_season: number | null;
  latest_tmdb_episodes: number | null;
  latest_tmdb_air_date: string | null;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [shows, setShows] = useState<Show[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [myShows, setMyShows] = useState<ShowWithSeasons[]>([]);
  const [showAllShows, setShowAllShows] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  // Function to check if a show is already tracked
  const isShowTracked = (tmdbId: number) => {
    return myShows.some(show => show.id === tmdbId);
  };

  useEffect(() => {
    const fetchMyShows = async () => {
      try {
        const response = await fetch('/api/shows');
        if (!response.ok) throw new Error('Failed to fetch shows');
        const data = await response.json();
        setMyShows(data);
      } catch (error) {
        console.error('Error fetching shows:', error);
      }
    };

    fetchMyShows();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchShows(searchQuery);
      setShows(results);
    } catch (error) {
      console.error('Error searching shows:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIngest = async () => {
    setUpdateLoading(true);
    setUpdateMessage(null);
    try {
      const response = await fetch('/api/jellyfin/ingest', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to ingest Jellyfin data');
      }
      
      const data = await response.json();
      setUpdateMessage(`Successfully updated ${data.showsProcessed} shows and ${data.seasonsProcessed} seasons`);
      
      // Refresh the shows list after ingestion
      const showsResponse = await fetch('/api/shows');
      if (showsResponse.ok) {
        const showsData = await showsResponse.json();
        setMyShows(showsData);
      }
    } catch (error) {
      setUpdateMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddShow = async (show: Show) => {
    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: show.id,
          title: show.name,
          posterPath: show.poster_path,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add show');
      }

      setAddMessage(`Successfully added ${show.name} to tracked shows`);
      
      // Refresh the shows list
      const showsResponse = await fetch('/api/shows');
      if (showsResponse.ok) {
        const showsData = await showsResponse.json();
        setMyShows(showsData);
      }
    } catch (error) {
      setAddMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteShow = async (showId: number, showTitle: string) => {
    try {
      const response = await fetch(`/api/shows?id=${showId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete show');
      }

      setDeleteMessage(`Successfully removed ${showTitle} from tracked shows`);
      
      // Refresh the shows list
      const showsResponse = await fetch('/api/shows');
      if (showsResponse.ok) {
        const showsData = await showsResponse.json();
        setMyShows(showsData);
      }
    } catch (error) {
      setDeleteMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">TV Show Tracker</h1>
          <div className="flex gap-4">
            <button
              onClick={handleIngest}
              disabled={updateLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {updateLoading ? 'Updating...' : 'Update from Jellyfin'}
            </button>
            <Link 
              href="/admin"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Admin
            </Link>
          </div>
        </div>
        
        {updateMessage && (
          <div className={`mb-4 p-4 rounded ${updateMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {updateMessage}
          </div>
        )}

        {addMessage && (
          <div className={`mb-4 p-4 rounded ${addMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {addMessage}
          </div>
        )}
        
        {deleteMessage && (
          <div className={`mb-4 p-4 rounded ${deleteMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {deleteMessage}
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a TV show..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {shows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.map((show) => {
                const isTracked = isShowTracked(show.id);
                return (
                  <div key={show.id} className="border rounded p-4">
                    {show.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${show.poster_path}`}
                        alt={show.name}
                        className="w-full h-auto mb-2"
                      />
                    )}
                    <h2 className="text-xl font-semibold">{show.name}</h2>
                    <p className="text-gray-600 line-clamp-3 mb-4">{show.overview}</p>
                    {isTracked ? (
                      <button
                        onClick={() => handleDeleteShow(show.id, show.name)}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove from Tracked Shows
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddShow(show)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add to Tracked Shows
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShows([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Results
              </button>
            </div>
          </div>
        )}

        {myShows.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">My Shows</h2>
              <button
                onClick={() => setShowAllShows(!showAllShows)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                {showAllShows ? 'Show Only New Seasons' : 'Show All Shows'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Show</th>
                    <th className="px-4 py-2 border">Latest in Jellyfin</th>
                    <th className="px-4 py-2 border">Latest Available</th>
                    <th className="px-4 py-2 border">Release Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myShows
                    .filter(show => {
                      if (showAllShows) return true;
                      const hasNewSeason = show.latest_tmdb_season !== null && 
                        (show.latest_jellyfin_season === null || 
                         show.latest_tmdb_season > show.latest_jellyfin_season);
                      return hasNewSeason;
                    })
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((show) => {
                      const hasNewSeason = show.latest_tmdb_season !== null && 
                        (show.latest_jellyfin_season === null || 
                         show.latest_tmdb_season > show.latest_jellyfin_season);
                      
                      const isReleased = show.latest_tmdb_air_date && 
                        new Date(show.latest_tmdb_air_date) < new Date();
                      
                      const rowClass = isReleased 
                        ? 'bg-green-50' 
                        : hasNewSeason 
                          ? 'bg-yellow-50' 
                          : '';
                      
                      return (
                        <tr 
                          key={show.id} 
                          className={`hover:bg-gray-50 ${rowClass}`}
                        >
                          <td className="px-4 py-2 border">
                            <div className="flex items-center justify-between">
                              <span>{show.title}</span>
                              {show.latest_jellyfin_season === null && (
                                <button
                                  onClick={() => handleDeleteShow(show.id, show.title)}
                                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 border text-center">
                            {show.latest_jellyfin_season !== null ? (
                              <span>Season {show.latest_jellyfin_season}</span>
                            ) : (
                              <span className="text-gray-500">Not in Jellyfin</span>
                            )}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            {show.latest_tmdb_season !== null ? (
                              <span>
                                Season {show.latest_tmdb_season}
                                {show.latest_tmdb_episodes !== null && ` (${show.latest_tmdb_episodes} episodes)`}
                              </span>
                            ) : (
                              <span className="text-gray-500">Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-2 border text-center">
                            {show.latest_tmdb_air_date ? (
                              <span>
                                {new Date(show.latest_tmdb_air_date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-500">Unknown</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 