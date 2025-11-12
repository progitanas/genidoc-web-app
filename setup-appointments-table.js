const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./genidoc.sqlite");

console.log("🔧 Création de la table appointments...\n");

// Créer la table appointments
const createTableSQL = `
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  consultationType TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  mode TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'en attente',
  establishment_id INTEGER,
  establishment_name TEXT,
  establishment_ville TEXT,
  establishment_specialite TEXT,
  birthdate TEXT,
  company TEXT,
  genidocId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  FOREIGN KEY (establishment_id) REFERENCES establishment(id)
)`;

db.run(createTableSQL, (err) => {
  if (err) {
    console.error("❌ Erreur création table:", err);
    return;
  }

  console.log("✅ Table appointments créée avec succès!");
  console.log("\n📋 Structure de la table:");
  console.log("  - id: Identifiant unique");
  console.log("  - fullName, email, phone: Infos patient");
  console.log("  - service, date, time, mode: Détails RDV");
  console.log("  - status: en attente | confirmé | annulé");
  console.log("  - establishment_id: Lien vers établissement");
  console.log("  - establishment_*: Cache des infos établissement");
  console.log("  - genidocId: Lien vers patient (si connecté)");

  // Créer des index pour améliorer les performances
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_appointments_establishment ON appointments(establishment_id)",
    (err) => {
      if (err) console.error("Erreur index establishment:", err);
    }
  );

  db.run(
    "CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)",
    (err) => {
      if (err) console.error("Erreur index status:", err);
    }
  );

  db.run(
    "CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date)",
    (err) => {
      if (err) console.error("Erreur index date:", err);
      else console.log("\n✅ Index créés pour optimiser les requêtes");
    }
  );

  db.close(() => {
    console.log("\n✅ Configuration terminée!\n");
  });
});
