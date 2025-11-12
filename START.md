# 🎯 START HERE - Votre Premier Pas

> **Ne lisez ce fichier en premier! C'est votre guide de démarrage.**

---

## ✅ You Are Here

```
📍 Vous êtes ici
   ↓
   Phase 1 COMPLÈTEMENT TERMINÉE
   ✅ Infrastructure
   ✅ Database
   ✅ Authentication
   ✅ Backend API (Partial)
   ✅ Documentation

   ⬇️ NEXT: Phase 2 Implementation
```

---

## 🚀 Démarrage Immédiat (10 minutes)

### 1️⃣ **Installation** (2 minutes)

**Windows (PowerShell):**

```powershell
.\setup.ps1
```

**macOS/Linux:**

```bash
chmod +x setup.sh
./setup.sh
```

**Ou manuellement:**

```bash
npm install
cd frontend && npm install && cd ..
npx prisma migrate dev
```

### 2️⃣ **Démarrer les serveurs** (Terminal 1 & 2)

**Terminal 1 - Backend:**

```bash
npm run dev
```

✅ Accès à `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

✅ Accès à `http://localhost:3001`

### 3️⃣ **Vérifier l'installation** (3 minutes)

Exécuter le script de validation:

```bash
# macOS/Linux
./validate-setup.sh

# Windows
.\validate-setup.ps1
```

✅ Si tout est vert = SUCCÈS!

---

## 📖 Documentation à Lire (Dans l'ordre)

### 1. Commencez par:

📄 **[GETTING_STARTED.md](./GETTING_STARTED.md)** (10 min read)

- Installation détaillée
- Configuration
- Premiers tests

### 2. Ensuite:

📄 **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** (15 min read)

- Diagrammes UML
- Vue d'ensemble système
- Relations database

### 3. Puis:

📄 **[TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)** (10 min read)

- Qu'est-ce qui a été créé
- Structure des fichiers
- Patterns implémentés

### 4. Pour développer:

📄 **[NEXT_STEPS.md](./NEXT_STEPS.md)** (20 min read)

- Prochaines tâches
- Priorités
- Timeline

---

## 🧪 Test Quick API (Après démarrage)

```bash
# 1. Register (créer un compte)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PATIENT"
  }'

# Copier le "token" de la réponse
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123"
  }'

# 3. Get Profile (with token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

✅ Si ça marche = Backend fonctionne!

---

## 🗄️ Explorer la Base de Données

### Prisma Studio (GUI)

```bash
npx prisma studio
```

- Accès à `http://localhost:5555`
- Voir/éditer/ajouter les données
- Très intuitif

### PostgreSQL (Terminal)

```bash
psql -U genidoc_user -d genidoc_db

# Lister les tables
\dt

# Voir les utilisateurs
SELECT id, email, role FROM "User";

# Quitter
\q
```

---

## 📂 Structure Fichiers Clés

```
genidoc/
├── 📖 GETTING_STARTED.md          ← Lire d'abord!
├── 📖 NEXT_STEPS.md               ← Prochaines étapes
├── .env                           ← Configuration
├── prisma/
│   └── schema.prisma              ← Database schema (20 tables)
├── backend/
│   └── src/
│       ├── middleware/auth.ts     ← JWT verification
│       ├── controllers/           ← Business logic
│       └── routes/                ← Endpoints
├── frontend/
│   └── src/
│       ├── services/api.ts        ← API client
│       ├── hooks/                 ← React hooks
│       ├── types/                 ← TypeScript types
│       └── pages/                 ← Pages (À créer!)
└── docs/
    ├── ARCHITECTURE.md            ← Diagrammes UML
    ├── DATABASE.md                ← Schema détaillé
    └── API.md                     ← Endpoints docs
```

---

## 🎯 Phase 1 vs Phase 2

### ✅ Phase 1 - COMPLÈTE (Ce qui a été fait)

```
✅ Architecture full-stack
✅ Database schema (20+ tables)
✅ Authentification JWT + bcrypt
✅ Backend controllers (auth, appointments)
✅ Backend routes
✅ Frontend infrastructure
✅ API client service
✅ React hooks
✅ Docker setup
✅ Documentation complète
```

### 🔄 Phase 2 - À FAIRE (Prochaines étapes)

```
❌ React pages (Login, Register, Dashboards)
❌ React components (Forms, Cards, Layouts)
❌ Remaining controllers (Doctors, Patients, Payments)
❌ Stripe integration
❌ SendGrid emails
❌ Testing (Jest + Supertest)
❌ Production deployment
```

**Temps estimé Phase 2: 100-150 heures**

---

## 🔧 Commandes Utiles

