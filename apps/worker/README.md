# Player Image Assignment Worker

Assigns ESPN headshot image URLs to our players by matching player names with
the ESPN NBA athletes directory, then exports a `player_id -> image_url` CSV.

Runs on native `fetch` (Node 18+) — no dependencies to install.

## How It Works

1. **Fetches our players** from the players API. Each player DTO has a
   `fullName`. Omitting `limit` makes the API return every player at once.
2. **Fetches ESPN athletes** from the ESPN NBA athletes API (each has an `id`).
3. **Indexes ESPN athletes** by normalized name — lowercased, accent-stripped
   (`Jokić` -> `jokic`), and punctuation-flattened (`Gilgeous-Alexander`,
   `Jr.`). Every athlete is registered under its `fullName`, `displayName`, and
   `firstName + lastName`, so a single lookup resolves a match.
4. **Matches** each of our players to an ESPN athlete by that normalized name.
5. **Builds image URLs** from the matched ESPN `id`.
6. **Exports** `player-images.csv` and logs anything unmatched to
   `unmatched-players.json`.

## Usage

The API must be running and serving real players (`DATA_SOURCE=supabase`).

```bash
# Uses PLAYERS_API_URL (default: http://localhost:3333/api/players)
pnpm run assign-player-images

# Local API on the default NestJS port
pnpm run assign-player-images:local

# Point at any other API
PLAYERS_API_URL=https://your-api/api/players node assign-player-images.mjs
```

`ESPN_API_URL` can also be overridden; the default requests `limit=1500` and
the script warns if ESPN reports more athletes than it returned.

## Output

### `player-images.csv`

```csv
player_id,player_name,espn_id,image_url
player-123,LeBron James,1966,https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254
```

### `unmatched-players.json`

Players with no ESPN match, for manual review:

```json
[{ "id": "player-123", "name": "John Doe" }]
```

## ESPN Image URL Format

```
https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/{ESPN_ID}.png&w=350&h=254
```

Adjust the `w` / `h` query params for other sizes.

## Loading the CSV into the database

The `players.image_url` column is added by the migration
`supabase/migrations/20260725120000_add_player_image_url.sql`.

### Option 1: Store ESPN URLs directly (Fast)

```bash
# 1. Apply the migration (creates players.image_url)
pnpm exec supabase db push

# 2. Backfill image_url from the CSV (idempotent)
pnpm run import-player-images
```

This stores the original ESPN URLs in the database. The importer PATCHes each
`player_id` via the Supabase data API and is safe to re-run.

### Option 2: Upload images to Supabase S3 (Recommended)

If you want to self-host images and avoid relying on ESPN's URL permanence:

```bash
# 1. Apply the migration
pnpm exec supabase db push

# 2. Create the "nba-assets" bucket in Supabase Storage (if not already created)
#    - Go to Supabase Dashboard → Storage
#    - Click "Create a new bucket" and name it "nba-assets"
#    - Make it public if you want unauthenticated access

# 3. Upload images to S3 and update the database (idempotent)
pnpm run upload-images-s3
```

This script:
- Downloads each image from ESPN
- Uploads it to your Supabase S3 bucket (`nba-assets`)
- Updates the database with the new S3 URL
- Logs progress and any failures

**Prerequisites:**
- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env`
- `nba-assets` bucket created in Supabase Storage (can be private or public)

## Troubleshooting

### General

- **No players found** — confirm `PLAYERS_API_URL` is reachable and the API is
  serving real players (`DATA_SOURCE=supabase`, not the fictional mock data,
  which won't match ESPN).
- **Low match rate** — inspect `unmatched-players.json`; ESPN may spell a name
  differently. Extend the normalization or add manual overrides as needed.

### Image Upload (Option 2)

**Error: "DB update failed: 400"**
- Ensure the migration has been applied: `pnpm exec supabase db push`
- Check that the `players.image_url` column exists in the database
- Verify player IDs in the CSV match those in your database
- Ensure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct in `.env`

**Error: "Upload failed: 401"**
- Check that `SUPABASE_SECRET_KEY` is valid
- Verify the bucket `nba-assets` exists in Supabase Storage
- Ensure your Supabase service role key has storage permissions

**Error: "HTTP 404" when downloading images**
- Some ESPN headshot URLs may have expired
- The script logs these failures and continues with other players

**Slow uploads?**
- The script uses `CONCURRENCY = 4` to limit concurrent uploads
- Adjust this value in `upload-images-to-s3.mjs` if needed
- Network bandwidth is usually the bottleneck, not the script
