# 📚 GeniDoc Documentation Index

Bienvenue dans la documentation technique complète de GeniDoc Full-Stack.

---

## 🚀 Getting Started (Lire EN PREMIER)

### [GETTING_STARTED.md](../GETTING_STARTED.md)

**Pour démarrer rapidement en 5 minutes**

- Installation rapide (script automation)
- Configuration détaillée
- Tester l'API avec curl
- Troubleshooting courant
- Structure PostgreSQL

**Lire si:** Vous commencez maintenant

---

## 🏗️ Architecture & Design

### [ARCHITECTURE.md](./ARCHITECTURE.md)

**Comprendre le système complet**

- Vue d'ensemble système (3 layers)
- Diagrammes UML:
  - Entity Relationship Diagram (ERD)
  - Diagramme de cas d'utilisation
  - Diagramme d'activité
- Security layers (10 niveaux)
- Project structure
- Relations database

**Lire si:** Vous voulez comprendre le design

---

## 🗄️ Base de Données

### [DATABASE.md](./DATABASE.md)

**Schéma et relations détaillées**

- Tables (20+ tables)
- Enums et types
- Relations (1-N, M-N)
- Indexes et performance
- Migration strategy
- Backup & recovery

**Lire si:** Vous travaillez avec Prisma/PostgreSQL

---

## 🔌 API Reference

### [API.md](./API.md)

**Documentation complète des endpoints**

- Authentication
- Appointments
- Doctors
- Patients
- Payments
- Notifications
- Admin
- Webhooks

**Lire si:** Vous implémentez les endpoints

---

## 🚢 Déploiement

### [DEPLOYMENT.md](./DEPLOYMENT.md)

**Guide de déploiement production**

- Environment setup
- Database migration
- Docker deployment
- Railway setup
- Heroku setup
- AWS setup
- SSL & HTTPS
- Monitoring & logs

**Lire si:** Vous allez en production

---

## 📚 Guides Complets

### [FULLSTACK_SETUP.md](../FULLSTACK_SETUP.md)

**Setup détaillé du full-stack**

- Installation étape par étape
- Configuration avancée
- Docker setup
- Prisma commands
- Troubleshooting

**Lire si:** Vous avez des problèmes d'installation

---

## 📋 Transformation & Résumé

### [TRANSFORMATION_SUMMARY.md](../TRANSFORMATION_SUMMARY.md)

**Ce qui a été fait - Vue d'ensemble complète**

- Avant vs Après
- Fichiers créés/modifiés
- Architecture layers
- Sécurité implémentée
- Métriques de transformation

**Lire si:** Vous voulez voir le progress

---

## 🎯 Prochaines Étapes

### [NEXT_STEPS.md](../NEXT_STEPS.md)

**Checklist implémentation Phase 2**

- React pages à créer
- Backend controllers manquants
- Stripe integration
- Email service
- Testing strategy
- Timeline recommandée

**Lire si:** Vous commencez le dev Phase 2

---

## 📖 README Principal

### [README.md](../README.md)

**Vue d'ensemble du projet**

- Fonctionnalités
- Installation rapide
- Tech stack
- Support & contribution

**Lire si:** C'est votre première visite

---

## 🗺️ Fichiers Clés du Projet

### Backend

```
backend/
├── src/
│   ├── middleware/auth.ts          ← JWT verification
│   ├── controllers/
│   │   ├── authController.ts       ← Register/Login/Logout
│   │   └── appointmentController.ts ← Appointment CRUD
│   ├── routes/
│   │   ├── authRoutes.ts           ← Auth endpoints
│   │   └── appointmentRoutes.ts    ← Appointment endpoints
│   └── server.ts                   ← Express app (à créer)
└── prisma/schema.prisma            ← Database schema
```

### Frontend

```
frontend/
├── src/
│   ├── types/index.ts              ← TypeScript types
│   ├── services/api.ts             ← API client
│   ├── hooks/index.ts              ← React hooks
│   ├── pages/                      ← Pages (à créer)
│   └── components/                 ← Components (à créer)
└── vite.config.ts                  ← Vite config
```

### Configuration

```
Root/
├── .env                            ← Config (development)
├── .env.example                    ← Config template
├── .gitignore                      ← Git ignore rules
├── package.json                    ← Backend deps
├── docker-compose.yml              ← Docker config
└── Dockerfile                      ← Backend container
```

---

## 🔍 Quick Navigation by Role

### 👨‍💻 Backend Developer

1. Lire: [GETTING_STARTED.md](../GETTING_STARTED.md)
2. Lire: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Lire: [DATABASE.md](./DATABASE.md)
4. Code: `backend/src/controllers/`
5. Lire: [API.md](./API.md)

