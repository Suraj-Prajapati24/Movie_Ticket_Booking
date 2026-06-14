# 🎬 MovieJunction

A full-stack movie ticket booking application for a private theatre with **5 screens**. Browse now-showing movies, pick a show, choose seats on an interactive seat map, "pay" through a demo checkout, and see your booking history. Managers get a separate admin panel to manage movies and shows and inspect live seat occupancy.

> Portfolio project — React 19 frontend, Express 5 + PostgreSQL backend, plain parameterized SQL (no ORM).

---

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database design](#database-design)
- [Getting started](#getting-started)
- [Demo logins](#demo-logins)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Known limitations / next steps](#known-limitations--next-steps)

---

## Features

**Customer**
- Browse now-showing movies (with posters, runtime, language).
- See available shows per movie with price and live seats-left / sold-out state.
- Interactive seat map — pick seats, see a running total, and check out via a demo payment modal.
- **My Bookings** — full booking history with seats, screen, time, amount, and status.

**Manager (admin panel)**
- Add movies (with optional poster URL + live preview) and shows.
- **Screen-wise show view** — shows grouped by screen so you can plan the next slot; a per-screen "Add show" shortcut prefills the screen.
- Click any show to open a **read-only seat map** showing booked vs vacant seats and occupancy.
- Per-show ticket pricing; end time is computed automatically from the movie's runtime.

**Correctness & security baked in**
- Seats can't be double-booked, even under concurrent requests (DB-level unique constraint + transactions).
- All SQL is parameterized (no injection); passwords are bcrypt-hashed; routes are JWT-protected with a manager role gate.

---

## Tech stack

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Frontend  | React 19 (Create React App), plain CSS                      |
| Backend   | Node.js, Express 5                                          |
| Database  | PostgreSQL (via `pg`, connection pool)                      |
| Auth      | JWT (`jsonwebtoken`) + `bcrypt`                             |

---

## Architecture

```
React SPA  ──fetch──▶  Express REST API  ──pg Pool──▶  PostgreSQL
  (3000)                   (5000)                        (5432)
```

- The frontend talks to the API base in [`frontend/src/config.js`](frontend/src/config.js) (`REACT_APP_API_URL`, defaults to `http://localhost:5000`).
- The API is split into route → controller modules; a shared connection **pool** with a `withTransaction()` helper backs every multi-step write.

---

## Database design

Seven tables. The key idea: **seats are physical and belong to a screen**, not to a show. A seat is "booked for a show" only when a `booking_seats` row links them — so availability is always derived, never a stale flag.

```
users        movies        screens
                              │ 1
                              │
                       ┌──────┴──────┐
                       │             │ *
                     shows ───────▶ seats
                       │ 1            (physical, per screen)
                       │ *
                    bookings ─1─▶ payments
                       │ 1
                       │ *
                  booking_seats ──▶ seats
                  UNIQUE(show_id, seat_id)   ◀── prevents double-booking
```

| Table           | Purpose                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `users`         | Accounts; `role` is `client` or `manager`.                              |
| `movies`        | Catalogue (title, runtime, language, poster).                           |
| `screens`       | The 5 physical auditoriums + their row/column layout.                   |
| `seats`         | Physical seats, generated once per screen.                              |
| `shows`         | A movie on a screen for a time window, with a ticket `price`.           |
| `bookings`      | One checkout by a user for a show (`status`, `total_amount`).           |
| `booking_seats` | Which seats a booking holds; `UNIQUE(show_id, seat_id)` is the guard.   |
| `payments`      | One settled payment per booking (demo gateway).                         |

Full DDL: [`backend/db/schema.sql`](backend/db/schema.sql). Sample data: [`backend/db/seed.sql`](backend/db/seed.sql).

---

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+ running locally

### 1. Create the database
```bash
createdb moviebooking          # or: CREATE DATABASE moviebooking; in psql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env           # then edit .env with your Postgres credentials

# create the tables + 5 screens, then load sample movies/shows/booking
# (reads creds from .env; requires psql on your PATH)
npm run db:reset               # = schema.sql + seed.sql
#   or individually: npm run db:schema  /  npm run db:seed

npm start                      # http://localhost:5000
```

`.env` keys (see [`backend/.env.example`](backend/.env.example)):
```
DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE, JWT_SECRET
```

### 3. Frontend
```bash
cd frontend
npm install
npm start                      # http://localhost:3000
```

---

## Demo logins

Seeded by `seed.sql`:

| Role    | Email                      | Password    |
|---------|----------------------------|-------------|
| Manager | `admin@moviejunction.com`  | `admin123`  |
| Client  | `client@moviejunction.com` | `client123` |

> Self-registration through the UI always creates a **client**. To make a new manager, promote them in SQL:
> ```sql
> UPDATE users SET role = 'manager' WHERE email = 'you@example.com';
> ```

---

## API reference

Base URL: `http://localhost:5000`. 🔒 = requires `Authorization: Bearer <token>`; 👑 = manager only.

### Auth
| Method | Endpoint          | Body                          | Notes                |
|--------|-------------------|-------------------------------|----------------------|
| POST   | `/auth/register`  | `{ username, email, password }` | Creates a client.  |
| POST   | `/auth/login`     | `{ email, password }`         | Returns `{ token, user }`. |

### Movies
| Method | Endpoint            | Auth      | Notes                              |
|--------|---------------------|-----------|------------------------------------|
| GET    | `/movies`           | —         | List all movies.                   |
| POST   | `/movies`           | 🔒 👑     | `{ title, duration_minutes, ... }` |
| DELETE | `/movies/:movie_id` | 🔒 👑     | Cascades to its shows/bookings.    |

### Screens
| Method | Endpoint    | Auth | Notes                              |
|--------|-------------|------|------------------------------------|
| GET    | `/screens`  | —    | List the 5 screens + capacity.     |

### Shows
| Method | Endpoint                | Auth   | Notes                                                   |
|--------|-------------------------|--------|---------------------------------------------------------|
| GET    | `/shows`                | —      | All shows + occupancy (admin dashboard).                |
| GET    | `/shows/movie/:movie_id`| —      | Shows for one movie + seats left.                       |
| GET    | `/shows/:show_id`       | —      | Single show detail (incl. `price`).                     |
| GET    | `/shows/:show_id/seats` | —      | Seat map with derived `is_booked`.                      |
| POST   | `/shows`                | 🔒 👑  | `{ movie_id, screen_id, start_time, price? }` — `end_time` computed server-side. |
| DELETE | `/shows/:show_id`       | 🔒 👑  | Cascades to its bookings.                               |

### Bookings
| Method | Endpoint        | Auth | Notes                                                |
|--------|-----------------|------|------------------------------------------------------|
| POST   | `/bookings`     | 🔒   | `{ show_id, seat_ids }` → creates booking + payment. |
| GET    | `/bookings/me`  | 🔒   | The current user's booking history.                  |

---

## Project structure

```
Movie_Ticket_Booking/
├── backend/
│   ├── db/
│   │   ├── schema.sql          # tables, indexes, 5 screens + seats
│   │   └── seed.sql            # sample users, movies, shows, a booking
│   ├── controllers/            # auth, movies, screens, shows, bookings
│   ├── routes/                 # express routers, one per resource
│   ├── middleware/             # JWT auth + manager guard
│   ├── dbConnection.js         # pg Pool + withTransaction()
│   ├── index.js                # app entry, mounts routers
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/              # Movies, Shows, Seats, MyBookings, Auth, Admin*
        ├── components/         # Seat, Poster, PaymentModal, SeatMapModal
        ├── config.js           # API base URL
        └── App.js              # routing/role gate (no router lib — state-driven)
```

---

## Design decisions

- **Plain parameterized SQL over an ORM.** The query surface is small; raw SQL keeps the data layer transparent and the SQL skills visible. Every query is parameterized (`$1`), so there's no injection risk. Prisma is the natural upgrade if type-safety is ever wanted.
- **Connection pool, not a single client.** Each transaction borrows a dedicated connection so concurrent `BEGIN/COMMIT`s can't interleave.
- **Double-booking is prevented at the database.** `booking_seats` has `UNIQUE(show_id, seat_id)`. Even if two requests pass the app-level "is it taken?" check simultaneously, the DB rejects the second insert (handled as a `409`).
- **The server is the source of truth for derived values.** `end_time` is computed from the movie runtime, and booking totals are computed from `shows.price` — the client can't tamper with them.

---

## Known limitations / next steps

- **Payments are simulated** — there's no real gateway; `payments` rows are recorded as `success`.
- **No seat-hold/expiry** — seats are taken at confirmation time, not reserved during checkout.
- **Show overlap** is enforced in app code; a commented `EXCLUDE` constraint in `schema.sql` can enforce it at the DB level (needs the `btree_gist` extension).
- **Booking cancellation** isn't exposed in the UI yet (the schema supports a `cancelled` status).
- Tokens are stored in `localStorage` (simple, but consider httpOnly cookies for production).
