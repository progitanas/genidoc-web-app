# 🏥 GeniDoc - Platform Santé Complète

> **Une plateforme healthcare enterprise-grade** avec React, TypeScript, Express.js, PostgreSQL et architecture full-stack moderne.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](/LICENSE)

## � Table des matières

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation Rapide](#installation-rapide)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)

---

## 🎯 À propos

GeniDoc est une **plateforme complète de gestion de rendez-vous médicaux** conçue pour connecter patients, docteurs et administrateurs. Elle combine:

- ✅ Interface patient intuitive pour chercher et réserver
- ✅ Tableau de bord docteur pour gérer les rendez-vous
- ✅ Portail admin pour analytics et gestion
- ✅ Paiements sécurisés via Stripe
- ✅ Notifications email automatiques
- ✅ Architecture scalable et sécurisée

## ✨ Fonctionnalités

### 👥 Pour les Patients

- 🔐 Inscription et authentification sécurisée
- 🔍 Recherche avancée de docteurs (spécialité, localisation, note)
- 📅 Réservation de rendez-vous en ligne
- 💳 Paiements sécurisés avec Stripe
- 📊 Historique des rendez-vous
- ⭐ Notes et avis sur les docteurs
- 🔔 Notifications automatiques (confirmations, reminders)

### 👨‍⚕️ Pour les Docteurs

- 🏥 Profil professionnel avec credentials
- ⏰ Gestion d'emploi du temps flexible
- 📋 Liste des rendez-vous à venir
- ✅ Accepter/refuser rendez-vous
- 💰 Tableau de bord des revenus
- � Consultation notes et prescriptions
- 💸 Historique des paiements reçus

### 👨‍💼 Pour les Administrateurs

- 📊 Analytics en temps réel (utilisateurs, rendez-vous, revenus)
- ✅ Vérification des docteurs
- 🔒 Gestion des utilisateurs (suspend, delete)
- � Historique complet des transactions
- 📈 Rapports et statistiques
- ⚙️ Paramètres du système

---

## 🏗️ Architecture

### Diagramme Système

```
┌──────────────────────────────────────────────────────────┐
│                  CLIENT (React + TS)                     │
│  Patient App │ Doctor App │ Admin Dashboard │ Landing   │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼─────────────────────────────────────┐
│             EXPRESS API (Backend)                        │
│  ✅ Auth (JWT) │ 🔒 Role-based Access │ � RESTful   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│         POSTGRESQL + PRISMA ORM                          │
│  Users │ Patients │ Doctors │ Appointments │ Payments   │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      Stripe      SendGrid      AWS S3
     Payments      Emails      File Storage
```

### Base de Données

- **20+ tables** avec relations complexes
- **Prisma ORM** pour type-safety
- **Migrations versionnées** pour DevOps
- **Indexes optimisés** pour performance
- **Audit logging** pour conformité

---

## 🚀 Installation Rapide

### Voir le guide complet:

📖 **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Guide détaillé en 5 minutes

### Quick Start (1 minute):

```bash
# 1. Cloner
git clone <repo-url>
cd genidoc-fullstack

# 2. Setup (auto)
./setup.sh              # macOS/Linux
.\setup.ps1             # Windows (PowerShell)

# 3. Démarrer
npm run dev             # Backend (port 3000)
cd frontend && npm run dev  # Frontend (port 3001)

# 4. Accès
🌐 Frontend: http://localhost:3001
🔌 API: http://localhost:3000/api
```

### Avec Docker:

```bash
docker-compose up -d
# Tout démarre automatiquement!
```

---

## 📚 Documentation

| Document                                           | Description                          |
| -------------------------------------------------- | ------------------------------------ |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)**     | Guide d'installation étape par étape |
| **[FULLSTACK_SETUP.md](./FULLSTACK_SETUP.md)**     | Configuration complète du système    |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Diagrammes UML et architecture       |
| **[docs/DATABASE.md](./docs/DATABASE.md)**         | Schéma et relations BD               |
| **[docs/API.md](./docs/API.md)**                   | Documentation des endpoints          |