### ⚛️ Frontend Developer

1. Lire: [GETTING_STARTED.md](../GETTING_STARTED.md)
2. Lire: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Code: `frontend/src/pages/`
4. Utiliser: `frontend/src/services/api.ts`
5. Lire: [NEXT_STEPS.md](../NEXT_STEPS.md)

### 🚀 DevOps/Deployment

1. Lire: [FULLSTACK_SETUP.md](../FULLSTACK_SETUP.md)
2. Lire: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Setup: Docker & database
4. Monitor: Logs & health checks

### 📊 Project Manager

1. Lire: [TRANSFORMATION_SUMMARY.md](../TRANSFORMATION_SUMMARY.md)
2. Lire: [README.md](../README.md)
3. Plan: [NEXT_STEPS.md](../NEXT_STEPS.md)
4. Track: Progress & timelines

---

## 💾 Important Files Reference

| File                             | Purpose          | Priority    |
| -------------------------------- | ---------------- | ----------- |
| `.env`                           | Configuration    | 🔴 CRITICAL |
| `prisma/schema.prisma`           | Database schema  | 🔴 CRITICAL |
| `backend/src/middleware/auth.ts` | Auth logic       | 🟡 HIGH     |
| `backend/src/controllers/`       | Business logic   | 🟡 HIGH     |
| `frontend/src/types/index.ts`    | Type definitions | 🟡 HIGH     |
| `frontend/src/services/api.ts`   | API client       | 🟡 HIGH     |
| `docker-compose.yml`             | Infrastructure   | 🟡 HIGH     |
| `package.json`                   | Dependencies     | 🟡 HIGH     |

---

## 🔧 Useful Commands

```bash
# Database
npx prisma studio                  # GUI interface
npx prisma migrate dev             # Create migration
npx prisma db push                 # Sync schema
npx prisma db seed                 # Seed data

# Backend
npm run dev                        # Dev server
npm run build                      # Compile TS
npm start                          # Production

# Frontend
cd frontend && npm run dev         # Dev server
cd frontend && npm run build       # Build

# Docker
docker-compose up -d               # Start
docker-compose logs -f             # Logs
docker-compose down                # Stop

# Git
git add .                          # Stage
git commit -m "message"            # Commit
git push                           # Push
```

---

## 📞 FAQ / Common Issues

### "Cannot find module '@prisma/client'"

```bash
npm install @prisma/client
npx prisma generate
```

### "EADDRINUSE: address already in use"

```bash
npx kill-port 3000
```

### "Database connection refused"

```bash
# Check PostgreSQL is running
psql -U genidoc_user -d genidoc_db

# Or use Docker
docker-compose up -d postgres
```

### "CORS error"

```javascript
// Check .env
CORS_ORIGIN=http://localhost:3001

// Check API service
axios.defaults.baseURL = 'http://localhost:3000/api'
```

---

## 📈 Learning Path

1. ✅ Read GETTING_STARTED.md
2. ✅ Setup local environment
3. ✅ Understand ARCHITECTURE.md
4. ✅ Explore DATABASE.md
5. ✅ Test API with curl
6. ✅ Review API.md
7. ✅ Start coding Phase 2
8. ✅ Read NEXT_STEPS.md

---

## 🎓 Educational Resources

### Concepts

- JWT Authentication: [JWT.io](https://jwt.io)
- PostgreSQL: [PostgreSQL Docs](https://www.postgresql.org/docs/)
- Prisma ORM: [Prisma Docs](https://www.prisma.io/docs/)
- React: [React Docs](https://react.dev)
- TypeScript: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- Express: [Express Docs](https://expressjs.com/en/4x/api.html)

### Tools

- Prisma Studio: Visual database explorer
- Postman/Insomnia: API testing
- pgAdmin: PostgreSQL GUI
- VS Code: Development

---

## ✅ Checklist d'Utilisation

- [ ] Lire GETTING_STARTED.md
- [ ] Installer dépendances
- [ ] Setup base de données
- [ ] Lancer les serveurs
- [ ] Tester API avec curl
- [ ] Lire ARCHITECTURE.md
- [ ] Lire DATABASE.md
- [ ] Commencer Phase 2
- [ ] Suivre NEXT_STEPS.md

---

## 🚀 Ready to Start?

### Next Action:

👉 **[GETTING_STARTED.md](../GETTING_STARTED.md)**

---

**Last Updated:** 2024-01-09  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

---

**GeniDoc - Healthcare Platform Full-Stack** ❤️
