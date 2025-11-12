const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./genidoc.sqlite");

console.log("🔧 Création de la table notifications...\n");

// Créer la table notifications
const createTableSQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  genidocId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointmentId TEXT,
  read INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (genidocId) REFERENCES patient(genidocId),
  FOREIGN KEY (appointmentId) REFERENCES appointments(id)
)`;

db.run(createTableSQL, (err) => {
  if (err) {
    console.error("❌ Erreur création table:", err);
    return;
  }

  console.log("✅ Table notifications créée avec succès!");
  console.log("\n📋 Structure de la table:");
  console.log("  - id: Identifiant unique");
  console.log("  - genidocId: Patient concerné");
  console.log(
    "  - type: appointment_confirmed | appointment_cancelled | appointment_modified"
  );
  console.log("  - title: Titre de la notification");
  console.log("  - message: Message détaillé");
  console.log("  - appointmentId: Lien vers le rendez-vous");
  console.log("  - read: 0 = non lu, 1 = lu");
  console.log("  - createdAt: Date de création");

  // Créer des index
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_notifications_genidocId ON notifications(genidocId)",
    (err) => {
      if (err) console.error("Erreur index genidocId:", err);
    }
  );

  db.run(
    "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)",
    (err) => {
      if (err) console.error("Erreur index read:", err);
      else console.log("\n✅ Index créés pour optimiser les requêtes");
    }
  );

  db.close(() => {
    console.log("\n✅ Configuration terminée!\n");
  });
});
