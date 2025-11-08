# 🏥 GeniDoc - Système de Prise de Rendez-vous

## 📝 Description
Système complet de gestion des rendez-vous médicaux avec interface utilisateur moderne et API REST.

## ✨ Fonctionnalités

### Frontend (Interface Patient)
- 📅 Prise de rendez-vous intuitive
- 🎨 Interface moderne et responsive
- 🌙 Mode sombre
- 📧 Génération automatique de fichiers ICS (calendrier)
- ✅ Validation en temps réel
- 🔔 Notifications toast

### Backend (API)
- 🚀 Serveur Express.js
- 📊 API REST complète
- ✅ Validation des données
- ⏰ Vérification des créneaux disponibles
- 📈 Statistiques en temps réel

### Administration
- 📋 Liste complète des rendez-vous
- 🔍 Recherche et filtrage
- ✏️ Modification des rendez-vous
- 🗑️ Suppression avec confirmation
- 📊 Tableau de bord avec statistiques

## 🛠️ Installation

### Prérequis
- Node.js (version 14 ou plus récente)
- npm

### Étapes d'installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Démarrer le serveur**
   ```bash
   npm start
   ```
   
   Ou pour le développement (avec auto-rechargement) :
   ```bash
   npm run dev
   ```

3. **Accéder à l'application**
   - Interface patient : http://localhost:3000
   - Interface admin : http://localhost:3000/admin

## 📡 API Endpoints

### Rendez-vous

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/appointments` | Liste tous les rendez-vous |
| GET | `/api/appointments/:id` | Récupère un rendez-vous spécifique |
| POST | `/api/appointments` | Crée un nouveau rendez-vous |
| PUT | `/api/appointments/:id` | Modifie un rendez-vous |
| DELETE | `/api/appointments/:id` | Supprime un rendez-vous |

### Créneaux disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/available-slots/:date` | Créneaux disponibles pour une date |

### Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Statistiques générales |

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
    --primary: #4D3AFF;      /* Couleur principale */
    --secondary: #00558C;    /* Couleur secondaire */
    --success: #27ae60;      /* Couleur succès */
    --danger: #e74c3c;       /* Couleur erreur */
}
```

### Services
Modifier la liste dans `appintment.html` :
```javascript
const services = [
    'Consultation générale',
    'Consultation spécialisée',
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