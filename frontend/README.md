# Appointment Board — Frontend

React + TypeScript frontend for the Appointment Board app.  
See the [root README](../README.md) for full setup and usage instructions.

## Stack

- **React 19** with hooks
- **TypeScript**
- **Vite 8** — dev server and bundler
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/vite` plugin

## Scripts

| Command           | Description                             |
|-------------------|-----------------------------------------|
| `npm run dev`     | Start dev server at http://localhost:5173 |
| `npm run build`   | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally      |
| `npm run lint`    | Run ESLint                              |

## Structure

```
src/
├── main.tsx                    # React root
├── App.tsx                     # App shell
├── index.css                   # Tailwind import + custom animations
├── types/
│   └── appointment.ts          # Shared TypeScript interfaces
├── services/
│   └── appointmentApi.ts       # fetch() API client (base: localhost:8000)
└── components/
    ├── AppointmentBoard.tsx    # Page layout, state, filters, stats
    ├── AppointmentCard.tsx     # Single appointment card with actions
    ├── AppointmentModal.tsx    # Add / Edit modal form
    └── Toast.tsx               # Auto-dismissing toast notifications
```

## Environment

The API base URL is hardcoded to `http://localhost:8000` in `src/services/appointmentApi.ts`.  
Update it before deploying to a non-local environment.
