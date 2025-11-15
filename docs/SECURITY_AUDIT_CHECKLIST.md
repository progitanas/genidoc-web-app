# 🔐 GeniDoc – Post-Refactor Security Checklist

> À exécuter après chaque refonte majeure du backend Express + SQLite.

---

## 1. Dépendances & build

- [ ] `npm install` puis `npm audit` (corriger vulnérabilités haute/critique).
- [ ] `npx depcheck` pour vérifier l’absence de dépendances inutilisées ou manquantes.
- [ ] Vérifier la présence d’un `package-lock.json` à jour et committé.
- [ ] Examiner les scripts npm (pas de commandes obsolètes ni dangereuses).

## 2. Configuration serveur

- [ ] `helmet` activé avec configuration minimale (HSTS optionnel en prod).
- [ ] `cors` explicitement configuré (origines autorisées, méthodes et headers).
- [ ] `express.json` limité (`limit: "1mb"` ou adapté).
- [ ] `multer` : taille max et filtre MIME vérifiés, répertoire uploads non exposé publiquement.
- [ ] Endpoint `/healthz` ou équivalent retournant l’état (HTTP 200 + info DB).

## 3. Authentification & sessions

- [ ] `JWT_SECRET` défini via variable d’environnement et suffisamment complexe.
- [ ] Tokens invalidés (`blacklisted_tokens`) purgés via tâche planifiée.
- [ ] Routes sensibles protégées par `authenticateToken` + `enforceRole` (basés sur `req.user`).
- [ ] Pas de logging de mots de passe/jetons (middleware de log vérifié).

## 4. Base de données

- [ ] Script de migration SQLite testé (`initDatabase(true)` sur environnement isolé).
- [ ] Sauvegarde automatique des fichiers `.sqlite` (plan de backup/doc).
- [ ] Accès concurrent géré (verrouillage au besoin ou documentation des limites).
- [ ] Données sensibles (mots de passe) toujours hashées (`bcrypt` / coût >= 10).

## 5. Surfaces d’attaque applicatives

- [ ] Validation des entrées (types, formats, longueurs) sur les endpoints critiques.
- [ ] Gestion des erreurs centralisée (pas de stack trace brute côté client).
- [ ] Politique d’upload : extensions interdites, antivirus/scan si nécessaire.
- [ ] Vérification des redirections/réponses JSON (pas d’injection de HTML).

## 6. Observabilité & alertes

- [ ] Logs structurés (pino/morgan) avec rotation ou export (file ou stdout).
- [ ] Surveillance des tentatives ratées de connexion (compteur + alertes > seuil).
- [ ] Notifications fonctionnelles : envoi de mails/sms testés ou désactivés proprement.
- [ ] Table `notifications` purge automatique (crons/documentation).

## 7. Processus

- [ ] Documentation mise à jour (`README`, `GETTING_STARTED`, plan de consolidation).
- [ ] Procédure d’onboarding : configuration `.env` + scripts d’initialisation.
- [ ] Plan de rollback en cas de régression (sauvegarde DB + version précédente).
- [ ] Dernier audit daté et stocké dans `/docs/audits/`.

---

✅ **Résultat attendu** : un rapport court (`docs/audits/YYYY-MM-DD.md`) listant les points conformes et les actions correctives ouvertes.
