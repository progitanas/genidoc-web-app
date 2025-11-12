# 🚀 GeniDoc Full-Stack - Guide Complet de Mise en Route

## 📋 Vue d'ensemble

Cette version transforme GeniDoc d'une plateforme prototype en une **application enterprise-grade** avec:

✅ **Frontend React** - Interface moderne et responsive  
✅ **Backend TypeScript** - API sécurisée et scalable  
✅ **PostgreSQL** - Base de données persistante et relationnelle  
✅ **Authentification JWT** - Sessions sécurisées  
✅ **Paiements Stripe** - Intégration de paiements réels  
✅ **Architecture UML** - Diagrammes système complets  
✅ **Docker** - Déploiement facile et reproductible

---

## 🔧 Installation Rapide (5 minutes)

### Option 1: Script automatisé

**Windows (PowerShell):**

```powershell
# Exécuter en tant que administrateur
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\setup.ps1
```

**macOS / Linux:**

```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Installation

**1. Cloner et naviguer:**

```bash
git clone <your-repo-url>
cd genidoc-fullstack
```

**2. Installer les dépendances backend:**

```bash
npm install
```

**3. Installer les dépendances frontend:**

```bash
cd frontend
npm install
cd ..
```

**4. Configurer la base de données:**

```bash
npx prisma migrate dev --name init
```

---

## ⚙️ Configuration Détaillée

### Étape 1: Créer la base de données

#### Avec Docker:

```bash
docker run --name genidoc-postgres \
  -e POSTGRES_USER=genidoc_user \
  -e POSTGRES_PASSWORD=genidoc_password \
  -e POSTGRES_DB=genidoc_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Avec PostgreSQL local:

```bash
# macOS (avec Homebrew)
brew install postgresql
brew services start postgresql

# Linux
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Télécharger depuis https://www.postgresql.org/download/windows/
```

**Créer la base:**

```bash
createuser genidoc_user
createdb -O genidoc_user genidoc_db
psql -U genidoc_user -d genidoc_db
```

### Étape 2: Configurer .env

**Backend `.env`:**

```properties
# === SERVEUR ===
NODE_ENV=development
PORT=3000

# === DATABASE ===
DATABASE_URL="postgresql://genidoc_user:genidoc_password@localhost:5432/genidoc_db"

# === JWT (IMPORTANT: Changer en production!)
JWT_SECRET=dev_ultra_secret_key_change_in_production_2024
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=dev_ultra_secret_refresh_key_2024
JWT_REFRESH_EXPIRATION=7d

# === STRIPE (Optionnel - Mode test)
STRIPE_PUBLIC_KEY=pk_test_51234567890123456789
STRIPE_SECRET_KEY=sk_test_51234567890123456789
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890

# === SENDGRID (Optionnel)
SENDGRID_API_KEY=SG.test_key_123
SENDGRID_FROM_EMAIL=noreply@genidoc.local
```

**Frontend `frontend/.env.local`:**

```properties
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51234567890123456789
REACT_APP_ENVIRONMENT=development
```

### Étape 3: Initialiser la base de données

```bash
# Générer Prisma Client
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev --name init

# Vérifier avec Prisma Studio
npx prisma studio
```

---

## 🎯 Lancement du Développement

### Méthode 1: Serveurs séparés (Recommandé pour le dev)

**Terminal 1 - Backend:**

```bash
npm run dev
# API disponible à http://localhost:3000
# Hot reload activé avec nodemon
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App disponible à http://localhost:3001
# Hot reload avec Vite (très rapide)
```

### Méthode 2: Docker Compose (Tout-en-un)

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

**Accès:**

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api
- PostgreSQL: localhost:5432

---

## 🧪 Tester l'API

### 1. Créer un compte (Patient)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePassword123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "PATIENT"
  }'
```

**Réponse:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "patient@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "PATIENT"
  }
}
```

Sauvegarder le token: `TOKEN=eyJhbGciOiJIUzI1NiIs...`

### 2. Obtenir le profil utilisateur

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Récupérer les docteurs

```bash
curl http://localhost:3000/api/doctors?specialization=Cardiology \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Créer un rendez-vous

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "doctorId": "doctor-id-here",
    "appointmentType": "VIDEO_CONSULTATION",
    "scheduledDateTime": "2024-01-15T10:00:00Z",
    "symptoms": "Fever"
  }'
```

---

## 📊 Explorer la Base de Données

### Prisma Studio (Interface graphique)

```bash
npx prisma studio
# Accès à http://localhost:5555
```

Vous pouvez:

- 👁️ Voir toutes les données
- ✏️ Éditer les enregistrements
- ➕ Ajouter de nouvelles lignes
- 🔍 Filtrer et chercher

### Commande psql (Terminal)

```bash
# Se connecter à la BD
psql -U genidoc_user -d genidoc_db

# Lister les tables
\dt

# Voir le schéma
\d users

# Requête SQL
SELECT email, role, created_at FROM "User" ORDER BY created_at DESC LIMIT 10;

# Quitter
\q
```

---

## 🎨 Structure des Pages React

### Pages existantes à construire:

