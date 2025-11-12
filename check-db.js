const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./genidoc.sqlite");

console.log("🔍 Vérification de la base de données...\n");

// Liste des tables
db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, rows) => {
  if (err) {
    console.error("❌ Erreur:", err);
  } else {
    console.log("📊 Tables existantes:", rows.map((r) => r.name).join(", "));
  }

  // Vérifier la table establishment_users
  db.get(
    "SELECT COUNT(*) as count FROM establishment_users",
    [],
    (err, row) => {
      if (err) {
        console.error(
          "❌ Table establishment_users n'existe pas:",
          err.message
        );
      } else {
        console.log(`\n✅ Table establishment_users: ${row.count} comptes`);
      }

      // Vérifier l'utilisateur chu.ibnsina
      db.get(
        "SELECT * FROM establishment_users WHERE email = ?",
        ["chu.ibnsina@genidoc.ma"],
        (err, user) => {
          if (err) {
            console.error("❌ Erreur recherche utilisateur:", err.message);
          } else if (user) {
            console.log("\n✅ Utilisateur trouvé:");
            console.log("   Email:", user.email);
            console.log("   Establishment ID:", user.establishment_id);
            console.log("   Role:", user.role);
            console.log("   Active:", user.isActive);
          } else {
            console.log("\n❌ Utilisateur chu.ibnsina@genidoc.ma NON TROUVÉ");
          }

          db.close();
        }
      );
    }
  );
});
