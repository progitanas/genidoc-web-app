const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./genidoc.sqlite");

console.log("🔍 Test du système de rendez-vous\n");

// Vérifier les établissements
db.all(
  "SELECT id, nom, ville FROM establishment LIMIT 5",
  [],
  (err, establishments) => {
    if (err) {
      console.error("❌ Erreur:", err);
      return;
    }

    console.log("📊 Établissements dans la base:");
    establishments.forEach((est) => {
      console.log(`  - ID ${est.id}: ${est.nom} (${est.ville})`);
    });

    console.log("\n🔍 Création d'un rendez-vous test...");

    // Note: Les rendez-vous sont stockés dans un array en mémoire (appointments[])
    // pas dans SQLite. Ils sont perdus au redémarrage du serveur.

    console.log("\n⚠️  PROBLÈME IDENTIFIÉ:");
    console.log(
      "Les rendez-vous sont stockés dans un array JavaScript (en mémoire)"
    );
    console.log("Ils ne sont PAS sauvegardés dans SQLite");
    console.log('Solution: Créer une table "appointments" dans SQLite\n');

    db.close();
  }
);
