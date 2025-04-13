import axios from 'axios';

// Use the full URL for API requests
const BASE_URL = typeof window !== 'undefined' 
  ? '/api/tmdb'  // Client-side: use relative URL
  : 'http://localhost:3000/api/tmdb';  // Server-side: use full URL

export interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
    air_date: string | null;
  }>;
}

export async function searchShows(query: string): Promise<Show[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${BASE_URL}?type=search&query=${encodedQuery}`;
    console.log('Searching shows with URL:', url);
    
    const response = await axios.get(url);
    return response.data.results;
  } catch (error) {
    console.error('Error searching shows:', error);
    throw error;
  }
}

export async function getShowDetails(tmdbId: number): Promise<Show> {
  try {
    const url = `${BASE_URL}?type=details&query=${tmdbId}`;
    console.log('Fetching show details with URL:', url);
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching show details:', error);
    throw error;
  }
}