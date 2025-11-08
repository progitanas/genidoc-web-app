#!/usr/bin/env python3
"""
Script pour ajouter les traductions au FAQ GeniDoc
"""

import re

# Lire le fichier index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer les textes du FAQ par des versions avec data-i18n

# FAQ Title
content = content.replace(
    '<h2 id="faq-title" class="faq-title">Questions Fréquentes sur GeniDoc</h2>',
    '<h2 id="faq-title" class="faq-title" data-i18n="faq-genidoc-title">Questions Fréquentes sur GeniDoc</h2>'
)

# FAQ Subtitle
content = content.replace(
    '<p class="faq-subtitle">Trouvez les réponses aux questions les plus posées sur notre plateforme</p>',
    '<p class="faq-subtitle" data-i18n="faq-genidoc-subtitle">Trouvez les réponses aux questions les plus posées sur notre plateforme</p>'
)

# FAQ Item 1
content = content.replace(
    '<span>Comment puis-je prendre un rendez-vous en ligne avec GeniDoc?</span>',
    '<span data-i18n="faq-genidoc-q1">Comment puis-je prendre un rendez-vous en ligne avec GeniDoc?</span>',
    1  # Replace only first occurrence
)
content = content.replace(
    '<p>Vous pouvez prendre un rendez-vous en ligne en quelques étapes simples: 1) Recherchez votre médecin ou spécialité, 2) Consultez les créneaux disponibles, 3) Sélectionnez la date et l\'heure préférées, 4) Confirmez votre rendez-vous. Vous recevrez une confirmation par email avec tous les détails.</p>',
    '<p data-i18n="faq-genidoc-a1">Vous pouvez prendre un rendez-vous en ligne en quelques étapes simples: 1) Recherchez votre médecin ou spécialité, 2) Consultez les créneaux disponibles, 3) Sélectionnez la date et l\'heure préférées, 4) Confirmez votre rendez-vous. Vous recevrez une confirmation par email avec tous les détails.</p>',
    1  # Replace only first occurrence
)

# FAQ Item 2
content = content.replace(
    '<span>Mes données médicales sont-elles sécurisées?</span>',
    '<span data-i18n="faq-genidoc-q2">Mes données médicales sont-elles sécurisées?</span>',
    1
)
content = content.replace(
    '<p>Oui, la sécurité de vos données est notre priorité absolue. GeniDoc utilise le chiffrement SSL/TLS, le stockage crypté et respecte les normes de conformité HIPAA et RGPD. Vos informations médicales ne sont jamais partagées sans votre consentement explicite.</p>',
    '<p data-i18n="faq-genidoc-a2">Oui, la sécurité de vos données est notre priorité absolue. GeniDoc utilise le chiffrement SSL/TLS, le stockage crypté et respecte les normes de conformité HIPAA et RGPD. Vos informations médicales ne sont jamais partagées sans votre consentement explicite.</p>',
    1
)

# FAQ Item 3
content = content.replace(
    '<span>Puis-je consulter un médecin par téléconsultation?</span>',
    '<span data-i18n="faq-genidoc-q3">Puis-je consulter un médecin par téléconsultation?</span>',
    1
)
content = content.replace(
    '<p>Oui! GeniDoc propose des consultations à distance par vidéo pour de nombreuses spécialités. Vous pouvez choisir la téléconsultation lors de la réservation de votre rendez-vous. Il suffit d\'avoir une connexion Internet et une caméra web.</p>',
    '<p data-i18n="faq-genidoc-a3">Oui! GeniDoc propose des consultations à distance par vidéo pour de nombreuses spécialités. Vous pouvez choisir la téléconsultation lors de la réservation de votre rendez-vous. Il suffit d\'avoir une connexion Internet et une caméra web.</p>',
    1
)

# FAQ Item 4
content = content.replace(
    '<span>Comment puis-je accéder à mon dossier médical électronique?</span>',
    '<span data-i18n="faq-genidoc-q4">Comment puis-je accéder à mon dossier médical électronique?</span>',
    1
)
content = content.replace(
    '<p>Vous pouvez accéder à votre dossier médical électronique en vous connectant à votre compte GeniDoc. Vous y trouverez tous vos rapports médicaux, résultats d\'analyse, historique des rendez-vous et ordonnances en un seul endroit, organisé et facile à consulter.</p>',
    '<p data-i18n="faq-genidoc-a4">Vous pouvez accéder à votre dossier médical électronique en vous connectant à votre compte GeniDoc. Vous y trouverez tous vos rapports médicaux, résultats d\'analyse, historique des rendez-vous et ordonnances en un seul endroit, organisé et facile à consulter.</p>',
    1
)

# FAQ Item 5
content = content.replace(
    '<span>Quels sont les modes de paiement acceptés?</span>',
    '<span data-i18n="faq-genidoc-q5">Quels sont les modes de paiement acceptés?</span>',
    1
)
content = content.replace(
    '<p>GeniDoc accepte plusieurs modes de paiement: cartes bancaires (Visa, Mastercard, American Express), virements bancaires, portefeuilles numériques (Apple Pay, Google Pay) et paiements à la clinique. Les consultations sont remboursables par les assurances maladie partenaires.</p>',
    '<p data-i18n="faq-genidoc-a5">GeniDoc accepte plusieurs modes de paiement: cartes bancaires (Visa, Mastercard, American Express), virements bancaires, portefeuilles numériques (Apple Pay, Google Pay) et paiements à la clinique. Les consultations sont remboursables par les assurances maladie partenaires.</p>',
    1
)

# FAQ Item 6
content = content.replace(
    '<span>Comment puis-je contacter le support GeniDoc?</span>',
    '<span data-i18n="faq-genidoc-q6">Comment puis-je contacter le support GeniDoc?</span>',
    1
)
content = content.replace(
    '<p>Notre équipe support est disponible 24/7 via plusieurs canaux: chat en direct sur notre plateforme, email (support@genidoc.ma), téléphone (+212 5XX XXX XXX) et réseaux sociaux. Nous nous engageons à répondre à vos questions dans les 2 heures.</p>',
    '<p data-i18n="faq-genidoc-a6">Notre équipe support est disponible 24/7 via plusieurs canaux: chat en direct sur notre plateforme, email (support@genidoc.ma), téléphone (+212 5XX XXX XXX) et réseaux sociaux. Nous nous engageons à répondre à vos questions dans les 2 heures.</p>',
    1
)

# Écrire le fichier modifié
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ FAQ data-i18n attributes added!")
