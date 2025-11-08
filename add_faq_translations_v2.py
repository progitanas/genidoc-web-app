#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Lire le fichier
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter les traductions EN à la section EN
en_pattern = r'("cat-ai":\s*"Art & Design",)'
en_replacement = r'\1' + '\n  "faq-genidoc-title": "Frequently Asked Questions about GeniDoc",\n  "faq-genidoc-subtitle": "Find answers to the most asked questions about our platform",\n  "faq-q1": "How can I book an appointment online with GeniDoc?",\n  "faq-a1": "You can book an appointment online in a few simple steps: 1) Search for your doctor or specialty, 2) Check available slots in real-time, 3) Select your preferred date and time, 4) Confirm your appointment. You will receive instant confirmation by email with all details.",\n  "faq-q2": "Is my medical data secure?",\n  "faq-a2": "Yes, data security is our top priority. GeniDoc uses SSL/TLS encryption, encrypted storage and complies with HIPAA and GDPR standards. Your medical information is never shared without your explicit consent.",\n  "faq-q3": "Can I consult a doctor via teleconsultation?",\n  "faq-a3": "Yes! GeniDoc offers video consultations for many specialties. You can choose teleconsultation when booking your appointment. You only need an internet connection and a web camera.",\n  "faq-q4": "How can I access my electronic medical record?",\n  "faq-a4": "You can access your electronic medical record by logging into your GeniDoc account. You will find all your medical reports, test results, appointment history and prescriptions in one organized place.",\n  "faq-q5": "What payment methods are accepted?",\n  "faq-a5": "GeniDoc accepts multiple payment methods: credit cards (Visa, Mastercard, American Express), bank transfers, digital wallets (Apple Pay, Google Pay) and clinic payments. Consultations are reimbursable by partner health insurance companies.",\n  "faq-q6": "How can I contact GeniDoc support?",\n  "faq-a6": "Our support team is available 24/7 through multiple channels: live chat on our platform, email (support@genidoc.ma), phone (+212 5XX XXX XXX) and social media. We commit to answering your questions within 2 hours.",'

content = re.sub(en_pattern, en_replacement, content)

# Écrire le fichier
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Traductions FAQ EN ajoutées')
