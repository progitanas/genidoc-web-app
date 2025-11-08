#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Lire le fichier
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer les textes FAQ par des data-i18n
replacements = {
    'Questions Fréquentes sur GeniDoc': '<span data-i18n="faq-genidoc-title">Questions Fréquentes sur GeniDoc</span>',
    'Trouvez les réponses aux questions les plus posées sur notre plateforme': '<span data-i18n="faq-genidoc-subtitle">Trouvez les réponses aux questions les plus posées sur notre plateforme</span>',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Maintenant remplacer les questions et réponses

# Question 1
old_q1 = '<span>Comment puis-je prendre un rendez-vous en ligne avec GeniDoc?</span>'
new_q1 = '<span data-i18n="faq-q1">Comment puis-je prendre un rendez-vous en ligne avec GeniDoc?</span>'
content = content.replace(old_q1, new_q1)

old_a1 = '<p>Vous pouvez prendre un rendez-vous en ligne en quelques étapes simples: 1) Recherchez votre médecin ou spécialité, 2) Consultez les créneaux disponibles, 3) Sélectionnez la date et l\'heure préférées, 4) Confirmez votre rendez-vous. Vous recevrez une confirmation par email avec tous les détails.</p>'
new_a1 = '<p data-i18n="faq-a1">Vous pouvez prendre un rendez-vous en ligne en quelques étapes simples: 1) Recherchez votre médecin ou spécialité, 2) Consultez les créneaux disponibles, 3) Sélectionnez la date et l\'heure préférées, 4) Confirmez votre rendez-vous. Vous recevrez une confirmation par email avec tous les détails.</p>'
content = content.replace(old_a1, new_a1)

# Question 2
old_q2 = '<span>Mes données médicales sont-elles sécurisées?</span>'
new_q2 = '<span data-i18n="faq-q2">Mes données médicales sont-elles sécurisées?</span>'
content = content.replace(old_q2, new_q2)

old_a2 = '<p>Oui, la sécurité de vos données est notre priorité absolue. GeniDoc utilise le chiffrement SSL/TLS, le stockage crypté et respecte les normes de conformité HIPAA et RGPD. Vos informations médicales ne sont jamais partagées sans votre consentement explicite.</p>'
new_a2 = '<p data-i18n="faq-a2">Oui, la sécurité de vos données est notre priorité absolue. GeniDoc utilise le chiffrement SSL/TLS, le stockage crypté et respecte les normes de conformité HIPAA et RGPD. Vos informations médicales ne sont jamais partagées sans votre consentement explicite.</p>'
content = content.replace(old_a2, new_a2)

# Question 3
old_q3 = '<span>Puis-je consulter un médecin par téléconsultation?</span>'
new_q3 = '<span data-i18n="faq-q3">Puis-je consulter un médecin par téléconsultation?</span>'
content = content.replace(old_q3, new_q3)

old_a3 = '<p>Oui! GeniDoc propose des consultations à distance par vidéo pour de nombreuses spécialités. Vous pouvez choisir la téléconsultation lors de la réservation de votre rendez-vous. Il suffit d\'avoir une connexion Internet et une caméra web.</p>'
new_a3 = '<p data-i18n="faq-a3">Oui! GeniDoc propose des consultations à distance par vidéo pour de nombreuses spécialités. Vous pouvez choisir la téléconsultation lors de la réservation de votre rendez-vous. Il suffit d\'avoir une connexion Internet et une caméra web.</p>'
content = content.replace(old_a3, new_a3)

# Question 4
old_q4 = '<span>Comment puis-je accéder à mon dossier médical électronique?</span>'
new_q4 = '<span data-i18n="faq-q4">Comment puis-je accéder à mon dossier médical électronique?</span>'
content = content.replace(old_q4, new_q4)

old_a4 = '<p>Vous pouvez accéder à votre dossier médical électronique en vous connectant à votre compte GeniDoc. Vous y trouverez tous vos rapports médicaux, résultats d\'analyse, historique des rendez-vous et ordonnances en un seul endroit, organisé et facile à consulter.</p>'
new_a4 = '<p data-i18n="faq-a4">Vous pouvez accéder à votre dossier médical électronique en vous connectant à votre compte GeniDoc. Vous y trouverez tous vos rapports médicaux, résultats d\'analyse, historique des rendez-vous et ordonnances en un seul endroit, organisé et facile à consulter.</p>'
content = content.replace(old_a4, new_a4)

# Question 5
old_q5 = '<span>Quels sont les modes de paiement acceptés?</span>'
new_q5 = '<span data-i18n="faq-q5">Quels sont les modes de paiement acceptés?</span>'
content = content.replace(old_q5, new_q5)

old_a5 = '<p>GeniDoc accepte plusieurs modes de paiement: cartes bancaires (Visa, Mastercard, American Express), virements bancaires, portefeuilles numériques (Apple Pay, Google Pay) et paiements à la clinique. Les consultations sont remboursables par les assurances maladie partenaires.</p>'
new_a5 = '<p data-i18n="faq-a5">GeniDoc accepte plusieurs modes de paiement: cartes bancaires (Visa, Mastercard, American Express), virements bancaires, portefeuilles numériques (Apple Pay, Google Pay) et paiements à la clinique. Les consultations sont remboursables par les assurances maladie partenaires.</p>'
content = content.replace(old_a5, new_a5)

# Question 6
old_q6 = '<span>Comment puis-je contacter le support GeniDoc?</span>'
new_q6 = '<span data-i18n="faq-q6">Comment puis-je contacter le support GeniDoc?</span>'
content = content.replace(old_q6, new_q6)

old_a6 = '<p>Notre équipe support est disponible 24/7 via plusieurs canaux: chat en direct sur notre plateforme, email (support@genidoc.ma), téléphone (+212 5XX XXX XXX) et réseaux sociaux. Nous nous engageons à répondre à vos questions dans les 2 heures.</p>'
new_a6 = '<p data-i18n="faq-a6">Notre équipe support est disponible 24/7 via plusieurs canaux: chat en direct sur notre plateforme, email (support@genidoc.ma), téléphone (+212 5XX XXX XXX) et réseaux sociaux. Nous nous engageons à répondre à vos questions dans les 2 heures.</p>'
content = content.replace(old_a6, new_a6)

# Écrire le fichier
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ FAQ mise à jour avec data-i18n')