```bash
# Backend
npm run dev              # Mode développement
npm run build           # Compiler TypeScript
npm start              # Production

# Frontend
cd frontend
npm run dev            # Mode développement
npm run build          # Build production
npm run preview        # Preview prod build

# Database
npx prisma studio              # GUI
npx prisma migrate dev         # New migration
npx prisma db push             # Sync schema
npx prisma generate            # Generate client

# Docker
docker-compose up -d           # Démarrer
docker-compose logs -f         # Logs
docker-compose down            # Arrêter

# Validation
./validate-setup.sh            # Check all (Unix)
.\validate-setup.ps1           # Check all (Windows)
```

---

## ⚡ Raccourcis Clés

| Besoin                | Fichier                                            |
| --------------------- | -------------------------------------------------- |
| Setup rapide          | [setup.sh](./setup.sh) or [setup.ps1](./setup.ps1) |
| Premiers pas          | [GETTING_STARTED.md](./GETTING_STARTED.md)         |
| Comprendre système    | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)     |
| Prochaines tâches     | [NEXT_STEPS.md](./NEXT_STEPS.md)                   |
| Vérifier installation | [validate-setup.sh](./validate-setup.sh)           |
| Tous les docs         | [docs/README.md](./docs/README.md)                 |
| Configuration         | [.env](./.env)                                     |
| Database              | [prisma/schema.prisma](./prisma/schema.prisma)     |

---

## 🚨 Erreurs Courantes & Solutions

### "Cannot find module '@prisma/client'"

```bash
npm install @prisma/client
npx prisma generate
```

### "EADDRINUSE: address already in use :::3000"

```bash
# Unix/macOS
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### "Database connection refused"

```bash
# Vérifier PostgreSQL est running
psql -U genidoc_user -d genidoc_db

# Si utilise Docker
docker-compose up -d postgres
```

### "TypeError: Cannot read properties of undefined"

- Vérifier .env variables
- Vérifier que le serveur backend est running
- Vérifier CORS_ORIGIN dans .env

### Plus d'aider?

→ Lire [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting)

---

## 📊 Status Dashboard

```
╔═══════════════════════════════════════════════════════════╗
║        GeniDoc Full-Stack - Status Overview              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ✅ Infrastructure              [████████████████] 100% ║
║  ✅ Database Design             [████████████████] 100% ║
║  ✅ Authentication              [████████████████] 100% ║
║  🔄 Backend API                 [████████░░░░░░░░]  40% ║
║  🔄 Frontend Core               [████░░░░░░░░░░░░]  20% ║
║  ❌ Frontend Pages              [░░░░░░░░░░░░░░░░]   0% ║
║  ❌ Testing                     [░░░░░░░░░░░░░░░░]   0% ║
║  🔄 Deployment                  [██████░░░░░░░░░░]  40% ║
║                                                           ║
║  OVERALL: ████████░░░░░░░░░░ 45% (Ready for Phase 2)   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🎓 Checklist Setup

### Installation:

- [ ] `npm install` completed
- [ ] `cd frontend && npm install` completed
- [ ] `.env` file exists
- [ ] `frontend/.env` file exists
- [ ] `npx prisma migrate dev` completed

### Validation:

- [ ] `npm run dev` works (Backend)
- [ ] `cd frontend && npm run dev` works (Frontend)
- [ ] Frontend loads at http://localhost:3001
- [ ] Can register user via API
- [ ] Can login and get token
- [ ] Prisma Studio opens at `npx prisma studio`

### Documentation:

- [ ] Read GETTING_STARTED.md
- [ ] Read ARCHITECTURE.md
- [ ] Read NEXT_STEPS.md
- [ ] Understand file structure

### Status:

- [ ] All green ✅? → Ready for Phase 2!
- [ ] Any red ❌? → Follow troubleshooting in GETTING_STARTED.md

---

## 🎬 Next Actions (In Order)

1. ✅ **Run setup script** (2 min)

   ```bash
   ./setup.sh  # or .\setup.ps1 on Windows
   ```

2. ✅ **Start servers** (1 min)

   ```bash
   npm run dev & cd frontend && npm run dev
   ```

3. ✅ **Validate installation** (2 min)

   ```bash
   ./validate-setup.sh
   ```

4. 📖 **Read GETTING_STARTED.md** (10 min)

5. 📖 **Read ARCHITECTURE.md** (15 min)

6. 🔨 **Start Phase 2** (See NEXT_STEPS.md)

---

## 💬 Questions?

1. ✅ Check [docs/README.md](./docs/README.md) (Documentation Index)
2. ✅ Read [GETTING_STARTED.md](./GETTING_STARTED.md)
3. ✅ Run validation script
4. ✅ Check logs: `docker-compose logs -f`

---

## 🚀 Ready?

```
┌─────────────────────────────────┐
│  ✅ You are ready to start!     │
│                                 │
│  Next: Run setup.sh or setup.ps1│
│                                 │
│  Then read: GETTING_STARTED.md  │
└─────────────────────────────────┘
```

**Let's go! 🚀**

---

**Questions? Check [docs/README.md](./docs/README.md) or GETTING_STARTED.md**

**Happy coding! ❤️**
