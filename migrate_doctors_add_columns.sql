-- Migration script: Ajoute les colonnes manquantes à la table doctors
ALTER TABLE doctors ADD COLUMN firstName TEXT;
ALTER TABLE doctors ADD COLUMN lastName TEXT;
ALTER TABLE doctors ADD COLUMN phone TEXT;
-- (Optionnel) Ajoute bio si besoin
-- ALTER TABLE doctors ADD COLUMN bio TEXT;