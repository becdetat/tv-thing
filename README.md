# TV Show Tracker

A web application that helps you track TV shows and compare them with your Jellyfin collection.

## Features

- Search and add TV shows using The Movie Database (TMDB) API
- Connect to your Jellyfin server to view your collection
- Track shows you're interested in
- Compare your collection with available episodes

## Prerequisites

- Node.js 18 or later
- Docker (for containerized deployment)
- TMDB API key
- Jellyfin server with API access

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Testing Docker locally

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

## Docker Deployment

1. Build and push the Docker image:
   ```bash
   docker build -t tv-show-tracker .
   docker push becdetat/tv-thing:latest
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v /path/to/data:/data \
     -e TMDB_API_KEY=your_tmdb_api_key \
     -e JELLYFIN_URL=http://your-jellyfin-server:8096 \
     -e JELLYFIN_API_KEY=your_jellyfin_api_key \
     tv-show-tracker
   ```

## Environment Variables

- `TMDB_API_KEY`: Your TMDB API key
- `JELLYFIN_URL`: URL of your Jellyfin server
- `JELLYFIN_API_KEY`: Your Jellyfin API key
- `DATABASE_PATH`: Path to the SQLite database file (default: /data/database.sqlite)


## Docker Compose

`.env`:
```
NEXT_PUBLIC_JELLYFIN_URL={url to your Jellyfin server}
NEXT_PUBLIC_JELLYFIN_API_KEY={generated in Jellyfin}
TMDB_API_KEY={your TMDB API key}
NEXT_PUBLIC_DATABASE_PATH=/data/database.sqlite
```

`docker-compose.yml`:
```yaml
services:
  app:
    build: .
    image: becdetat/tv-thing:latest
    container_name: tv-thing
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - TMDB_API_KEY=${TMDB_API_KEY}
    volumes:
      - ./data:/data
    networks:
      - tv-thing-network

networks:
  tv-thing-network:
    driver: bridge
```


## Development

The application is built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- SQLite
- TMDB API
- Jellyfin API 