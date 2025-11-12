const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "genidoc.sqlite");

if (!fs.existsSync(dbPath)) {
  console.log("❌ Base de données non trouvée:", dbPath);
  process.exit(1);
}

console.log("📂 Lecture de la base de données:", dbPath);
console.log("");

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("❌ Erreur ouverture DB:", err.message);
    process.exit(1);
  }
});

// Fonction pour lire une table
function readTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Fonction pour compter les lignes
function countRows(tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

async function exportToJSON() {
  try {
    const tables = ["patient", "establishment", "documents", "embeddings"];
    const data = {};

    console.log("📊 Contenu de la base de données:\n");

    for (const table of tables) {
      try {
        const count = await countRows(table);
        const rows = await readTable(table);
        data[table] = rows;

        console.log(`✅ Table: ${table}`);
        console.log(`   Nombre de lignes: ${count}`);

        if (count > 0 && table === "patient") {
          console.log(`   Données:`);
          rows.forEach((row, index) => {
            console.log(`   ${index + 1}. GeniDoc ID: ${row.genidocId}`);
            console.log(`      Username: ${row.username}`);
            console.log(`      Email: ${row.email}`);
            console.log(
              `      Date de naissance: ${row.birthdate || "Non renseignée"}`
            );
            console.log(`      Créé le: ${row.createdAt}`);
            console.log("");
          });
        }
        console.log("");
      } catch (err) {
        console.log(`⚠️  Table ${table}: ${err.message}\n`);
      }
    }

    // Exporter en JSON
    const jsonPath = path.join(__dirname, "database-export.json");
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");

    console.log("💾 Export JSON créé:", jsonPath);
    console.log("\n📋 Pour voir le JSON:");
    console.log("   cat database-export.json");
    console.log("   ou");
    console.log("   code database-export.json");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    db.close();
  }
}

exportToJSON();
