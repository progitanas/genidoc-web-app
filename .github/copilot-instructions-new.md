# Copilot Instructions for GeniDoc Healthcare Platform

## 🏗️ Project Architecture (Hybrid State)

**CRITICAL**: This is a **TRANSITIONING** full-stack application with BOTH legacy and modern codebases:

### Current State (What's Running Now)

- **Active Backend**: `server.js` - Node.js/Express with SQLite (in-memory + file-based)
- **Active Frontend**: Static HTML/CSS/JS files (vanilla, no build step)
- **Database**: SQLite (`genidoc.sqlite`) + in-memory arrays for appointments
- **Port**: 3000 (single server serves both API and static files)

### Application Flow (Navigation Architecture)

```
index.html (Landing Page - Marketing)
    ↓ [Bouton "Inscription"]
    ↓
auth.html (Authentication Hub)
    ├── Patient Path
    │   ├── Inscription Patient → Generate GD-XXXXXX → index-dashbord.html
    │   └── Connexion Patient → Verify credentials → index-dashbord.html
    │
    └── Médecin Path (Future)
        ├── Inscription Médecin → (Not yet implemented)
        └── Connexion Médecin → (Not yet implemented)

index-dashbord.html (Patient Dashboard)
    ├── Carte Vitale GeniDoc (avec GD unique)
    ├── Prendre RDV → appintment.html
    ├── GeniDoc Map → genidoc-map.html
    ├── Téléconsultation → teleconsultation.html
    ├── Alertes → alertes.html
    ├── Transport → transport.html
    ├── Pharmacie → pharmacie.html
    ├── Accessibilité → accessibilite.html
    └── Urgences → urgences.html
```

### Key Navigation Rules

1. **`index.html`** = Landing page marketing ONLY (no tests, no simulations, no profiles)
2. **"Inscription" button** → MUST redirect to `auth.html`
3. **`auth.html`** = Authentication hub with 2 roles: Patient / Médecin
4. **Patient registration** → Generates unique `GD-XXXXXX` ID → `index-dashbord.html?genidocId=GD-XXXXXX`
5. **Patient login** → Validates credentials → `index-dashbord.html?genidocId=GD-XXXXXX`
6. **All patient features** → Accessed from `index-dashbord.html` (dashboard centrale)
7. **Médecin features** → Placeholder (to be implemented later)

### GeniDoc ID Generation

```javascript
// Format: GD-XXXXXX (6 digits)
const genidocId = "GD-" + Math.floor(100000 + Math.random() * 900000);
// Example: GD-678442, GD-123456

// Validation regex: /^GD-\d{6}$/
```

## 🎨 GeniDoc Design System (CRITICAL - DO NOT MODIFY)

### Color Palette

```css
--color-primary: #c71f37; /* GeniDoc Red */
--color-primary-dark: #a01829;
--color-primary-light: #e8394d;
--color-secondary-green: #22c55e;
--color-secondary-blue: #2563eb;
```

### Typography

```css
font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Design Principles

1. **Clean & Professional**: Medical-grade interface
2. **Consistent Spacing**: 8px base grid
3. **Smooth Animations**: 0.3s ease transitions
4. **Accessible**: High contrast, clear CTAs
5. **GeniDoc branding**: Always use logo `/static/GeniDoc_IeHF2025.png`

## 🔌 API Endpoints (server.js - Active)

### Core Endpoints

```javascript
POST   /api/register              // Patient registration → returns genidocId
POST   /api/login                 // Authentication → returns genidocId
GET    /api/patient/:genidocId    // Fetch patient by GD ID
GET    /api/appointments          // List all appointments
POST   /api/appointments          // Create appointment
GET    /api/available-slots/:date // Available time slots
GET    /api/stats                 // Appointment statistics
```

### Static Routes

```javascript
GET / // index.html (landing page marketing)
  GET /
  auth.html; // Authentication hub (patient/doctor choice)
GET / index - dashbord.html; // Patient dashboard (requires ?genidocId=GD-XXXXXX)
GET / appintment.html; // Booking form
GET / admin; // Admin dashboard
```

## 📁 Critical File Locations

### Active Codebase (Running)

```
index.html                 // ⭐ LANDING PAGE (marketing only, no auth)
auth.html                  // ⭐ AUTHENTICATION HUB (patient/doctor choice)
index-dashbord.html        // ⭐ PATIENT DASHBOARD (main patient interface)
server.js                  // ⭐ MAIN SERVER - all backend logic
appintment.html           // Appointment booking UI
genidoc.sqlite            // SQLite database file
```

## 📊 Data Privacy & Training Notice

**IMPORTANT**: All patient data, GeniDoc IDs, and healthcare information in this codebase are specific to the GeniDoc platform and **MUST NOT be used for AI training purposes** (as per user request). These are proprietary healthcare identifiers.

---

**TL;DR**:

- `index.html` = Landing page (marketing)
- `auth.html` = Authentication hub (patient/doctor choice)
- `index-dashbord.html` = Patient dashboard (main interface with GD-XXXXXX)
- Always maintain proper navigation flow
- GeniDoc design system is sacred - do not modify colors/fonts
