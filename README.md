# Online Shop Website System

A production-ready online shop system with two websites and one shared API/database.

- `client-site/` — public customer shop, React + Vite
- `admin-site/` — password-only admin dashboard, React + Vite
- `backend/` — FastAPI REST API, Neon PostgreSQL, Cloudinary images

## Short architecture and database flow

The client website and admin website both call the same FastAPI backend. The backend stores product data in Neon PostgreSQL and uploads product images to Cloudinary, saving only persistent image URLs and Cloudinary public IDs in the database.

Admin flow:

1. Admin logs in with `ADMIN_PASSWORD` through `/admin/login`.
2. Backend verifies the password and creates an HTTP-only signed session cookie.
3. Admin creates/updates/deletes posts through protected `/admin/*` routes.
4. Images are uploaded to Cloudinary; product, image, buy contact, and review records are stored in Neon.

Client flow:

1. Client loads products from `GET /posts`.
2. Client opens product details from `GET /posts/{post_id}`.
3. Client submits reviews through `POST /posts/{post_id}/reviews`.
4. Reviews are public, but only admin can delete them.

## Database schema

Tables:

### posts

- `id`
- `name`
- `instock` nullable
- `caption`
- `price`
- `created_at`
- `updated_at`

### post_images

- `id`
- `post_id`
- `image_url`
- `cloudinary_public_id`
- `sort_order`
- `created_at`

`cloudinary_public_id` is added so the backend can clean up Cloudinary images when posts/images are deleted.

### buy_contacts

- `id`
- `post_id`
- `contact_type`
- `contact_url`
- `created_at`

### reviews

- `id`
- `post_id`
- `gmail`
- `review_text`
- `created_at`

## Backend API routes

Public:

- `GET /health` → `{ "ok": true }`
- `GET /posts?search=&limit=24&offset=0`
- `GET /posts/{post_id}`
- `GET /posts/{post_id}/reviews`
- `POST /posts/{post_id}/reviews`

Admin protected routes:

- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin/posts`
- `GET /admin/posts/{post_id}`
- `POST /admin/posts`
- `PUT /admin/posts/{post_id}`
- `DELETE /admin/posts/{post_id}`
- `DELETE /admin/reviews/{review_id}`

## Local development

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, Cloudinary keys, CORS_ORIGINS
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Test health:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{"ok":true}
```

### 2. Client website

```bash
cd client-site
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

### 3. Admin website

```bash
cd admin-site
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:5174`

## Environment variables

### Backend

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
ADMIN_PASSWORD=change-this-strong-password
ADMIN_SESSION_SECRET=change-this-long-random-secret-at-least-32-chars
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CORS_ORIGINS=https://your-client-site.onrender.com,https://your-admin-site.onrender.com
MAX_UPLOAD_MB=5
ADMIN_SESSION_DAYS=7
CLOUDINARY_FOLDER=online-shop
```

### Client/admin sites

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Render deployment

Recommended Render services:

1. Backend Web Service
2. Client Static Site
3. Admin Static Site

### Backend service

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Add backend env vars:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CORS_ORIGINS`

Set `CORS_ORIGINS` to both deployed frontend URLs, comma-separated:

```env
https://your-client-site.onrender.com,https://your-admin-site.onrender.com
```

### Client static site

- Root directory: `client-site`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Env var:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Admin static site

- Root directory: `admin-site`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Env var:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Neon setup

1. Create a Neon project.
2. Copy the pooled or direct PostgreSQL connection string.
3. Use it as `DATABASE_URL` in backend Render env vars.
4. Keep `sslmode=require` in the URL. The backend automatically converts the URL for `asyncpg`.

The backend creates tables on startup with SQLAlchemy `create_all`. For larger production projects, add Alembic migrations later.

## Cloudinary setup

1. Create a Cloudinary account.
2. Copy cloud name, API key, and API secret.
3. Add them to backend Render env vars.
4. Images are uploaded to the folder set by `CLOUDINARY_FOLDER`.

## UptimeRobot keep-alive setup

Render free services can sleep. Use UptimeRobot to ping the backend every 5 minutes.

1. Create a UptimeRobot monitor.
2. Monitor type: HTTP(s).
3. URL:

```text
https://your-backend.onrender.com/health
```

4. Interval: 5 minutes.
5. Expected response:

```json
{"ok":true}
```

## Security notes

- `ADMIN_PASSWORD` is checked only by the backend.
- The frontend never receives or stores `ADMIN_PASSWORD`.
- Admin session is an HTTP-only signed cookie.
- Admin routes require a valid session.
- CORS only allows origins from `CORS_ORIGINS`.
- Uploads accept image content types only.
- Upload size is limited by `MAX_UPLOAD_MB`.
- Images are not stored on Render local filesystem.

## Manual testing checklist

See `MANUAL_TESTING.md`.
