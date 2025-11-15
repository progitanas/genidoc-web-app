-- Vérifie la cohérence des données médecin pour le dashboard GeniDoc
-- Remplacez 'DOCTOR_USER_ID' par la valeur de doctorId (userId) à tester

-- 1. Vérifier que l'utilisateur existe et est bien médecin
SELECT * FROM users WHERE id = 'DOCTOR_USER_ID' AND role = 'DOCTOR';

-- 2. Vérifier que la fiche médecin existe et est liée à ce userId
SELECT * FROM doctors WHERE userId = 'DOCTOR_USER_ID';

-- 3. Vérifier que l'établissement est bien renseigné pour ce médecin
SELECT establishmentId FROM doctors WHERE userId = 'DOCTOR_USER_ID';

-- 4. Vérifier les rendez-vous liés à l'établissement du médecin
SELECT a.* FROM appointments a
WHERE a.establishment_id = (
  SELECT establishmentId FROM doctors WHERE userId = 'DOCTOR_USER_ID'
);
