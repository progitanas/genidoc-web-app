# 🏥 GeniDoc Full-Stack Healthcare Platform

Une plateforme complète de gestion de rendez-vous médicaux construite avec React, TypeScript, Express.js, PostgreSQL et intégration Stripe.

## 📋 Table des matières

- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [API Documentation](#api-documentation)
- [Dashboards](#dashboards)
- [Sécurité](#sécurité)
- [Déploiement](#déploiement)

## 🏗️ Architecture

### Vue d'ensemble

```
┌─────────────────────┐
│  React Frontend     │  (Port 3001)
│  - TypeScript       │
│  - Redux State      │
│  - Responsive UI    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Express API        │  (Port 3000)
│  - JWT Auth         │
│  - RESTful Routes   │
│  - Business Logic   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL DB      │
│  - Prisma ORM       │
│  - Complex Relations│
│  - Full ACID        │
└─────────────────────┘
```

### Modèle de données

La base de données contient les entités principales:

- **User** (Base) - Tous les utilisateurs du système
- **Patient** - Profils patient avec ID unique GeniDoc
- **Doctor** - Profils docteur avec licence et spécialité
- **Admin** - Administrateurs du système
- **Appointment** - Rendez-vous médicaux
- **Payment** - Historique des paiements Stripe
- **Consultation** - Données de consultation
- **Notification** - Système de notifications
- **DoctorSchedule** - Horaires des docteurs
- **AuditLog** - Logs de conformité

## 🛠️ Technologies

| Layer                | Technologies            | Version     |
| -------------------- | ----------------------- | ----------- |
| **Frontend**         | React, TypeScript, Vite | 18+, 5+, 4+ |
| **Frontend State**   | Redux Toolkit           | 1.9+        |
| **Frontend HTTP**    | Axios                   | 1.3+        |
| **Backend**          | Express.js, TypeScript  | 4.18+, 5+   |
| **Database**         | PostgreSQL, Prisma      | 14+, 5+     |
| **Authentication**   | JWT, bcryptjs           | -, 2.4+     |
| **Payments**         | Stripe API              | Latest      |
| **Email**            | SendGrid                | Latest      |
| **Real-time**        | Socket.io               | 4.5+        |
| **Containerization** | Docker, Docker Compose  | Latest      |

## 📦 Installation

### Prérequis

- Node.js 18+
- npm 9+ ou yarn
- Docker & Docker Compose
- PostgreSQL 14+ (ou utiliser Docker)

### Étapes

1. **Cloner le repository**

   ```bash
   git clone https://github.com/yourusername/genidoc.git
   cd genidoc
   ```

2. **Installer les dépendances du backend**

   ```bash
   npm install
   ```

3. **Installer les dépendances du frontend**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Copier les fichiers .env**

   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

5. **Initialiser la base de données**
   ```bash
   npx prisma migrate dev --name init
   ```

## ⚙️ Configuration

### Backend (.env)

```properties
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/genidoc_db

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=24h

# Stripe
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=genidoc-uploads
```

### Frontend (.env ou .env.local)

```properties
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxx
```

## 🚀 Lancement

### Mode Développement (Séparé)

**Terminal 1 - Backend:**

```bash
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Mode Développement (Docker)

```bash
docker-compose up -d
```

- API: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5432

### Mode Production

```bash
docker-compose -f docker-compose.yml up -d --build
```

## 📡 API Documentation

### Authentication Endpoints

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PATIENT"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Appointments Endpoints

#### Get Appointments

```http
GET /api/appointments
Authorization: Bearer {token}
```

**Query Parameters:**

- `status`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `doctorId`: Filter by doctor
- `startDate`: ISO date string
- `endDate`: ISO date string

#### Create Appointment

```http
POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "appointmentType": "VIDEO_CONSULTATION",
  "scheduledDateTime": "2024-01-15T10:00:00Z",
  "symptoms": "Fever and cough",
  "medicalHistory": "Diabetes"
}
```

#### Confirm Appointment (Doctor)

```http
POST /api/appointments/{id}/confirm
Authorization: Bearer {token}
```

#### Cancel Appointment

```http
POST /api/appointments/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Schedule conflict"
}
```

### Payments Endpoints

#### Create Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointmentId": "appointment_id"
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 5000
}
```

## 💻 Dashboards

### Patient Dashboard

- **Voir les rendez-vous**: Passés et à venir
- **Rechercher des docteurs**: Par spécialité, localisation, note
- **Prendre un rendez-vous**: Sélectionner date/heure, payer en ligne
- **Historique médical**: Documents, prescriptions, diagnostics
- **Profil**: Mettre à jour les informations personnelles
- **Notifications**: Confirmations, reminders

### Doctor Dashboard

- **Gérer l'emploi du temps**: Ajouter disponibilités
- **Rendez-vous**: Accepter/refuser, commencer la consultation
- **Patients**: Liste et profils
- **Revenus**: Historique des paiements et gains
- **Prescriptions**: Rédiger et envoyer des prescriptions

### Admin Dashboard

- **Analytics**: Statistiques d'utilisation
- **Utilisateurs**: Gérer patients et docteurs
- **Vérifications**: Approuver les docteurs
- **Transactions**: Historique des paiements
- **Rapports**: Générales et par docteur

## 🔐 Sécurité

### Authentification

- **JWT Tokens** - Tokens avec expiration 24h
- **Refresh Tokens** - Renouvellement sécurisé
- **Password Hashing** - bcryptjs avec 10 rounds
- **Token Blacklist** - Logout et révocation

### Protection des Données

- **HTTPS/TLS** - Chiffrement en transport
- **CORS** - Protection CSRF
- **Rate Limiting** - 100 requêtes/15 minutes
- **Input Validation** - Sanitization avec Zod
- **SQL Injection Protection** - Prisma parameterized queries

### Audit & Logging

- **AuditLog** - Tous les changements importants
- **IP Tracking** - Source des requêtes
- **Error Logging** - Avec Sentry en production

## 🐳 Docker

### Build

```bash
docker build -t genidoc-api .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/genidoc" \
  -e JWT_SECRET="secret" \
  genidoc-api
```

### Docker Compose

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Arrêter
docker-compose down
```

## 📊 Database Migrations

### Créer une nouvelle migration

```bash
npx prisma migrate dev --name add_new_feature
```

### Appliquer les migrations en production

```bash
npx prisma migrate deploy
```

### Seed la base (développement)

```bash
npx prisma db seed
```

### Ouvrir Prisma Studio

```bash
npx prisma studio
```

## 🚀 Déploiement

### Railway.app

```bash
railway link
railway variables
railway deploy
```

### Heroku

```bash
heroku create genidoc-app
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

### AWS (ECS + RDS)

1. Créer RDS PostgreSQL
2. Build image Docker
3. Push vers ECR
4. Créer ECS service
5. Configure Application Load Balancer

## 📝 Prisma Commands

```bash
# Synchronize database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open database GUI
npx prisma studio

# Create backup
pg_dump genidoc_db > backup.sql

# Restore backup
psql genidoc_db < backup.sql
```

## 📞 Support

Pour des problèmes ou questions:

1. Ouvrir une issue sur GitHub
2. Consulter la documentation: `/docs`
3. Vérifier les logs: `docker-compose logs -f`

## 📄 License

MIT License - Voir LICENSE.md

## 🙏 Credits

Développé avec ❤️ pour la plateforme de santé GeniDoc
