const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "genidoc.sqlite");

console.log("🔄 Réinitialisation de la base de données...");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("✅ Ancienne base supprimée");
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erreur ouverture DB:", err.message);
    process.exit(1);
  }
  console.log("✅ Nouvelle base créée");
});

db.run(
  `CREATE TABLE patient (
    genidocId TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    birthdate TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`,
  (err) => {
    if (err) {
      console.error("❌ Erreur création table patient:", err.message);
    } else {
      console.log("✅ Table patient créée avec succès");
      console.log("   - Clé primaire: genidocId");
      console.log("   - Contrainte unique: email");
      console.log(
        "   - Champs obligatoires: genidocId, username, email, password"
      );
    }
  }
);

// Créer la table establishment
db.run(
  `CREATE TABLE establishment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    specialite TEXT,
    adresse TEXT,
    ville TEXT,
    quartier TEXT,
    latitude REAL,
    longitude REAL,
    telephone TEXT,
    site_web TEXT,
    resume TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) {
      console.error("❌ Erreur création table establishment:", err.message);
    } else {
      console.log("✅ Table establishment créée");
    }
  }
);

// Créer la table documents
db.run(
  `CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT,
    text TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) {
      console.error("❌ Erreur création table documents:", err.message);
    } else {
      console.log("✅ Table documents créée");
    }
  }
);

// Créer la table embeddings
db.run(
  `CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  )`,
  (err) => {
    if (err) {
      console.error("❌ Erreur création table embeddings:", err.message);
    } else {
      console.log(
        "✅ Table embeddings créée avec clé étrangère vers documents"
      );
    }
  }
);

// Créer des index pour optimiser les recherches
db.run(`CREATE INDEX idx_patient_email ON patient(email)`, (err) => {
  if (err) {
    console.error("❌ Erreur création index email:", err.message);
  } else {
    console.log("✅ Index créé sur patient.email");
  }
});

db.run(`CREATE INDEX idx_embeddings_doc ON embeddings(document_id)`, (err) => {
  if (err) {
    console.error("❌ Erreur création index embeddings:", err.message);
  } else {
    console.log("✅ Index créé sur embeddings.document_id");
  }
});

// Fermer la connexion
db.close((err) => {
  if (err) {
    console.error("❌ Erreur fermeture DB:", err.message);
  } else {
    console.log("\n🎉 Base de données réinitialisée avec succès !");
    console.log("📁 Fichier: genidoc.sqlite");
    console.log("\n📝 Structure créée:");
    console.log("   1. patient (genidocId PK, email UNIQUE)");
    console.log("   2. establishment (id PK)");
    console.log("   3. documents (id PK)");
    console.log("   4. embeddings (id PK, document_id FK → documents)");
    console.log(
      "\n⚠️  Vous pouvez maintenant redémarrer le serveur avec: npm start"
    );
  }
});
