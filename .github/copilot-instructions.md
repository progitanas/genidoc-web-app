# Copilot Instructions for GeniDoc Appointment System

## Project Overview
- **Architecture**: Node.js/Express backend (REST API) with static HTML/CSS/JS frontend. No database: all data is in-memory (arrays in server.js).
- **Main flows**: Patient registration/authentication, appointment booking, admin dashboard, doctor/establishment management.
- **Entry points**:
  - `/genidoc.html`: Landing page (public)
  - `/auth.html`: Authentication/registration (public)
  - `/index.html`: Patient card (after login/registration)
  - `/appintment.html`: Appointment booking
  - `/admin.html`: Admin dashboard
  - `/doctors.html`, `/establishments.html`: Management UIs

## Key Patterns & Conventions
- **API endpoints** are defined in `server.js` (see `/api/appointments`, `/api/register`, `/api/stats`, etc.).
- **Frontend navigation** is handled by static HTML files with JS for dynamic actions and fetch calls to the backend.
- **Patient registration**: POST `/api/register` returns a unique GeniDoc ID (format: `GD-XXXXXX`). This ID is passed via URL to `index.html` and displayed as the patient card.
- **No persistent storage**: All data (appointments, users) is lost on server restart.
- **Error handling**: API returns `{ success: false, message: '...' }` for errors. 404s are handled by a catch-all Express route.
- **Date/time**: Uses `moment` for slot calculations and validation.

## Developer Workflows
- **Start server**: `npm start` (production) or `npm run dev` (with nodemon)
- **Install dependencies**: `npm install`
- **Debug port issues**: If `EADDRINUSE`, kill the process using port 3000 (`netstat -ano | findstr :3000` + `taskkill /F /PID <PID>`)
- **Frontend changes**: Edit HTML/CSS/JS files directly. No build step required.
- **API changes**: Edit `server.js` and restart the server.

## Integration Points
- **ICS file generation**: Frontend JS generates calendar files for appointments.
- **Google/Outlook login**: Simulated in frontend only (no real OAuth).
- **Static assets**: Served from `/static` (logo, background images).

## Examples
- To add a new API: define the route in `server.js` after `app` is initialized.
- To add a new page: create an HTML file and add a route in `server.js` to serve it.
- To pass data between pages: use URL parameters (e.g., `index.html?genidocId=GD-123456`).

## Important Files
- `server.js`: All backend logic and API endpoints
- `appintment.html`, `index.html`, `auth.html`, `genidoc.html`: Main frontend flows
- `README.md`: Project setup, API docs, and data model

---
If you add new endpoints or pages, always update both the Express routes and the navigation in the relevant HTML files.
