# Copilot Instructions for GeniDoc Healthcare Platform

## 🏗️ Project Architecture (Hybrid State)

**CRITICAL**: This is a **TRANSITIONING** full-stack application with BOTH legacy and modern codebases:

### Current State (What's Running Now)

- **Active Backend**: `server.js` - Node.js/Express with SQLite (in-memory + file-based)
- **Active Frontend**: Static HTML/CSS/JS files (vanilla, no build step)
- **Database**: SQLite (`genidoc.sqlite`) + in-memory arrays for appointments
- **Port**: 3000 (single server serves both API and static files)

### Target State (Modern Stack - Partially Built)

- **Backend**: `backend/src/` - TypeScript/Express with Prisma ORM + PostgreSQL
  - JWT authentication (`backend/src/middleware/auth.ts`)
  - Controllers: `authController.ts`, `appointmentController.ts`
  - **Status**: ⚠️ TypeScript files exist but NOT compiled or integrated into main server
- **Frontend**: `frontend/` - React 18 + TypeScript + Vite
  - Redux Toolkit, React Router, Stripe integration
  - **Status**: ⚠️ Scaffolded but pages NOT yet implemented
- **Database**: Prisma schema (`prisma/schema.prisma`) with 20+ tables
  - **Status**: ⚠️ Schema defined but migrations NOT applied to production DB

## 🎯 Key Understanding for AI Agents

### Which Backend to Modify?

1. **For immediate features/fixes**: Edit `server.js` (Node.js legacy backend)
   - This is what's actually running when you do `npm start` or `npm run dev`
   - Handles `/api/*` endpoints, serves HTML files, SQLite operations
2. **For new modern features**: Add to `backend/src/` (TypeScript, not yet active)
   - These files are NOT currently executed
   - Will eventually replace `server.js` after migration

### Critical Data Models

#### Legacy (server.js)

```javascript
// In-memory arrays (lost on restart)
appointments = []; // Array of appointment objects
patients = []; // SQLite table via db.run()

// SQLite tables: patient, establishment, documents, embeddings
// Patient: genidocId (GD-XXXXXX), email, password, birthdate
```

#### Modern (Prisma schema)

```prisma
// 20+ interconnected tables with proper relations
User -> Patient/Doctor/Admin (role-based inheritance)
Appointment -> Patient + Doctor + Payment
Payment -> Stripe integration
DoctorSchedule -> availability management
```

## 🔑 Essential Patterns & Conventions

### Authentication Flow (Legacy - server.js)

```javascript
// Registration: POST /api/register
// - Generates GD-XXXXXX ID, stores in SQLite
// - Returns { success: true, genidocId: "GD-123456" }

// Login: POST /api/login
// - Accepts email OR username + password
// - Plain string comparison (no hashing yet)
// - Returns { success: true, genidocId, data: {...} }
```

### Authentication Flow (Modern - backend/src/)

```typescript
// Uses JWT with bcrypt hashing
// Middleware: authenticateToken, authorize, isPatient, isDoctor, isAdmin
// Token blacklist for logout
// Role-based access control (RBAC)
```

### Frontend Navigation (Legacy HTML)

- URL params pass data: `index.html?genidocId=GD-123456`
- Inline `<script>` tags with fetch API calls
- No routing library - direct file loads

### API Response Format (Both)

```javascript
// Success:
{ success: true, data: {...} }

// Error:
{ success: false, message: "Error description" }
```

## 🚀 Critical Developer Workflows

### Starting the Application

```bash
# Current production method
npm start              # Runs server.js on port 3000

# Development with auto-reload
npm run dev            # Nodemon watches server.js

# Modern stack (NOT yet connected)
npm run dev            # Backend (if server.ts existed)
cd frontend && npm run dev  # Frontend on port 3001 (Vite)

# Docker (full-stack setup)
docker-compose up -d   # PostgreSQL + Redis + App
```

### Database Operations

#### SQLite (Active)

```bash
# No Prisma commands - direct sqlite3
# Database file: genidoc.sqlite
# Tables managed via db.run() in server.js
```

#### PostgreSQL + Prisma (Future)

```bash
npx prisma generate           # Generate Prisma Client
npx prisma migrate dev        # Apply migrations
npx prisma studio             # GUI at localhost:5555
npx prisma db push            # Sync schema without migrations
```

### Port Management (Windows PowerShell)

```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use npx
npx kill-port 3000
```

## 🔌 API Endpoints (server.js - Active)

### Core Endpoints

```javascript
POST   /api/register              // Patient registration (SQLite)
POST   /api/login                 // Authentication (email/username)
GET    /api/patient/:genidocId    // Fetch patient by GD ID
GET    /api/appointments          // List all appointments
POST   /api/appointments          // Create appointment
PUT    /api/appointments/:id      // Update appointment
DELETE /api/appointments/:id      // Delete appointment
GET    /api/available-slots/:date // Available time slots
GET    /api/stats                 // Appointment statistics
```

