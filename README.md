# Appointment Board

A full-stack appointment scheduling tool for small teams. View, add, edit, complete, and cancel appointments from a clean responsive board — with time-slot conflict detection built in.

---

## Features

- **Board view** — all appointments displayed as cards, colour-coded by status
- **Add / Edit** — modal form with client-side and server-side validation
- **Complete / Cancel** — one-click status transitions with inline confirmation
- **Filter** — by date and/or status; clickable summary cards act as quick filters
- **Conflict prevention** — the server rejects any booking that overlaps an existing scheduled slot
- **Toast notifications** — success and error feedback that auto-dismisses after 4 s
- **Responsive** — single-column on mobile, two-column grid on wider screens

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4     |
| Backend  | FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn     |
| Database | PostgreSQL (via Docker Compose)                 |
| ORM      | SQLAlchemy (declarative, async-ready sessions)  |

---

## Project Structure

```
appointment-booking/
├── backend/
│   ├── docker-compose.yml          # PostgreSQL container
│   └── app/
│       ├── main.py                 # FastAPI app + CORS
│       ├── requirements.txt        # Python dependencies
│       ├── database/
│       │   ├── connection.py       # SQLAlchemy engine & session
│       │   └── models.py           # Appointment ORM model
│       ├── routers/
│       │   └── appointments.py     # REST endpoints
│       ├── schemas/
│       │   └── appointment.py      # Pydantic request/response models
│       └── services/
│           └── appointment_service.py  # Business logic & conflict check
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css               # Tailwind v4 + custom animations
        ├── types/
        │   └── appointment.ts      # Shared TypeScript interfaces
        ├── services/
        │   └── appointmentApi.ts   # fetch() wrappers for the REST API
        └── components/
            ├── AppointmentBoard.tsx  # Main page — state, layout, filters
            ├── AppointmentCard.tsx   # Individual appointment card
            ├── AppointmentModal.tsx  # Add / Edit modal form
            └── Toast.tsx             # Notification toasts
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Docker** (for the PostgreSQL database)

---

### 1 — Start the database

```bash
cd backend
docker-compose up -d
```

This starts a PostgreSQL 15 container on port **5432** with the credentials defined in `docker-compose.yml`.

---

### 2 — Configure the backend

Create a `.env` file inside `backend/app/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appointments
```

Adjust the credentials to match your `docker-compose.yml` if you changed them.

---

### 3 — Install Python dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r app/requirements.txt
```

---

### 4 — Run the backend

```bash
# From the backend/ directory, with the venv active
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 5 — Install frontend dependencies

```bash
cd frontend
npm install
```

---

### 6 — Run the frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

| Method  | Endpoint                          | Description                          |
|---------|-----------------------------------|--------------------------------------|
| `GET`   | `/appointments/`                  | List all appointments                |
| `GET`   | `/appointments/?appointment_date=YYYY-MM-DD` | Filter by date          |
| `GET`   | `/appointments/?status=scheduled` | Filter by status                     |
| `GET`   | `/appointments/{id}`              | Get a single appointment             |
| `POST`  | `/appointments/`                  | Create a new appointment             |
| `PUT`   | `/appointments/{id}`              | Update an existing appointment       |
| `PATCH` | `/appointments/{id}/complete`     | Mark an appointment as completed     |
| `PATCH` | `/appointments/{id}/cancel`       | Cancel an appointment                |

### Example — Create an appointment

```http
POST /appointments/
Content-Type: application/json

{
  "title": "Team standup",
  "description": "Daily sync",
  "appointment_date": "2026-09-15",
  "start_time": "09:00",
  "end_time": "09:30"
}
```

### Error responses

| Status | Meaning                                   |
|--------|-------------------------------------------|
| `400`  | Validation error (e.g. end before start)  |
| `404`  | Appointment not found                     |
| `409`  | Time slot already booked                  |

---

## Business Rules & Assumptions

- **Status flow** — an appointment starts as `scheduled`. It can move to `completed` or `cancelled`, but not back. A cancelled appointment cannot be completed.
- **Conflict detection** — the server checks for overlap using the condition `existing.start < new.end AND existing.end > new.start`. Cancelled appointments are excluded from conflict checks, so their slot becomes available again.
- **Soft cancel** — cancelled appointments are never deleted; they remain visible on the board with a dimmed style and strikethrough title.
- **Edit restriction** — only `scheduled` appointments can be edited. The edit form is not shown for completed or cancelled cards.
- **Time validation** — both the frontend (before the request) and the backend (on receipt) enforce that `end_time > start_time`.
- **CORS** — the backend allows requests from `http://localhost:5173` only. Update `allow_origins` in `app/main.py` for production.
- **Database** — SQLAlchemy creates all tables automatically on startup via `Base.metadata.create_all()`, so no manual migration step is needed for a fresh database.

---

## Frontend Scripts

| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start the Vite dev server with HMR       |
| `npm run build` | Type-check and build for production      |
| `npm run preview` | Preview the production build locally  |
| `npm run lint`  | Run ESLint across the source tree        |
