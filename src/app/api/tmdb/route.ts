import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set in environment variables');
}

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'search';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let response;
    if (type === 'search') {
      console.log('Searching TMDB for:', query);
      response = await tmdbClient.get('/search/tv', {
        params: { query },
      });
    } else if (type === 'details') {
      console.log('Fetching TMDB details for ID:', query);
      response = await tmdbClient.get(`/tv/${query}`);
    } else {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('TMDB API Error:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      params: error.config?.params,
    });
    return NextResponse.json(
      { error: 'Failed to fetch from TMDB', details: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 