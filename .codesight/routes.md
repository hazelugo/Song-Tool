# Routes

## CRUD Resources

- **`/api/playlists/[id]`** GET | PATCH/:id | DELETE/:id → [id]
- **`/`** GET | POST | DELETE/:id

## Other Routes

### next-app

- `GET` `/api/discovery` → out: { aiAvailable } [auth, db] ✓
- `POST` `/api/discovery` → out: { aiAvailable } [auth, db] ✓
- `GET` `/api/health` → out: { status, db } [db] ✓
- `DELETE` `/api/playlists/[id]/songs/[songId]` params(id, songId) → out: { error } [auth, db]
- `POST` `/api/playlists/[id]/songs` params(id) → out: { error } [auth, db]
- `PUT` `/api/playlists/[id]/songs` params(id) → out: { error } [auth, db]
- `GET` `/api/playlists/[id]/suggestions` params(id) → out: { error } [auth, db]
- `GET` `/api/playlists` → out: { data, total, page, limit } [auth, db] ✓
- `POST` `/api/playlists` → out: { data, total, page, limit } [auth, db] ✓
- `GET` `/api/similar` → out: { error } [auth, db]
- `PUT` `/api/songs/[id]` params(id) → out: { error } [auth, db]
- `DELETE` `/api/songs/[id]` params(id) → out: { error } [auth, db]
- `POST` `/api/songs/bulk` → out: { error } [auth, db]
- `GET` `/api/songs` → out: { data, total, page, pageSize } [auth, db] ✓
- `POST` `/api/songs` → out: { data, total, page, pageSize } [auth, db] ✓
- `GET` `/api/songs/search` → out: { error } [auth, db]
