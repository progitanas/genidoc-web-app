const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "genidoc.sqlite");
const db = new sqlite3.Database(dbPath);

const REQUIRED_COLUMNS = [
  { name: "appointmentNumber", definition: "TEXT" },
  { name: "fullName", definition: "TEXT" },
  { name: "email", definition: "TEXT" },
  { name: "phone", definition: "TEXT" },
  { name: "service", definition: "TEXT" },
  { name: "consultationType", definition: "TEXT" },
  { name: "date", definition: "TEXT" },
  { name: "time", definition: "TEXT" },
  { name: "mode", definition: "TEXT" },
  { name: "notes", definition: "TEXT" },
  { name: "status", definition: "TEXT" },
  { name: "patientId", definition: "TEXT" },
  { name: "doctorId", definition: "TEXT" },
  { name: "userId", definition: "TEXT" },
  { name: "facilityId", definition: "TEXT" },
  { name: "appointmentType", definition: "TEXT" },
  { name: "scheduledDateTime", definition: "TEXT" },
  { name: "establishment_id", definition: "TEXT" },
  { name: "establishment_name", definition: "TEXT" },
  { name: "establishment_ville", definition: "TEXT" },
  { name: "establishment_specialite", definition: "TEXT" },
  { name: "genidocId", definition: "TEXT" },
  { name: "createdAt", definition: "TEXT" },
  { name: "updatedAt", definition: "TEXT" },
];

function ensureColumns() {
  db.all("PRAGMA table_info(appointments)", [], (err, existing) => {
    if (err) {
      console.error("❌ Unable to read appointments schema:", err);
      process.exit(1);
    }

    const existingNames = new Set((existing || []).map((col) => col.name));
    console.log("📋 Colonnes actuelles:", Array.from(existingNames).join(", "));

    const pending = REQUIRED_COLUMNS.filter(
      (column) => !existingNames.has(column.name)
    );

    if (pending.length === 0) {
      console.log("✅ Toutes les colonnes requises sont déjà présentes.");
      process.exit(0);
    }

    console.log(
      "⚙️  Ajout des colonnes manquantes:",
      pending.map((c) => c.name).join(", ")
    );

    let failures = 0;

    db.serialize(() => {
      pending.forEach((column) => {
        const sql = `ALTER TABLE appointments ADD COLUMN ${column.name} ${column.definition}`;
        db.run(sql, (alterErr) => {
          if (alterErr) {
            failures += 1;
            console.error(
              `❌ Impossible d'ajouter ${column.name}: ${alterErr.message}`
            );
          } else {
            console.log(`✅ Colonne ${column.name} ajoutée.`);
          }
        });
      });
    });

    db.close((closeErr) => {
      if (closeErr) {
        console.error("❌ Erreur lors de la fermeture de la DB:", closeErr);
      } else {
        console.log("🏁 Migration terminée.");
      }
      process.exit(failures ? 1 : 0);
    });
  });
}

ensureColumns();

