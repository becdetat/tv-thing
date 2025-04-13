import axios from 'axios';

const JELLYFIN_URL = process.env.NEXT_PUBLIC_JELLYFIN_URL;
const JELLYFIN_API_KEY = process.env.NEXT_PUBLIC_JELLYFIN_API_KEY;

if (!JELLYFIN_URL || !JELLYFIN_API_KEY) {
  console.error('Jellyfin configuration is not set in environment variables');
}

const jellyfinClient = axios.create({
  baseURL: JELLYFIN_URL,
  headers: {
    'X-Emby-Token': JELLYFIN_API_KEY,
  },
});

export interface JellyfinShow {
  Id: string;
  Name: string;
  ProviderIds: {
    Tmdb?: string;
  };
}

export interface JellyfinSeason {
  Id: string;
  IndexNumber: number | null;
  ChildCount: number | null;
}

export const getShows = async (): Promise<JellyfinShow[]> => {
  const response = await jellyfinClient.get('/Items', {
    params: {
      Recursive: true,
      IncludeItemTypes: 'Series',
      Fields: 'ProviderIds',
    },
  });
  return response.data.Items;
};

export const getShowSeasons = async (showId: string): Promise<JellyfinSeason[]> => {
  const response = await jellyfinClient.get(`/Shows/${showId}/Seasons`, {
    params: {
      Fields: 'ChildCount',
    },
  });
  
  return response.data.Items;
}; 