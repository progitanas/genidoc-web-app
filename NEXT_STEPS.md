# 🚀 Plan de Consolidation GeniDoc

> Objectif : unifier le code existant, clarifier l'architecture réelle (Express + SQLite) et préparer une base saine avant d'ajouter de nouvelles fonctionnalités.

---

## 1. Backend – Stabilisation

- **Modulariser `server-enhanced.js`** : séparer authentification, rendez-vous, établissements et notifications dans des modules dédiés pour faciliter les tests.
- **Schéma SQLite** : documenter le schéma courant (`appointments`, `users`, `patients`, `establishments`, `notifications`, `payments`) et ajouter des migrations d'amorçage (`scripts/db/reset.js`).
- **Validation & erreurs** : introduire une couche de validation (ex. `zod` ou middleware custom) pour sécuriser les entrées et normaliser les réponses d'erreur.
- **Journalisation** : brancher `morgan`/`pino` pour centraliser les logs tout en continuant à masquer les secrets.
- **Tests API** : écrire une mini-suite de tests (`npm run test:api`) couvrant authentification, création/lecture/suppression de rendez-vous et notifications.

## 2. Frontend – Choisir une source unique

- **Inventaire** : lister les clients existants (`frontend/`, `genidoc-react/`, pages HTML statiques) et décider d'un client principal (suggestion : `frontend/` Vite + TS).
- **Nettoyage** : archiver ou supprimer les doublons HTML une fois le client retenu, conserver les assets utiles dans `static/`.
- **Connexion API** : mettre à jour le service HTTP du client retenu pour consommer les nouveaux endpoints (SQLite) et gérer l'authentification JWT.
- **Design system minimal** : consolider les styles (Tailwind ou CSS modules) pour éviter les divergences visuelles entre pages.

## 3. Documentation à jour

- **README** : refléter l'état réel (Express + SQLite, pas Prisma/Postgres) avec un guide d'installation court (`npm install`, `npm run dev`).
- **GETTING_STARTED** : ajouter une section "Modes" (développement local, Docker, scripts Windows) et préciser les prérequis (Node 18+, SQLite embarqué).
- **docs/ARCHITECTURE** : remplacer les diagrammes fictifs par une version réaliste (client unique → API Express → SQLite + fichiers uploads).
- **Changelog** : consigner les décisions majeures (abandon Prisma, simplification dépendances) pour éviter les régressions futures.

## 4. Ops & Qualité

- **CI minimale** : GitHub Actions ou équivalent pour lancer `npm test` et un linting (`npm run lint` à définir) sur chaque PR.
- **Sécurité** : activer `helmet`, `cors` configuré et limiter la taille des requêtes/upload côté Express.
- **Script de seed** : proposer un jeu de données de démonstration (users/admins/doctors) pour onboarding rapide.
- **Monitoring** : prévoir un `healthcheck` (`/healthz`) retournant l'état de la DB et du système de fichiers.

## 5. Décisions à cadrer

- **Base de données cible** : rester sur SQLite pour l'instant ou planifier une migration Postgres + Prisma plus tard.
- **Notifications & paiements** : confirmer si les intégrations Stripe/SendGrid sont toujours prévues ou reportées.
- **Roadmap mobile** : clarifier le statut des apps React Native (dossier `mobile/`) vs. web responsive.

---

📝 *Livrables recommandés :*

1. `docs/CONSOLIDATION_CHECKLIST.md` pour suivre l'avancement.
2. `docs/API_REFERENCE.md` décrivant les endpoints réellement disponibles.
3. `docker-compose.dev.yml` mis à jour (API + client choisi).

Ce plan permet de nettoyer l'existant avant de rouvrir des chantiers fonctionnels lourds (paiement, temps réel, mobile).