### Special Features

```javascript
POST   /api/genidoc-map           // OCR + geocoding for establishments
POST   /api/upload                // File upload + OCR extraction
GET    /api/rag-search?q=...     // RAG search over documents
POST   /api/chat                  // Gemini AI chat endpoint
GET/POST /api/embedding-config    // Configure Gemini embeddings
```

### Static Routes

```javascript
GET /                      // genidoc.html (landing)
GET /auth.html             // Login/register
GET /index.html            // Patient card
GET /appintment.html       // Booking form
GET /admin                 // Admin dashboard
GET /doctors               // Doctor management
GET /establishments        // Establishment management
GET /:page.html            // Generic HTML file server
```

## 🧩 Integration Points

### External APIs

- **Tesseract.js**: OCR for uploaded images (establishment photos)
- **OpenStreetMap**: Geocoding for addresses (`node-geocoder`)
- **Gemini API**: Embeddings + chat (optional, via GEMINI_API_KEY)
- **Stripe**: Payment processing (planned, keys in .env)
- **SendGrid**: Email notifications (planned, key in .env)

### File Uploads

- **Multer**: Saves to `/uploads/` directory
- **RAG System**: Extracts text, generates embeddings, stores in SQLite
  - Tables: `documents`, `embeddings`
  - Vector search via cosine similarity

### Calendar Integration

- ICS file generation (client-side JS)
- No real OAuth - Google/Outlook buttons are UI-only

## 📁 Critical File Locations

### Active Codebase (Running)

```
server.js                  // ⭐ MAIN SERVER - all backend logic
appintment.html           // Appointment booking UI
auth.html                 // Login/registration form
index.html                // Patient card display
genidoc.html              // Landing page
admin.html                // Admin dashboard
genidoc.sqlite            // SQLite database file
.env                      // Config (GEMINI_API_KEY, ports, etc)
```

### Modern Codebase (Not Yet Active)

```
backend/src/
  ├── middleware/auth.ts           // JWT auth middleware ✅
  ├── controllers/
  │   ├── authController.ts        // Register/login/logout ✅
  │   └── appointmentController.ts // CRUD operations ✅
  └── routes/
      ├── authRoutes.ts            // Auth endpoints ✅
      └── appointmentRoutes.ts     // Appointment endpoints ✅

frontend/src/
  ├── types/index.ts       // TypeScript types ✅
  ├── services/api.ts      // Axios API client ✅
  ├── hooks/               // Custom React hooks ✅
  └── pages/               // ⚠️ NOT YET CREATED

prisma/schema.prisma       // Database schema ✅ (20+ tables)
```

## 🎓 When to Use Which Approach

### Add New Feature NOW (Use Legacy)

1. Edit `server.js` - add Express route
2. Create/modify HTML file in root
3. Use inline JS with fetch API
4. SQLite via `db.run()` or in-memory arrays

### Prepare for Future (Use Modern)

1. Add TypeScript controller in `backend/src/controllers/`
2. Create React component/page in `frontend/src/`
3. Use Prisma for data models
4. Follow auth patterns from `authController.ts`

## 🔒 Security Notes

### Current (Legacy)

- ⚠️ **NO password hashing** - plain text comparison
- ⚠️ **NO JWT** - session-less authentication
- ⚠️ **SQLite file permissions** - exposed database
- ✅ CORS enabled
- ✅ Input sanitization via body-parser

### Modern (When Active)

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT tokens (24h expiration)
- ✅ Token blacklist for logout
- ✅ Role-based access control
- ✅ Helmet.js security headers
- ✅ Rate limiting ready

## 🐛 Common Pitfalls

1. **Don't edit TypeScript backend files expecting immediate changes** - they're not running
2. **SQLite tables != Prisma schema** - two separate databases
3. **Port 3000 vs 3001** - legacy uses 3000, modern frontend would use 3001
4. **In-memory appointments array** - data lost on server restart (not in SQLite)
5. **GeniDoc ID format**: Must match `/^GD-\d{6}$/` (e.g., GD-123456)
6. **GEMINI_API_KEY**: Optional - RAG/chat features fail gracefully if missing

## 📚 Further Reading

- `README.md` - Full project overview, tech stack, features
- `GETTING_STARTED.md` - Setup guide for PostgreSQL + modern stack
- `docs/ARCHITECTURE.md` - UML diagrams, system design
- `prisma/schema.prisma` - Complete database schema with comments

---

**TL;DR**: Modify `server.js` + HTML files for immediate changes. Build in `backend/src/` + `frontend/src/` for the future modern stack. Check if files are TypeScript before editing - if yes, they're not active yet.
