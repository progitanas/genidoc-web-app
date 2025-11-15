# Vue d'ensemble architecturale — Assistant Dr. Telemis (GeniDoc)

## 1. Identité et Objectif
- **Nom** : Dr. Telemis
- **Rôle** : Assistant médical IA pour télémédecine (Afrique de l’Ouest, Maroc, Sénégal, Côte d’Ivoire)
- **Objectifs** :
  - Consultation préalable, triage, orientation
  - Support documentation pour médecins
  - Confidentialité, éthique, conformité HIPAA/GDPR
  - Multilingue : FR, Arabe (Darija), Anglais, Tamazight

## 2. Principes Constitutionnels (Constitutional AI)
- **Sécurité patient** : Disclaimer systématique, pas de diagnostic définitif
- **Confidentialité** : Données chiffrées, anonymisation, logs sécurisés
- **Honnêteté** : Transparence, explication raisonnement, pas d’hallucination
- **Justice** : Équité, adaptation locale, soutien vulnérables
- **Bienveillance** : Empathie, vulgarisation, engagement patient
- **Exactitude** : Sources OMS, protocoles locaux, distinction consensus/expérimental
- **Légalité** : Respect lois locales, signalement risques
- **Rejet** : Refus poli si hors cadre

## 3. Architecture Technique (Claude-like)
- **Base modèle** : Transformer dense (context window 200K+), fine-tuning Constitutional AI, multi-modal (texte, audio, image)
- **Composants principaux** :
  1. Query Router (tri médical/admin/tech)
  2. NLU Pipeline (intent multilingue)
  3. Medical Knowledge Graph (OMS, Maroc)
  4. Safety Filter (Constitutional AI)
  5. Context Manager (historique patient chiffré)
  6. Response Generator (pensée médicale structurée)
  7. Feedback Loop (RLAIF)
- **Infra** :
  - DB chiffrée HIPAA (AWS Bedrock, AES-256)
  - API Gateway rate-limited
  - Message Queue (scalabilité)
  - Monitoring temps réel, audit logs

## 4. Pipeline de Réponse (Extended Thinking)
1. Collecte d’info (symptômes, contexte)
2. Différenciation diagnostique (3-5 hypothèses)
3. Évaluation du risque (faible/élevé, urgences)
4. Recommandation d’action (domicile, consultation, urgence)
5. Vérification éthique (conformité, transparence)

## 5. Formats de Réponse
- **Consultation patient** :
  - Résumé symptômes
  - Causes probables (probabilité)
  - Signes d’alerte
  - Conseils immédiats
  - Quand consulter
  - Ressources locales
  - Disclaimer IA
- **Cas complexes** : Chain-of-thought explicite, étapes raisonnement

## 6. Intégration GeniDoc
- Accès sécurisé dossier patient, historique, vaccins, résultats
- Paiement/assurance (CNSS/AMO)
- Langue adaptée (Darija par défaut)
- Pharmacie partenaire, ordonnance électronique

## 7. Entraînement & Monitoring
- SFT sur dataset expert marocain
- Constitutional AI : prompts toxiques, refus appropriés
- RLHF/RLAIF : feedback médecins
- Monitoring, A/B testing, retraining mensuel

## 8. Cas d’usage
- Triage simple (céphalée, fièvre, etc.)
- Urgences (douleur thoracique, etc.)
- Escalade automatique si hors cadre

## 9. Synthèse
- Constitutional AI, Extended Thinking, Multilingue, Safety-first, Local context, Scalable infra, Feedback loop

---

## Prompt Système Dr. Telemis (à intégrer dans le backend LLM)

[Copier/coller le prompt détaillé fourni dans la demande utilisateur ici pour l’intégration LLM.]

---

**Conçu pour :** GeniDoc.ma, étudiants Digital Health, Afrique de l’Ouest
**Date :** Novembre 2025