---

## � Tech Stack

### Frontend

```
React 18 + TypeScript 5
├── Vite 4 (build ultra-rapide)
├── Redux Toolkit (state management)
├── Axios (HTTP client)
├── React Router (navigation)
├── Stripe.js (paiements)
└── Tailwind CSS (styling)
```

### Backend

```
Express.js 4 + TypeScript 5
├── Prisma 5 (ORM)
├── JWT (authentification)
├── bcryptjs (password hashing)
├── Stripe SDK (paiements)
├── SendGrid (emails)
└── Socket.io (real-time)
```

### Infrastructure

```
PostgreSQL 14 + Prisma Migrations
├── 20+ tables normalisées
├── Indexes optimisés
├── ACID transactions
└── Full-text search ready
```

### DevOps

```
Docker + Docker Compose
├── Multi-stage builds
├── Container health checks
├── Volume persistence
└── Network isolation
```

---

## 🔐 Sécurité

- ✅ JWT tokens (24h expiration)
- ✅ Password hashing bcryptjs (10 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ HTTPS ready
- ✅ Audit logging pour conformité
- ✅ Token blacklist pour logout

---

## 📊 Dashboards

### Patient Dashboard

```
┌─ Rechercher Docteur
├─ Réserver Rendez-vous
├─ Mes Rendez-vous
├─ Historique Paiements
├─ Mon Profil
└─ Notifications
```

### Doctor Dashboard

```
┌─ Mon Emploi du Temps
├─ Mes Rendez-vous
├─ Mes Patients
├─ Mes Revenus
├─ Mon Profil
└─ Prescriptions
```

### Admin Dashboard

```
┌─ Analytics (Users, Revenue, Appointments)
├─ Gestion Utilisateurs
├─ Gestion Docteurs
├─ Transactions
├─ Rapports
└─ Paramètres
```

---

## 🛠️ Développement

### Scripts disponibles:

```bash
# Backend
npm run dev         # Serveur de développement (nodemon)
npm run build       # Build TypeScript
npm run start       # Production

# Frontend
cd frontend && npm run dev      # Dev server (Vite)
cd frontend && npm run build    # Build for production
cd frontend && npm run preview  # Preview production build

# Database
npx prisma studio              # GUI base de données
npx prisma migrate dev         # Créer migration
npx prisma db seed             # Seed données test
```

---

## 🐛 Troubleshooting

### Voir [GETTING_STARTED.md#troubleshooting](./GETTING_STARTED.md#troubleshooting)

Problèmes courants et solutions:

- Port déjà utilisé
- Base de données non connectée
- Erreurs CORS
- Modules manquants

---

## 🤝 Contribution

Les contributions sont les bienvenues! Pour participer:

1. Fork le repository
2. Créer une branche (`git checkout -b feature/amazing`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing`)
5. Ouvrir une Pull Request

---

## 📄 License

MIT License - Voir [LICENSE](./LICENSE)

---

## 📞 Support

- 📖 Consultez la [documentation](./docs)
- 🐛 Ouvrez une [issue](https://github.com/yourusername/genidoc/issues)
- 💬 Discussions sur [GitHub](https://github.com/yourusername/genidoc/discussions)

---

## 🎉 Remerciements

Construit avec ❤️ pour transformer la santé numérique

**Status**: ✅ Production Ready | 📦 v2.0.0 | 🚀 Scalable

3. **Accéder à l'application**
   - Interface patient : http://localhost:3000
   - Interface admin : http://localhost:3000/admin

## 📡 API Endpoints

### Rendez-vous

| Méthode | Endpoint                | Description                        |
| ------- | ----------------------- | ---------------------------------- |
| GET     | `/api/appointments`     | Liste tous les rendez-vous         |
| GET     | `/api/appointments/:id` | Récupère un rendez-vous spécifique |
| POST    | `/api/appointments`     | Crée un nouveau rendez-vous        |
| PUT     | `/api/appointments/:id` | Modifie un rendez-vous             |
| DELETE  | `/api/appointments/:id` | Supprime un rendez-vous            |

### Créneaux disponibles

| Méthode | Endpoint                     | Description                        |
| ------- | ---------------------------- | ---------------------------------- |
| GET     | `/api/available-slots/:date` | Créneaux disponibles pour une date |

### Statistiques

| Méthode | Endpoint     | Description            |
| ------- | ------------ | ---------------------- |
| GET     | `/api/stats` | Statistiques générales |

## 📋 Structure des données

### Rendez-vous

```json
{
  "id": "uuid-string",
  "fullName": "Jean Dupont",
  "email": "jean.dupont@email.com",
  "phone": "+33123456789",
  "service": "Consultation générale",
  "consultationType": "Consultation générale",
  "date": "2024-01-15",
  "time": "14:30",
  "mode": "présentiel", // ou "téléconsultation"
  "notes": "Notes optionnelles",
  "status": "confirmé",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "when": "2024-01-15T14:30:00.000Z"
}
```

## 🎯 Services disponibles

- Consultation générale
- Consultation spécialisée
- Examen médical
- Suivi médical
- Urgence
- Téléconsultation

## ⚙️ Configuration

### Variables d'environnement

- `PORT` : Port du serveur (défaut: 3000)

### Horaires disponibles

- **Heures** : 9h00 - 17h00
- **Créneaux** : 30 minutes
- **Jours** : Tous les jours (configurable)

## 🚀 Déploiement

### Production

1. Installer les dépendances de production

   ```bash
   npm install --only=production
   ```

2. Démarrer le serveur
   ```bash
   npm start
   ```

### Avec PM2 (recommandé)

```bash
npm install -g pm2
pm2 start server.js --name "genidoc-api"
pm2 save
pm2 startup
```

## 📁 Structure du projet

```
genidoctest/
├── server.js           # Serveur principal
├── appintment.html     # Interface patient
├── admin.html          # Interface administration
├── package.json        # Configuration npm
├── static/             # Assets statiques
│   └── Logo_-_GeniDoc-removebg (1).png
└── README.md           # Ce fichier
```

## 🔧 Personnalisation

### Styles CSS

Les variables CSS principales sont définies dans `:root` :

```css
:root {
  --primary: #4d3aff; /* Couleur principale */
  --secondary: #00558c; /* Couleur secondaire */
  --success: #27ae60; /* Couleur succès */
  --danger: #e74c3c; /* Couleur erreur */
}
```

### Services

Modifier la liste dans `appintment.html` :

```javascript
const services = [
  "Consultation générale",
  "Consultation spécialisée",
  // Ajouter vos services ici
];
```

## 🐛 Débogage

### Logs serveur

Le serveur affiche des logs détaillés dans la console.

### Logs client

Ouvrir les outils de développement (F12) pour voir les erreurs côté client.

### Base de données

Actuellement, les données sont stockées en mémoire. En production, intégrer une vraie base de données (MongoDB, PostgreSQL, etc.).

## 📞 Support

Pour toute question ou problème, vérifiez :

1. Les logs du serveur
2. La console du navigateur
3. Les endpoints API dans un outil comme Postman

## 🔒 Sécurité

- Validation des données côté serveur
- Protection contre les créneaux doubles
- Nettoyage des entrées utilisateur

## 📈 Améliorations futures

- [ ] Base de données persistante
- [ ] Authentification admin
- [ ] Notifications email automatiques
- [ ] Rappels de rendez-vous
- [ ] API de calendrier (Google Calendar, Outlook)
- [ ] Export des données
- [ ] Multi-praticiens
