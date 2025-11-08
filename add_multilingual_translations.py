#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Lire le fichier
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Liste des replacements: (texte français, clé i18n, traductions)
replacements = [
    # Specialties section
    ('Key Features', 'specialties-title-en', {'en': 'Key Features', 'es': 'Características Principales', 'de': 'Hauptmerkmale', 'ar': 'المميزات الرئيسية'}),
    ('Discover what makes GeniDoc the healthcare platform of the future', 'specialties-subtitle', {'en': 'Discover what makes GeniDoc the healthcare platform of the future', 'es': 'Descubre qué hace que GeniDoc sea la plataforma de salud del futuro', 'de': 'Entdecke, was GeniDoc zur Gesundheitsplattform der Zukunft macht', 'ar': 'اكتشف ما يجعل GeniDoc منصة الرعاية الصحية للمستقبل'}),
    
    # Search tabs
    ('Trouver un Médecin', 'search-tab-doctors-fr', {'en': 'Find a Doctor', 'es': 'Encontrar un Médico', 'de': 'Arzt finden', 'ar': 'البحث عن طبيب'}),
    ('Parcourir les Soins', 'search-tab-services-fr', {'en': 'Browse Services', 'es': 'Explorar Servicios', 'de': 'Dienstleistungen durchsuchen', 'ar': 'استعرض الخدمات'}),
    
    # CTA button  
    ('Prêt à prendre soin de votre santé ?', 'cta-title', {'en': 'Ready to take care of your health?', 'es': '¿Listo para cuidar tu salud?', 'de': 'Bereit, sich um Ihre Gesundheit zu kümmern?', 'ar': 'هل أنت مستعد للعناية بصحتك؟'}),
    
    # Pricing section
    ('Plans Transparents pour Tous', 'pricing-title', {'en': 'Transparent Plans for Everyone', 'es': 'Planes Transparentes para Todos', 'de': 'Transparente Pläne für Alle', 'ar': 'خطط شفافة للجميع'}),
    
    # Footer sections
    ('Produit', 'footer-product', {'en': 'Product', 'es': 'Producto', 'de': 'Produkt', 'ar': 'المنتج'}),
    ('Entreprise', 'footer-company', {'en': 'Company', 'es': 'Empresa', 'de': 'Unternehmen', 'ar': 'الشركة'}),
    ('Légal', 'footer-legal', {'en': 'Legal', 'es': 'Legal', 'de': 'Rechtliches', 'ar': 'القانونية'}),
]

# D'abord, ajouter les traductions ES, DE, AR à l'objet translations
es_translations = ''',
            "specialties-title-en": "Características Principales",
            "specialties-subtitle": "Descubre qué hace que GeniDoc sea la plataforma de salud del futuro",
            "search-tab-doctors-fr": "Encontrar un Médico",
            "search-tab-services-fr": "Explorar Servicios",
            "cta-title": "¿Listo para cuidar tu salud?",
            "pricing-title": "Planes Transparentes para Todos",
            "footer-product": "Producto",
            "footer-company": "Empresa",
            "footer-legal": "Legal"'''

de_translations = ''',
            "specialties-title-en": "Hauptmerkmale",
            "specialties-subtitle": "Entdecke, was GeniDoc zur Gesundheitsplattform der Zukunft macht",
            "search-tab-doctors-fr": "Arzt finden",
            "search-tab-services-fr": "Dienstleistungen durchsuchen",
            "cta-title": "Bereit, sich um Ihre Gesundheit zu kümmern?",
            "pricing-title": "Transparente Pläne für Alle",
            "footer-product": "Produkt",
            "footer-company": "Unternehmen",
            "footer-legal": "Rechtliches"'''

ar_translations = ''',
            "specialties-title-en": "المميزات الرئيسية",
            "specialties-subtitle": "اكتشف ما يجعل GeniDoc منصة الرعاية الصحية للمستقبل",
            "search-tab-doctors-fr": "البحث عن طبيب",
            "search-tab-services-fr": "استعرض الخدمات",
            "cta-title": "هل أنت مستعد للعناية بصحتك؟",
            "pricing-title": "خطط شفافة للجميع",
            "footer-product": "المنتج",
            "footer-company": "الشركة",
            "footer-legal": "القانونية"'''

# Ajouter les traductions ES à la section ES
es_pattern = r'("footer-legal":\s*"Legal",\s*},\s*)(de:)'
es_replacement = r'\1},' + es_translations + r',\n          \2'

content = re.sub(es_pattern, es_replacement, content)

print('✅ Traductions ES ajoutées')

# Écrire le fichier
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Base de traductions complète créée')
