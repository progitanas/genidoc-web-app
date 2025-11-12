const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

// Fonction de hachage simple (SHA256)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const dbPath = path.join(__dirname, "genidoc.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🔧 Création de la table establishment_users...\n");

// Créer la table pour les utilisateurs des établissements
db.run(
  `
  CREATE TABLE IF NOT EXISTS establishment_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL,
    lastLogin TEXT,
    FOREIGN KEY (establishment_id) REFERENCES establishment(id) ON DELETE CASCADE
  )
`,
  (err) => {
    if (err) {
      console.error("❌ Erreur création table:", err);
      return;
    }

    console.log("✅ Table establishment_users créée\n");
    console.log("📝 Insertion des comptes administrateurs...\n");

    // Liste des établissements avec leurs identifiants
    const credentials = [
      { estId: 1, email: "chu.ibnrochd@genidoc.ma", password: "CasaIBR2025!" },
      {
        estId: 2,
        email: "clinique.ainsebaa@genidoc.ma",
        password: "AinSeb2025!",
      },
      {
        estId: 3,
        email: "cs.haymohammadi@genidoc.ma",
        password: "HayMoh2025!",
      },
      {
        estId: 4,
        email: "hopital.20aout@genidoc.ma",
        password: "Aout20-2025!",
      },
      { estId: 5, email: "clinique.iris@genidoc.ma", password: "Iris2025!" },
      { estId: 6, email: "chu.ibnsina@genidoc.ma", password: "RabatIBS2025!" },
      {
        estId: 7,
        email: "hopital.militaire@genidoc.ma",
        password: "MilRbt2025!",
      },
      { estId: 8, email: "cs.akkari@genidoc.ma", password: "Akkari2025!" },
      { estId: 9, email: "clinique.amal@genidoc.ma", password: "Amal2025!" },
      {
        estId: 10,
        email: "hopital.enfants@genidoc.ma",
        password: "Enfants2025!",
      },
      {
        estId: 11,
        email: "chu.mohammed6@genidoc.ma",
        password: "MarrakechM6!",
      },
      { estId: 12, email: "clinique.sud@genidoc.ma", password: "Sud2025!" },
      { estId: 13, email: "cs.gueliz@genidoc.ma", password: "Gueliz2025!" },
      {
        estId: 14,
        email: "hopital.ibntofail@genidoc.ma",
        password: "IbnTof2025!",
      },
      { estId: 15, email: "poly.nakhil@genidoc.ma", password: "Nakhil2025!" },
      { estId: 16, email: "chu.hassan2@genidoc.ma", password: "FesH2-2025!" },
      {
        estId: 17,
        email: "clinique.atlas@genidoc.ma",
        password: "AtlasFes2025!",
      },
      { estId: 18, email: "cs.bensouda@genidoc.ma", password: "Bensouda2025!" },
      {
        estId: 19,
        email: "hopital.ghassani@genidoc.ma",
        password: "Ghassani2025!",
      },
      { estId: 20, email: "poly.fes@genidoc.ma", password: "PolyFes2025!" },
      { estId: 21, email: "chi.mohammed6@genidoc.ma", password: "TangerM6!" },
      {
        estId: 22,
        email: "clinique.tangermed@genidoc.ma",
        password: "TangerMed25!",
      },
      {
        estId: 23,
        email: "cs.benimakada@genidoc.ma",
        password: "BeniMak2025!",
      },
      {
        estId: 24,
        email: "hopital.mohammed5@genidoc.ma",
        password: "TngM5-2025!",
      },
      { estId: 25, email: "poly.iberia@genidoc.ma", password: "Iberia2025!" },
      {
        estId: 26,
        email: "chu.hassan2.agadir@genidoc.ma",
        password: "AgadirH2!",
      },
      { estId: 27, email: "clinique.kindy@genidoc.ma", password: "Kindy2025!" },
      { estId: 28, email: "cs.talborjt@genidoc.ma", password: "Talborjt2025!" },
      {
        estId: 29,
        email: "hopital.militaire.agadir@genidoc.ma",
        password: "MilAgd2025!",
      },
      { estId: 30, email: "poly.baie@genidoc.ma", password: "Baie2025!" },
    ];

    let completed = 0;
    const total = credentials.length;

    credentials.forEach(async (cred, index) => {
      try {
        // Hasher le mot de passe avec SHA256
        const hashedPassword = hashPassword(cred.password);

        db.run(
          `INSERT INTO establishment_users (establishment_id, email, password, role, createdAt)
         VALUES (?, ?, ?, 'admin', ?)`,
          [cred.estId, cred.email, hashedPassword, new Date().toISOString()],
          (err) => {
            if (err) {
              console.error(`❌ Erreur pour ${cred.email}:`, err.message);
            } else {
              console.log(`✅ ${cred.email} créé`);
            }

            completed++;
            if (completed === total) {
              console.log(
                `\n🎉 ${completed}/${total} comptes créés avec succès !`
              );

              // Créer le compte admin super utilisateur
              createSuperAdmin();
            }
          }
        );
      } catch (error) {
        console.error(`❌ Erreur hash pour ${cred.email}:`, error);
        completed++;
      }
    });
  }
);

async function createSuperAdmin() {
  console.log("\n🔐 Création du compte super admin...");

  const hashedPassword = hashPassword("AdminGeniDoc2025!");

  db.run(
    `INSERT OR REPLACE INTO establishment_users (id, establishment_id, email, password, role, createdAt)
     VALUES (0, 0, 'admin@genidoc.ma', ?, 'superadmin', ?)`,
    [hashedPassword, new Date().toISOString()],
    (err) => {
      if (err) {
        console.error("❌ Erreur création super admin:", err);
      } else {
        console.log(
          "✅ Super admin créé : admin@genidoc.ma / AdminGeniDoc2025!"
        );
      }

      db.close(() => {
        console.log("\n✅ Configuration terminée !");
      });
    }
  );
}