```
frontend/src/pages/
├── auth/
│   ├── LoginPage.tsx          # Connexion
│   ├── RegisterPage.tsx       # Inscription
│   └── ForgotPasswordPage.tsx # Réinitialiser mot de passe
│
├── patient/
│   ├── DashboardPage.tsx      # Tableau de bord patient
│   ├── SearchDoctorsPage.tsx  # Chercher des docteurs
│   ├── BookAppointmentPage.tsx# Réserver rendez-vous
│   ├── AppointmentsPage.tsx   # Mes rendez-vous
│   ├── ProfilePage.tsx        # Mon profil
│   └── PaymentHistoryPage.tsx # Historique des paiements
│
├── doctor/
│   ├── DashboardPage.tsx      # Tableau de bord docteur
│   ├── SchedulePage.tsx       # Gérer emploi du temps
│   ├── AppointmentsPage.tsx   # Mes rendez-vous
│   ├── ProfilePage.tsx        # Mon profil
│   └── EarningsPage.tsx       # Mes revenus
│
├── admin/
│   ├── DashboardPage.tsx      # Tableau de bord admin
│   ├── AnalyticsPage.tsx      # Analytics
│   ├── UsersPage.tsx          # Gestion utilisateurs
│   ├── DoctorsPage.tsx        # Gestion docteurs
│   └── TransactionsPage.tsx   # Historique transactions
│
└── common/
    ├── NotFoundPage.tsx
    └── ErrorPage.tsx
```

---

## 🔐 Sécurité en Production

### ⚠️ À faire avant le déploiement:

```bash
# 1. Générer des secrets forts
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 32  # SESSION_SECRET

# 2. Ajouter les vraies clés
STRIPE_PUBLIC_KEY=pk_live_xxx       # Clé publique Stripe
STRIPE_SECRET_KEY=sk_live_xxx       # Clé secrète Stripe

# 3. HTTPS activé
NODE_ENV=production

# 4. CORS restrictif
CORS_ORIGIN=https://yourdomaine.com

# 5. Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
```

### Checklist de sécurité:

- [ ] JWT_SECRET changé
- [ ] HTTPS activé
- [ ] CORS configuré
- [ ] Rate limiting activé
- [ ] Logging configuré
- [ ] HTTPS sur la base de données
- [ ] Backups configurés
- [ ] Monitoring activé (Sentry)

---

## 📦 Déploiement

### Option 1: Railway.app (Recommandé - très facile)

```bash
npm i -g @railway/cli
railway login
railway init
railway variables
railway up
```

### Option 2: Heroku

```bash
heroku create genidoc-app
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

### Option 3: Docker sur VPS

```bash
# Sur le serveur
docker-compose -f docker-compose.yml up -d --build

# Configurer Nginx en reverse proxy
# Ajouter SSL Let's Encrypt
```

---

## 📊 Base de Données - Vue d'ensemble

### Tables principales:

| Table              | Enregistrements       | Relations                        |
| ------------------ | --------------------- | -------------------------------- |
| **User**           | Tous les utilisateurs | 1-N Appointment, Notification    |
| **Patient**        | Patients              | N-1 User, 1-N Appointment        |
| **Doctor**         | Docteurs              | N-1 User, 1-N Appointment        |
| **Appointment**    | Rendez-vous           | N-1 Patient, Doctor; 1-N Payment |
| **Payment**        | Paiements Stripe      | N-1 Appointment                  |
| **DoctorSchedule** | Horaires docteur      | N-1 Doctor                       |
| **Notification**   | Notifications         | N-1 User                         |
| **AuditLog**       | Logs de conformité    | N-1 User                         |

### Clés étrangères critiques:

```sql
-- Patients liés aux utilisateurs
ALTER TABLE "Patient" ADD CONSTRAINT fk_patient_user
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE;

-- Appointments liés aux patients et docteurs
ALTER TABLE "Appointment" ADD CONSTRAINT fk_appointment_patient
  FOREIGN KEY (patientId) REFERENCES "Patient"(id) ON DELETE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT fk_appointment_doctor
  FOREIGN KEY (doctorId) REFERENCES "Doctor"(id) ON DELETE CASCADE;

-- Payments liés aux appointments
ALTER TABLE "Payment" ADD CONSTRAINT fk_payment_appointment
  FOREIGN KEY (appointmentId) REFERENCES "Appointment"(id) ON DELETE CASCADE;
```

---

## 🐛 Troubleshooting

### Erreur: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
npm install @prisma/client
```

### Erreur: "EADDRINUSE: address already in use :::3000"

```bash
# Trouver et tuer le processus
npx kill-port 3000

# Ou sur Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Erreur: "Database connection refused"

```bash
# Vérifier que PostgreSQL est running
psql -U genidoc_user -d genidoc_db

# Vérifier DATABASE_URL dans .env
echo $DATABASE_URL

# Avec Docker
docker ps | grep postgres
```

### Erreur: "CORS error"

- Vérifier `CORS_ORIGIN` dans .env
- Vérifier que le frontend fait les requêtes au bon domaine
- Ajouter `credentials: 'include'` aux requêtes axios

---

## 📚 Documentation Complète

Voir les fichiers dans `/docs`:

- `ARCHITECTURE.md` - Vue d'ensemble système
- `DATABASE.md` - Schéma détaillé
- `API.md` - Endpoints complets
- `DEPLOYMENT.md` - Guide de déploiement

---

## 🎯 Étapes Suivantes

### Phase 1: Développement Local ✅

- [x] Setup base de données
- [x] Backend API
- [x] Frontend React
- [ ] **Prochaine: Implémenter les dashboards**

### Phase 2: Fonctionnalités (À faire)

- [ ] Stripe payments
- [ ] SendGrid emails
- [ ] Real-time avec Socket.io
- [ ] File uploads AWS S3

### Phase 3: Déploiement

- [ ] CI/CD GitHub Actions
- [ ] Railway/Heroku
- [ ] Domain + SSL

---

## 💬 Support

Pour de l'aide:

1. 📖 Vérifier `/docs`
2. 🐛 Voir les logs: `docker-compose logs -f`
3. 🔍 Vérifier .env
4. 🆘 Ouvrir une issue GitHub

---

**Bon codage! 🚀**
