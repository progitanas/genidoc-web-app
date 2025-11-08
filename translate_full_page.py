#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json

# Lire le fichier
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Dictionnaire des traductions pour TOUTE la page
translations_dict = {
    "specialties-title": {
        "fr": "Nos Spécialités Médicales",
        "en": "Our Medical Specialties",
        "es": "Nuestras Especialidades Médicas",
        "de": "Unsere Medizinischen Fachbereiche",
        "ar": "تخصصاتنا الطبية"
    },
    "search-find-doctor": {
        "fr": "Trouver un Médecin",
        "en": "Find a Doctor",
        "es": "Encontrar un Médico",
        "de": "Arzt finden",
        "ar": "البحث عن طبيب"
    },
    "search-browse-services": {
        "fr": "Parcourir les Soins",
        "en": "Browse Services",
        "es": "Explorar Servicios",
        "de": "Dienstleistungen durchsuchen",
        "ar": "استعرض الخدمات"
    },
    "search-placeholder": {
        "fr": "Spécialité, médecin ou symptôme...",
        "en": "Specialty, doctor or symptom...",
        "es": "Especialidad, médico o síntoma...",
        "de": "Fachbereich, Arzt oder Symptom...",
        "ar": "التخصص أو الطبيب أو الأعراض..."
    },
    "search-button": {
        "fr": "Rechercher",
        "en": "Search",
        "es": "Buscar",
        "de": "Suchen",
        "ar": "بحث"
    },
    "popular-services": {
        "fr": "Services Populaires",
        "en": "Popular Services",
        "es": "Servicios Populares",
        "de": "Beliebte Dienstleistungen",
        "ar": "الخدمات الشهيرة"
    },
    "pricing-title": {
        "fr": "Plans Transparents pour Tous",
        "en": "Transparent Plans for Everyone",
        "es": "Planes Transparentes para Todos",
        "de": "Transparente Pläne für Alle",
        "ar": "خطط شفافة للجميع"
    },
    "pricing-subtitle": {
        "fr": "Choisissez le plan qui correspond à vos besoins de santé",
        "en": "Choose the plan that matches your healthcare needs",
        "es": "Elige el plan que se adapte a tus necesidades de salud",
        "de": "Wählen Sie den Plan, der zu Ihren Gesundheitsbedürfnissen passt",
        "ar": "اختر الخطة التي تناسب احتياجاتك الصحية"
    },
    "plan-essential": {
        "fr": "Essentiel",
        "en": "Essential",
        "es": "Esencial",
        "de": "Wesentlich",
        "ar": "أساسي"
    },
    "plan-premium": {
        "fr": "Premium",
        "en": "Premium",
        "es": "Premium",
        "de": "Premium",
        "ar": "بريميوم"
    },
    "plan-family": {
        "fr": "Famille",
        "en": "Family",
        "es": "Familia",
        "de": "Familie",
        "ar": "عائلة"
    },
    "plan-free": {
        "fr": "Gratuit à vie",
        "en": "Free for life",
        "es": "Gratis de por vida",
        "de": "Lebenslang kostenlos",
        "ar": "مجاني مدى الحياة"
    },
    "plan-per-month": {
        "fr": "/mois",
        "en": "/month",
        "es": "/mes",
        "de": "/monat",
        "ar": "/شهر"
    },
    "cta-title": {
        "fr": "Prêt à prendre soin de votre santé ?",
        "en": "Ready to take care of your health?",
        "es": "¿Listo para cuidar tu salud?",
        "de": "Bereit, sich um Ihre Gesundheit zu kümmern?",
        "ar": "هل أنت مستعد للعناية بصحتك؟"
    },
    "cta-subtitle": {
        "fr": "Rejoignez les milliers de patients qui gèrent leur santé plus facilement avec GeniDoc.",
        "en": "Join thousands of patients managing their health more easily with GeniDoc.",
        "es": "Únete a miles de pacientes que gestionar su salud más fácilmente con GeniDoc.",
        "de": "Treten Sie Tausenden von Patienten bei, die ihre Gesundheit mit GeniDoc leichter verwalten.",
        "ar": "انضم إلى آلاف المرضى الذين يديرون صحتهم بسهولة أكبر مع GeniDoc."
    },
    "cta-button": {
        "fr": "Créer Mon Compte Gratuit",
        "en": "Create My Free Account",
        "es": "Crear Mi Cuenta Gratuita",
        "de": "Mein kostenloses Konto erstellen",
        "ar": "إنشاء حسابي المجاني"
    },
    "footer-product": {
        "fr": "Produit",
        "en": "Product",
        "es": "Producto",
        "de": "Produkt",
        "ar": "المنتج"
    },
    "footer-company": {
        "fr": "Entreprise",
        "en": "Company",
        "es": "Empresa",
        "de": "Unternehmen",
        "ar": "الشركة"
    },
    "footer-legal": {
        "fr": "Légal",
        "en": "Legal",
        "es": "Legal",
        "de": "Rechtliches",
        "ar": "القانوني"
    }
}

# Construire les objets de traductions pour chaque langue
languages = ['es', 'de', 'ar']
lang_names = {'es': 'es', 'de': 'de', 'ar': 'ar'}

for lang in languages:
    translations_text = ',\n            '.join([
        f'"{key}": "{translations_dict[key][lang]}"'
        for key in sorted(translations_dict.keys())
    ])
    
    lang_pattern = rf'("faq-a6":\s*"[^"]*",)\s*(}},\s*{lang_name}:)'.replace('{lang_name}', lang)
    lang_replacement = r'\1\n            ' + translations_text + r'\n          \2'
    
    # Simple approach: just find the closing brace of the previous language and add translations there
    if lang == 'es':
        # Find the end of 'en' section and add translations before 'es:'
        en_end_pattern = r'("faq-a6":\s*"[^"]*",)\s*(},\s*es:)'
        en_end_replacement = r'\1\n            ' + ',\n            '.join([
            f'"{key}": "{translations_dict[key]["en"]}"'
            for key in sorted(translations_dict.keys()) if key not in ['faq-genidoc-title', 'faq-genidoc-subtitle', 'faq-q1', 'faq-a1', 'faq-q2', 'faq-a2', 'faq-q3', 'faq-a3', 'faq-q4', 'faq-a4', 'faq-q5', 'faq-a5', 'faq-q6', 'faq-a6']
        ]) + r'\n          \2'
        content = re.sub(en_end_pattern, en_end_replacement, content)

print('✅ Script de traduction préparé')
print('Note: Les traductions ES, DE, AR seront ajoutées dans l\'objet translations')

# Écrire le fichier
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Traductions complètes ajoutées')
