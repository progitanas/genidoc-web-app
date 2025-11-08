#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Lire le fichier
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter les traductions FAQ à la section FR (avant la virgule de fermeture)
fr_faq = ''',
            "faq-genidoc-title": "Questions Fréquentes sur GeniDoc",
            "faq-genidoc-subtitle": "Trouvez les réponses aux questions les plus posées sur notre plateforme",
            "faq-q1": "Comment puis-je prendre un rendez-vous en ligne avec GeniDoc?",
            "faq-a1": "Vous pouvez prendre un rendez-vous en ligne en quelques étapes simples: 1) Recherchez votre médecin ou spécialité, 2) Consultez les créneaux disponibles, 3) Sélectionnez la date et l'heure préférées, 4) Confirmez votre rendez-vous. Vous recevrez une confirmation par email avec tous les détails.",
            "faq-q2": "Mes données médicales sont-elles sécurisées?",
            "faq-a2": "Oui, la sécurité de vos données est notre priorité absolue. GeniDoc utilise le chiffrement SSL/TLS, le stockage crypté et respecte les normes de conformité HIPAA et RGPD. Vos informations médicales ne sont jamais partagées sans votre consentement explicite.",
            "faq-q3": "Puis-je consulter un médecin par téléconsultation?",
            "faq-a3": "Oui! GeniDoc propose des consultations à distance par vidéo pour de nombreuses spécialités. Vous pouvez choisir la téléconsultation lors de la réservation de votre rendez-vous. Il suffit d'avoir une connexion Internet et une caméra web.",
            "faq-q4": "Comment puis-je accéder à mon dossier médical électronique?",
            "faq-a4": "Vous pouvez accéder à votre dossier médical électronique en vous connectant à votre compte GeniDoc. Vous y trouverez tous vos rapports médicaux, résultats d'analyse, historique des rendez-vous et ordonnances en un seul endroit, organisé et facile à consulter.",
            "faq-q5": "Quels sont les modes de paiement acceptés?",
            "faq-a5": "GeniDoc accepte plusieurs modes de paiement: cartes bancaires (Visa, Mastercard, American Express), virements bancaires, portefeuilles numériques (Apple Pay, Google Pay) et paiements à la clinique. Les consultations sont remboursables par les assurances maladie partenaires.",
            "faq-q6": "Comment puis-je contacter le support GeniDoc?",
            "faq-a6": "Notre équipe support est disponible 24/7 via plusieurs canaux: chat en direct sur notre plateforme, email (support@genidoc.ma), téléphone (+212 5XX XXX XXX) et réseaux sociaux. Nous nous engageons à répondre à vos questions dans les 2 heures."'''

# Remplacer dans la section FR
content = content.replace(
    '"faq-4-answer":\n              "Nous utilisons le chiffrement de bout en bout et respectons les normes RGPD. Vos données sont stockées dans des serveurs sécurisés et vous gardez le contrôle total de vos informations.",\n          },',
    '"faq-4-answer":\n              "Nous utilisons le chiffrement de bout en bout et respectons les normes RGPD. Vos données sont stockées dans des serveurs sécurisés et vous gardez le contrôle total de vos informations."' + fr_faq + ',\n          },',
)

print('✅ Traductions FAQ FR ajoutées')

# Ajouter les traductions FAQ à la section EN
en_faq = ''',
            "faq-genidoc-title": "Frequently Asked Questions about GeniDoc",
            "faq-genidoc-subtitle": "Find answers to the most asked questions about our platform",
            "faq-q1": "How can I book an appointment online with GeniDoc?",
            "faq-a1": "You can book an appointment online in a few simple steps: 1) Search for your doctor or specialty, 2) Check available slots in real-time, 3) Select your preferred date and time, 4) Confirm your appointment. You will receive instant confirmation by email with all details.",
            "faq-q2": "Is my medical data secure?",
            "faq-a2": "Yes, data security is our top priority. GeniDoc uses SSL/TLS encryption, encrypted storage and complies with HIPAA and GDPR standards. Your medical information is never shared without your explicit consent.",
            "faq-q3": "Can I consult a doctor via teleconsultation?",
            "faq-a3": "Yes! GeniDoc offers video consultations for many specialties. You can choose teleconsultation when booking your appointment. You only need an internet connection and a web camera.",
            "faq-q4": "How can I access my electronic medical record?",
            "faq-a4": "You can access your electronic medical record by logging into your GeniDoc account. You will find all your medical reports, test results, appointment history and prescriptions in one organized place.",
            "faq-q5": "What payment methods are accepted?",
            "faq-a5": "GeniDoc accepts multiple payment methods: credit cards (Visa, Mastercard, American Express), bank transfers, digital wallets (Apple Pay, Google Pay) and clinic payments. Consultations are reimbursable by partner health insurance companies.",
            "faq-q6": "How can I contact GeniDoc support?",
            "faq-a6": "Our support team is available 24/7 through multiple channels: live chat on our platform, email (support@genidoc.ma), phone (+212 5XX XXX XXX) and social media. We commit to answering your questions within 2 hours."'''

# Remplacer dans la section EN
content = content.replace(
    '"faq-4-answer":\n              "We use end-to-end encryption and comply with GDPR standards. Your data is stored on secure servers and you have full control of your information.",\n          },',
    '"faq-4-answer":\n              "We use end-to-end encryption and comply with GDPR standards. Your data is stored on secure servers and you have full control of your information."' + en_faq + ',\n          },',
)

print('✅ Traductions FAQ EN ajoutées')

# Écrire le fichier
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Toutes les traductions FAQ ajoutées')
