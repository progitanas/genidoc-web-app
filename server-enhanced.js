const express = require("express");
let io = null;
try {
  io = require("socket.io");
} catch (e) {}
let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (e) {}
const app = express();
const multer = require("multer");
const path = require("path");
const DB_FILE = path.join(__dirname, "genidoc.sqlite");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

// Helper to generate a unique GeniDoc ID (GD-XXXXXX)
function generateGenidocId() {
  // 6 random digits, zero-padded
  const num = Math.floor(100000 + Math.random() * 900000);
  return `GD-${num}`;
}

let dbType = process.env.DB_TYPE || "sqlite"; // "mysql" ou "sqlite"
let db = null;
let mysqlPool = null;
let mysql2 = null;
const sqlite3 = require("sqlite3").verbose();

// Alibaba Cloud RDS / MySQL config (exemple)
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || "rm-xxxxxx.mysql.rds.aliyuncs.com",
  user: process.env.MYSQL_USER || "genidoc",
  password: process.env.MYSQL_PASSWORD || "Alibaba2025!",
  database: process.env.MYSQL_DATABASE || "genidoc",
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

function initDatabaseMulti(recreate = false) {
  if (dbType === "mysql") {
    try {
      mysql2 = require("mysql2");
      mysqlPool = mysql2.createPool(MYSQL_CONFIG);
      db = {
        run: (sql, params = [], cb) => mysqlPool.query(sql, params, cb),
        get: (sql, params = [], cb) =>
          mysqlPool.query(sql, params, (err, rows) => cb(err, rows && rows[0])),
        all: (sql, params = [], cb) =>
          mysqlPool.query(sql, params, (err, rows) => cb(err, rows)),
      };
      console.log("✅ Connecté à MySQL (Alibaba Cloud/RDS)");
    } catch (e) {
      console.error(
        "❌ mysql2 non installé ou erreur de connexion, fallback SQLite",
        e
      );
      dbType = "sqlite";
    }
  }
  if (dbType === "sqlite") {
    db = new sqlite3.Database(DB_FILE);
    console.log("✅ Connecté à SQLite (local)");
  }
}
// Utiliser la nouvelle fonction d'init multi-DB
initDatabaseMulti(false);
if (dbType === "mysql") {
  // Appel de la fonction d'init MySQL/compatibilité
  const { initDatabaseCompat } = require("./init-mysql.js");
  initDatabaseCompat(false)
    .then(() => {
      console.log("✅ Schéma MySQL vérifié");
    })
    .catch((e) => {
      console.error("Erreur migration MySQL:", e);
    });
}

// --- DB Utility Functions (Promise wrappers for async/await) ---
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === "mysql") {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    } else {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    }
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === "mysql") {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    }
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === "mysql") {
      db.run(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    } else {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this);
      });
    }
  });
}

function mapAppointmentRow(row) {
  if (!row) return null;
  // Normalize status
  let status = row.status || "en attente";
  if (typeof status === "string") status = status.trim();
  // Normalize date/time
  let date =
    row.date ||
    (row.scheduledDateTime ? row.scheduledDateTime.slice(0, 10) : null);
  let time =
    row.time ||
    (row.scheduledDateTime ? row.scheduledDateTime.slice(11, 16) : null);
  // Normalize service/consultationType
  let service =
    row.service ||
    row.consultationType ||
    row.appointmentType ||
    "Consultation";
  // Normalize establishment fields
  let establishment = row.establishment_name || row.establishment || "";
  let ville = row.establishment_ville || row.ville || "";
  let specialite = row.establishment_specialite || row.specialite || "";
  return {
    id: row.id,
    appointmentNumber: row.appointmentNumber,
    fullName: row.fullName || row.patientName || row.patient || "Patient",
    email: row.email || row.patientEmail || "",
    phone: row.phone || "",
    service,
    mode: row.mode || "",
    date,
    time,
    notes: row.notes || "",
    status,
    patientId: row.patientId,
    doctorId: row.doctorId,
    userId: row.userId,
    facilityId: row.facilityId,
    appointmentType:
      row.appointmentType || row.consultationType || row.service || "",
    appointmentType:
      row.appointmentType || row.consultationType || row.service || "",
    scheduledDateTime: row.scheduledDateTime,
    genidocId: row.genidocId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    establishment_id: row.establishment_id,
    establishment_name: establishment,
    establishment_ville: ville,
    establishment_specialite: specialite,
  };
}
let patients = [];
let doctors = [];
let medicalFacilities = [];
let localAlerts = [];
let users = []; // For admin users

// db est déjà initialisé par initDatabaseMulti
// Promise that resolves when DB schema migrations/rebuilds are finished
let migrationsReady = Promise.resolve();
let _resolveMigrations = null;

function initDatabase(recreate = false) {
  // --- MIGRATION: Ensure 'establishmentId' column exists in doctors table ---
  db.all("PRAGMA table_info(doctors)", [], (docErr, docCols) => {
    if (docErr) {
      console.error("Failed to read doctors table info", docErr);
      return;
    }
    const docNames = (docCols || []).map((c) => c.name);
    if (!docNames.includes("establishmentId")) {
      console.log(
        "[DB MIGRATION] Adding missing 'establishmentId' column to doctors"
      );
      db.run(
        `ALTER TABLE doctors ADD COLUMN establishmentId TEXT`,
        (addErr) => {
          if (addErr) {
            console.error(
              "Failed to add 'establishmentId' column to doctors:",
              addErr
            );
          } else {
            console.log(
              "Migration applied: 'establishmentId' column added to doctors."
            );
          }
        }
      );
    }
  });
  // --- MIGRATION: Ensure 'birthdate' column exists in doctors table ---
  db.all("PRAGMA table_info(doctors)", [], (docErr, docCols) => {
    if (docErr) {
      console.error("Failed to read doctors table info", docErr);
      return;
    }
    const docNames = (docCols || []).map((c) => c.name);
    if (!docNames.includes("birthdate")) {
      console.log(
        "[DB MIGRATION] Adding missing 'birthdate' column to doctors"
      );
      db.run(`ALTER TABLE doctors ADD COLUMN birthdate TEXT`, (addErr) => {
        if (addErr) {
          console.error("Failed to add 'birthdate' column to doctors:", addErr);
        } else {
          console.log(
            "Migration applied: 'birthdate' column added to doctors."
          );
        }
      });
    }
  });
  // --- MIGRATION: Ensure 'phone' column exists in users table ---
  db.all("PRAGMA table_info(users)", [], (userErr, userCols) => {
    if (userErr) {
      console.error("Failed to read users table info", userErr);
      return;
    }
    const userNames = (userCols || []).map((c) => c.name);
    if (!userNames.includes("phone")) {
      console.log("[DB MIGRATION] Adding missing 'phone' column to users");
      db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, (addErr) => {
        if (addErr) {
          console.error("Failed to add 'phone' column to users:", addErr);
        } else {
          console.log("Migration applied: 'phone' column added to users.");
        }
      });
    }
  });
  const mode = recreate ? "RECREATE" : "INIT";
  // Create users and patients tables if missing
  db.serialize(() => {
    if (recreate) {
      db.run(`DROP TABLE IF EXISTS patients`);
      db.run(`DROP TABLE IF EXISTS users`);
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'PATIENT',
        createdAt TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE,
        genidocId TEXT UNIQUE,
        birthdate TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        licenseNumber TEXT UNIQUE,
        specialty TEXT,
        bio TEXT,
        createdAt TEXT,
        birthdate TEXT,
        establishmentId TEXT,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(establishmentId) REFERENCES establishments(id) ON DELETE SET NULL
      )
    `);
    db.run(`
          CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            appointmentNumber TEXT UNIQUE,
            fullName TEXT,
            email TEXT,
            phone TEXT,
            service TEXT,
            consultationType TEXT,
            date TEXT,
            time TEXT,
            mode TEXT,
            notes TEXT,
            status TEXT,
            patientId TEXT,
            doctorId TEXT,
            userId TEXT,
            facilityId TEXT,
            appointmentType TEXT,
            scheduledDateTime TEXT,
            genidocId TEXT,
            createdAt DATETIME,
            updatedAt DATETIME,
            establishment_id TEXT,
            establishment_name TEXT,
            establishment_ville TEXT,
            establishment_specialite TEXT
          )
        `);
    // Social coverage requests (AMO / RAMED)
    db.run(`
        CREATE TABLE IF NOT EXISTS social_requests (
          id TEXT PRIMARY KEY,
          fullname TEXT,
          uniqueid TEXT,
          coverageType TEXT,
          reason TEXT,
          status TEXT DEFAULT 'attente',
          createdBy TEXT,
          processedBy TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

    // Support tickets
    db.run(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id TEXT PRIMARY KEY,
          userId TEXT,
          subject TEXT,
          message TEXT,
          status TEXT DEFAULT 'open',
          createdAt TEXT,
          updatedAt TEXT
        )
      `);
  });
}

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"));
    }
  },
});

// Middleware
app.use(express.json());

// Simple request logger to help debug auth flow and status codes
app.use((req, res, next) => {
  const { authorization, ...restHeaders } = req.headers;
  const hasAuth = Boolean(authorization);
  console.log(
    `GeniDoc: Incoming ${req.method} ${req.url} - headers: ${JSON.stringify({
      ...restHeaders,
      authorization: hasAuth ? "[redacted]" : undefined,
    })}`
  );
  next();
});

// --- AUTHENTIFICATION ADMIN ---
// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;
  console.log(`GeniDoc: /api/admin/login attempt for ${email || "unknown"}`);
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Champs manquants" });
  }

  // Lookup admin user in SQLite
  db.get(
    `SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1`,
    [email],
    async (err, userRow) => {
      if (err) {
        console.error("GeniDoc: DB error during admin login", err);
        return res.status(500).json({ success: false, message: "Erreur DB" });
      }
      if (!userRow)
        return res
          .status(401)
          .json({ success: false, message: "Admin non trouvé" });

      const ok = await bcrypt.compare(password, userRow.password);
      if (!ok)
        return res
          .status(401)
          .json({ success: false, message: "Mot de passe incorrect" });

      // generate token
      const token = generateToken(userRow.id, "ADMIN");

      // respond with admin info
      res.json({
        success: true,
        adminId: userRow.id,
        data: {
          email: userRow.email,
          firstName: userRow.firstName,
          lastName: userRow.lastName,
          role: userRow.role,
        },
        token,
      });
    }
  );
});

// --- AUTHENTIFICATION ÉTABLISSEMENT ---
// Route de connexion pour les établissements
app.post("/api/facility-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Champs manquants" });
  }
  // Look up user in SQLite users table (admins are establishment accounts)
  db.get(
    `SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1`,
    [email],
    (err, userRow) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Erreur DB" });
      }
      if (!userRow) {
        return res.status(404).json({
          success: false,
          message: "Établissement ou administrateur non trouvé",
        });
      }
      // Check password
      bcrypt.compare(password, userRow.password, (err, ok) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Erreur DB" });
        }
        if (!ok) {
          return res
            .status(401)
            .json({ success: false, message: "Mot de passe incorrect" });
        }
        db.get(
          `SELECT * FROM establishments WHERE adminUserId = ? LIMIT 1`,
          [userRow.id],
          (e, estRow) => {
            if (e) {
              console.error("GeniDoc: DB error fetching establishment", e);
              return res
                .status(500)
                .json({ success: false, message: "Erreur DB" });
            }
            if (!estRow)
              return res.status(404).json({
                success: false,
                message:
                  "Aucun établissement n'est associé à ce compte administrateur. Veuillez contacter le support ou créer un établissement.",
                email: userRow.email,
              });

            // Build safe establishment object (no sensitive fields)
            const facility = {
              id: estRow.id,
              name: estRow.name,
              email: estRow.email,
              city: estRow.city,
              address: estRow.address,
              phone: estRow.phone,
              adminUserId: estRow.adminUserId,
              createdAt: estRow.createdAt,
            };

            console.log(`GeniDoc: Établissement connecté: ${facility.email}`);
            const token = generateToken(userRow.id, "ADMIN");
            return res.json({ success: true, data: facility, token });
          }
        );
      });
    }
  );

  // (end of /api/facility-login handler)
});

// Note: /api/establishment/login is implemented later (DB-backed) to avoid routing hacks

// --- AUTHENTIFICATION ---
// Inscription admin + établissement
app.post("/api/admin/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      establishmentName,
      city,
      address,
      phone,
      specialite,
    } = req.body;
    if (!firstName || !email || !password || !establishmentName) {
      return res
        .status(400)
        .json({ success: false, message: "Champs obligatoires manquants" });
    }
    // Vérifier email unique
    const existing = await dbGet(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email déjà utilisé" });
    }
    const adminId = uuidv4();
    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    // Créer l'utilisateur admin
    await dbRun(
      `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, email, hashed, firstName, lastName || "", "ADMIN", createdAt]
    );
    // Créer l'établissement lié
    const estId = uuidv4();
    await dbRun(
      `INSERT INTO establishments (id, name, email, city, address, phone, adminUserId, specialite, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estId,
        establishmentName,
        email,
        city || "",
        address || "",
        phone || "",
        adminId,
        specialite || "",
        createdAt,
      ]
    );
    return res.json({ success: true, adminId, establishmentId: estId });
  } catch (err) {
    console.error("Erreur inscription admin:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// Inscription médecin (choix établissement)
app.post("/api/doctor/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      establishmentId,
      specialty,
      phone,
      birthdate,
    } = req.body;
    if (!firstName || !email || !password || !establishmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Champs obligatoires manquants" });
    }
    // Vérifier email unique
    const existing = await dbGet(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email déjà utilisé" });
    }
    // Vérifier que l'établissement existe
    const est = await dbGet(`SELECT id FROM establishments WHERE id = ?`, [
      establishmentId,
    ]);
    if (!est) {
      return res
        .status(404)
        .json({ success: false, message: "Établissement non trouvé" });
    }
    const doctorUserId = uuidv4();
    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    // Créer l'utilisateur médecin
    await dbRun(
      `INSERT INTO users (id, email, password, firstName, lastName, role, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctorUserId,
        email,
        hashed,
        firstName,
        lastName || "",
        "DOCTOR",
        phone || "",
        createdAt,
      ]
    );
    // Créer la fiche médecin enrichie
    const doctorId = uuidv4();
    await dbRun(
      `INSERT INTO doctors (id, userId, firstName, lastName, phone, specialty, createdAt, birthdate, establishmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctorId,
        doctorUserId,
        firstName,
        lastName || "",
        phone || "",
        specialty || "",
        createdAt,
        birthdate || null,
        establishmentId,
      ]
    );
    // (Optionnel) Lier le médecin à l'établissement (si table de liaison, à ajouter)
    // Ici, on suppose que l'établissement référence les médecins via d'autres endpoints
    return res.json({ success: true, doctorUserId, doctorId });
  } catch (err) {
    console.error("Erreur inscription médecin:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});
// Patient registration (stored in SQLite users + patients tables)
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, birthdate } = req.body;
    if (!username || !email || !password || !birthdate) {
      return res
        .status(400)
        .json({ success: false, message: "Champs manquants" });
    }

    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [email],
      async (err, row) => {
        if (err)
          return res.status(500).json({ success: false, message: "Erreur DB" });
        if (row)
          return res
            .status(409)
            .json({ success: false, message: "Email déjà utilisé" });

        const userId = uuidv4();
        const hashed = await bcrypt.hash(password, 10);
        const createdAt = new Date().toISOString();
        const genidocId = generateGenidocId();

        db.run(
          `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, email, hashed, username, "", "PATIENT", createdAt],
          function (uErr) {
            if (uErr)
              return res.status(500).json({
                success: false,
                message: "Erreur création utilisateur",
              });

            const patientId = uuidv4();
            db.run(
              `INSERT INTO patients (id, userId, genidocId, birthdate, createdAt) VALUES (?, ?, ?, ?, ?)`,
              [patientId, userId, genidocId, birthdate, createdAt],
              function (pErr) {
                if (pErr)
                  return res.status(500).json({
                    success: false,
                    message: "Erreur création patient",
                  });
                return res.json({ success: true, genidocId });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// Patient login (SQLite)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Champs manquants" });

    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err)
          return res.status(500).json({ success: false, message: "Erreur DB" });
        if (!user)
          return res
            .status(401)
            .json({ success: false, message: "Identifiants invalides" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok)
          return res
            .status(401)
            .json({ success: false, message: "Identifiants invalides" });

        db.get(
          `SELECT genidocId FROM patients WHERE userId = ?`,
          [user.id],
          (pErr, patient) => {
            if (pErr)
              return res
                .status(500)
                .json({ success: false, message: "Erreur DB" });
            const safeUser = {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            };
            const token = generateToken(user.id, user.role || "PATIENT");
            return res.json({
              success: true,
              genidocId: patient ? patient.genidocId : null,
              data: safeUser,
              token,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

function authenticateToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth)
    return res.status(401).json({ success: false, message: "Token manquant" });
  const parts = auth.split(" ");
  if (parts.length !== 2)
    return res
      .status(401)
      .json({ success: false, message: "Format token invalide" });
  const token = parts[1];

  // Check blacklist
  db.get(
    `SELECT id FROM blacklisted_tokens WHERE token = ?`,
    [token],
    (err, row) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      if (row)
        return res
          .status(401)
          .json({ success: false, message: "Token révoqué" });

      const secret = process.env.JWT_SECRET || "dev-secret";
      jwt.verify(token, secret, (e, payload) => {
        if (e)
          return res
            .status(401)
            .json({ success: false, message: "Token invalide" });
        req.user = payload;
        next();
      });
    }
  );
}

// Logout (blacklist token)
app.post("/api/logout", authenticateToken, (req, res) => {
  const auth = req.headers["authorization"];
  const token = auth.split(" ")[1];
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h default
  db.run(
    `INSERT INTO blacklisted_tokens (id, token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [id, token, req.user.userId || null, expiresAt, new Date().toISOString()],
    (err) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      // Also clear local in-memory session if any
      return res.json({ success: true, message: "Déconnecté" });
    }
  );
});

// Patient profile endpoint (fetch from SQLite)
app.get("/api/patient/:genidocId", (req, res) => {
  const genidocId = req.params.genidocId;
  db.get(
    `SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.role
     FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
    [genidocId],
    (err, row) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Patient non trouvé" });

      const safe = {
        genidocId: row.genidocId,
        email: row.email,
        username: row.firstName,
        fullName: `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        birthdate: row.birthdate,
        role: row.role,
        createdAt: row.patientCreatedAt,
      };

      res.json({ success: true, data: safe });
    }
  );
});

// Patient profile update endpoint (PUT)
app.put("/api/patient/:genidocId", async (req, res) => {
  console.log(`[API] PUT /api/patient/${genidocId} - body:`, req.body);
  const genidocId = req.params.genidocId;
  const { username, lastName, email, telephone, birthdate, photo } =
    req.body || {};
  try {
    // Find patient and user
    const row = await dbGet(
      `SELECT p.id as patientId, u.id as userId FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
      [genidocId]
    );
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Patient non trouvé" });
    }
    // Update users table (firstName, lastName, email, photo)
    if (username || lastName || email || photo) {
      await dbRun(
        `UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), photo = COALESCE(?, photo) WHERE id = ?`,
        [username, lastName, email, photo, row.userId]
      );
      // Queue an email notification (simulation)
      setTimeout(() => {
        console.log(
          `[EMAIL QUEUE] Email mock: statut de la demande ${id} -> ${status}`
        );
      }, 2500);
    }
    // Update patients table (birthdate)
    if (birthdate) {
      await dbRun(`UPDATE patients SET birthdate = ? WHERE id = ?`, [
        birthdate,
        row.patientId,
      ]);
    }
    if (telephone) {
      await dbRun(`UPDATE users SET phone = ? WHERE id = ?`, [
        telephone,
        row.userId,
      ]);
    }
    const updated = await dbGet(
      `SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.role, u.photo
       FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
      [genidocId]
    );
    const safe = updated
      ? {
          genidocId: updated.genidocId,
          email: updated.email,
          username: updated.firstName,
          lastName: updated.lastName,
          fullName: `${updated.firstName || ""} ${
            updated.lastName || ""
          }`.trim(),
          birthdate: updated.birthdate,
          role: updated.role,
          createdAt: updated.patientCreatedAt,
          photo: updated.photo,
        }
      : null;
    return res.json({
      success: true,
      message: "Profil patient mis à jour",
      data: safe,
    });
  } catch (err) {
    console.error("Erreur update patient:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// Admin profile update endpoint (PUT)
app.put("/api/admin/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { username, lastName, email, telephone, photo } = req.body || {};
  try {
    // Only allow update if user exists and is admin
    const user = await dbGet(
      `SELECT * FROM users WHERE id = ? AND role = 'ADMIN'`,
      [userId]
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Admin non trouvé" });
    }
    await dbRun(
      `UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), phone = COALESCE(?, phone), photo = COALESCE(?, photo) WHERE id = ?`,
      [username, lastName, email, telephone, photo, userId]
    );
    return res.json({ success: true, message: "Profil admin mis à jour" });
  } catch (err) {
    console.error("Erreur update admin:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// Doctor profile update endpoint (PUT)
app.put("/api/doctor/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { username, lastName, email, telephone, specialty, birthdate, photo } =
    req.body || {};
  try {
    // Find doctor and user
    const row = await dbGet(
      `SELECT d.id as doctorId, u.id as userId FROM doctors d JOIN users u ON d.userId = u.id WHERE u.id = ?`,
      [userId]
    );
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Médecin non trouvé" });
    }
    // Update users table (firstName, email, phone)
    await dbRun(
      `UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), phone = COALESCE(?, phone), photo = COALESCE(?, photo) WHERE id = ?`,
      [username, lastName, email, telephone, photo, userId]
    );
    // Update doctors table (specialty)
    if (specialty) {
      await dbRun(`UPDATE doctors SET specialty = ? WHERE id = ?`, [
        specialty,
        row.doctorId,
      ]);
    }
    // Optionally update birthdate if present in doctors table
    if (birthdate) {
      await dbRun(`UPDATE doctors SET birthdate = ? WHERE id = ?`, [
        birthdate,
        row.doctorId,
      ]);
    }
    return res.json({ success: true, message: "Profil médecin mis à jour" });
  } catch (err) {
    console.error("Erreur update doctor:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// DB reset endpoint (use with caution). Require header X-RESET-SECRET matching env or allow if ALLOW_DB_RESET=true
app.post("/api/db/reset", (req, res) => {
  const secret = req.headers["x-reset-secret"];
  if (
    process.env.ALLOW_DB_RESET !== "true" &&
    process.env.RESET_SECRET &&
    process.env.RESET_SECRET !== secret
  ) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  initDatabase(true);
  return res.json({ success: true, message: "Database reinitialized" });
});

// --- UPLOAD & OCR (Tesseract.js simulation) ---
const Tesseract = require("tesseract.js");
// === OCR ordonnance API (modulaire)
const ocrOrdonnanceApi = require("./ocr-ordonnance-api");
app.use("/api", ocrOrdonnanceApi);
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Aucun fichier envoyé" });
  }
  try {
    // Simuler OCR (en vrai: await Tesseract.recognize...)
    const text = `Texte extrait simulé du fichier ${req.file.originalname}`;
    res.json({ success: true, text, filename: req.file.filename });
  } catch (e) {
    res.status(500).json({ success: false, message: "Erreur OCR" });
  }
});

// --- GENIDOC MAP (OCR + géocodage) ---
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({ provider: "openstreetmap" });
app.post("/api/genidoc-map", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Aucune image envoyée" });
  }
  try {
    // Simuler OCR et géocodage
    const ocrText = `Texte simulé de l'image ${req.file.originalname}`;
    const geo = await geocoder.geocode("123 Rue de la Santé, Paris");
    res.json({ success: true, ocr: ocrText, geocode: geo });
  } catch (e) {
    res.status(500).json({ success: false, message: "Erreur map/ocr" });
  }
});

// --- RAG SEARCH (simulation) ---
app.get("/api/rag-search", (req, res) => {
  const q = req.query.q || "";
  // Simuler une recherche vectorielle
  res.json({
    success: true,
    data: [{ doc: "Document simulé", score: 0.95, query: q }],
  });
});

// --- GEMINI CHAT (simulation) ---
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message)
    return res
      .status(400)
      .json({ success: false, message: "Message manquant" });
  // Simuler une réponse AI
  res.json({ success: true, response: `Réponse simulée à: ${message}` });
});

// API Routes - Rendez-vous (SQLite)
app.get("/api/appointments", async (req, res) => {
  try {
    // Prise en charge des filtres doctorId, genidocId, facilityId, establishment_id
    const { doctorId, genidocId, facilityId, establishment_id } = req.query;
    let rows;
    if (doctorId) {
      rows = await dbAll(
        `SELECT * FROM appointments WHERE doctorId = ? ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`,
        [doctorId]
      );
    } else if (genidocId) {
      rows = await dbAll(
        `SELECT * FROM appointments WHERE genidocId = ? ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`,
        [genidocId]
      );
    } else if (facilityId || establishment_id) {
      const id = facilityId || establishment_id;
      rows = await dbAll(
        `SELECT * FROM appointments WHERE facilityId = ? OR establishment_id = ? ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`,
        [id, id]
      );
    } else {
      rows = await dbAll(
        `SELECT * FROM appointments ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`
      );
    }
    const data = rows.map(mapAppointmentRow);
    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
});

app.get("/api/appointments/:id", async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      req.params.id,
    ]);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Rendez-vous non trouvé" });
    }
    res.json({ success: true, data: mapAppointmentRow(row) });
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    // Ensure DB migrations/rebuilds are finished before attempting inserts
    try {
      await migrationsReady;
    } catch (mrErr) {
      console.warn("migrationsReady rejection (continuing):", mrErr);
    }
    const body = req.body || {};
    const {
      fullName,
      email,
      phone,
      service,
      consultationType,
      date,
      time,
      mode,
      notes,
      doctorId,
    } = body;
    const facilityRaw = body.facilityId || body.location || null;
    const facilityId = facilityRaw ? String(facilityRaw).trim() : null;

    console.log("GeniDoc: incoming appointment payload", {
      fullName,
      email,
      phone,
      service,
      consultationType,
      date,
      time,
      mode,
      facilityId,
    });

    const required = [
      "fullName",
      "email",
      "phone",
      "service",
      "date",
      "time",
      "mode",
    ];
    const missing = required.filter((field) => {
      const value = body ? body[field] : undefined;
      return !value || String(value).trim() === "";
    });
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Champs manquants: " + missing.join(", "),
      });
    }

    const appointmentMoment = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
    if (!appointmentMoment.isValid()) {
      return res
        .status(400)
        .json({ success: false, message: "Date ou heure invalide" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const selectedDoctor = doctorId
      ? doctors.find((d) => d.id === doctorId)
      : null;
    if (doctorId && !selectedDoctor) {
      return res
        .status(400)
        .json({ success: false, message: "Médecin non trouvé" });
    }

    let establishmentRow = null;
    let establishmentNameForInsert = null;
    if (facilityId) {
      establishmentRow = await dbGet(
        `SELECT id, name, city, adminUserId, email, specialite FROM establishments WHERE id = ?`,
        [facilityId]
      );
      if (establishmentRow) {
        establishmentNameForInsert = establishmentRow.name;
      } else {
        // If facilityId is provided but not found, reject the request
        return res.status(400).json({
          success: false,
          message: "Établissement sélectionné invalide. Veuillez réessayer.",
        });
      }
    }

    if (doctorId) {
      const conflict = await dbGet(
        `SELECT id FROM appointments WHERE doctorId = ? AND date = ? AND time = ? LIMIT 1`,
        [doctorId, date, time]
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Ce créneau n'est pas disponible pour ce médecin",
        });
      }
    }

    const patientRow = await dbGet(
      `SELECT p.id as patientId, p.genidocId, u.id as userId
       FROM patients p
       JOIN users u ON p.userId = u.id
       WHERE lower(u.email) = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    const apptId = uuidv4();
    const createdAt = new Date().toISOString();
    const scheduledDateTime = appointmentMoment.toISOString();

    // Read and log the current appointments table schema to help diagnose
    // NOT NULL / column-order mismatches (will show cid, name, type, notnull).
    try {
      const tableInfo = await dbAll("PRAGMA table_info(appointments)");
      console.log("[DB SCHEMA] appointments table info:", tableInfo);
    } catch (schemaErr) {
      console.warn("Failed to read appointments table schema:", schemaErr);
    }

    // Try inserting the appointment; if the generated appointmentNumber collides
    // with the UNIQUE constraint, retry a few times with a new number.
    let appointmentNumber = null;
    const maxAttempts = 5;
    let lastInsertErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      appointmentNumber = `APT-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;

      try {
        // Build params array explicitly here so we can map them to actual
        // table columns for debugging if needed.
        const paramsToInsert = [
          apptId, // id
          appointmentNumber, // appointmentNumber
          fullName.trim(), // fullName
          normalizedEmail, // email
          phone.trim(), // phone
          service.trim(), // service
          (consultationType || service).trim(), // consultationType
          date, // date
          time, // time
          mode, // mode
          notes || "", // notes
          "en attente", // status
          patientRow ? patientRow.patientId : null, // patientId
          doctorId || null, // doctorId
          patientRow ? patientRow.userId : null, // userId
          facilityId || null, // facilityId
          mode || null, // appointmentType
          scheduledDateTime, // scheduledDateTime
          patientRow ? patientRow.genidocId : null, // genidocId
          createdAt, // createdAt
          null, // updatedAt
          establishmentRow ? establishmentRow.id : null,
          establishmentRow ? establishmentRow.name : null,
          establishmentRow ? establishmentRow.city : null,
          establishmentRow ? establishmentRow.specialite : null,
        ];
        try {
          const insertColumns = [
            "id",
            "appointmentNumber",
            "fullName",
            "email",
            "phone",
            "service",
            "consultationType",
            "date",
            "time",
            "mode",
            "notes",
            "status",
            "patientId",
            "doctorId",
            "userId",
            "facilityId",
            "appointmentType",
            "scheduledDateTime",
            "establishment_id",
            "establishment_name",
            "establishment_ville",
            "establishment_specialite",
            "genidocId",
            "createdAt",
            "updatedAt",
          ];
          console.log("[DB INSERT DEBUG] INSERT column->value mapping:");
          insertColumns.forEach((n, i) => {
            console.log(`  ${i}: ${n} =>`, paramsToInsert[i]);
          });
        } catch (mapErr) {
          // non-fatal
          console.warn("Could not map insertColumns to params:", mapErr);
        }

        await dbRun(
          `INSERT INTO appointments (
            id,
            appointmentNumber,
            fullName,
            email,
            phone,
            service,
            consultationType,
            date,
            time,
            mode,
            notes,
            status,
            patientId,
            doctorId,
            userId,
            facilityId,
            appointmentType,
            scheduledDateTime,
            genidocId,
            createdAt,
            updatedAt,
            establishment_id,
            establishment_name,
            establishment_ville,
            establishment_specialite
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          paramsToInsert
        );
        lastInsertErr = null;
        break;
      } catch (err) {
        lastInsertErr = err;
        const msg = err && err.message ? err.message : "";
        const isApptNumConflict =
          err &&
          err.code === "SQLITE_CONSTRAINT" &&
          (msg.includes("appointmentNumber") ||
            msg.includes("appointments.appointmentNumber") ||
            msg.includes("UNIQUE"));

        console.warn(`Attempt ${attempt} to insert appointment failed:`, {
          code: err && err.code,
          message: err && err.message,
          isApptNumConflict,
        });

        if (!isApptNumConflict || attempt === maxAttempts) {
          throw err;
        }
      }
    }

    const inserted = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      apptId,
    ]);
    const responsePayload = mapAppointmentRow(inserted);

    if (establishmentRow && establishmentRow.adminUserId) {
      const noteId = uuidv4();
      const title = "Nouvelle demande de rendez-vous";
      const message = `Demande de RDV pour ${fullName.trim()} le ${date} ${time}`;
      dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          establishmentRow.adminUserId,
          "APPOINTMENT_REQUEST",
          title,
          message,
          0,
          new Date().toISOString(),
        ]
      ).catch((err) =>
        console.error(
          "Failed to insert notification for establishment admin",
          err
        )
      );
    }

    if (patientRow && patientRow.userId) {
      const noteId = uuidv4();
      const title = "Votre demande de rendez-vous a été reçue";
      const message = `Votre demande pour ${service.trim()} le ${date} ${time} a été envoyée à l'établissement.`;
      dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          patientRow.userId,
          "APPOINTMENT_CONFIRMATION",
          title,
          message,
          0,
          new Date().toISOString(),
        ]
      ).catch((err) =>
        console.error("Failed to insert notification for patient", err)
      );
    }

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: responsePayload,
    });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
});

// --- Social coverage requests (AMO/RAMED) API ---
// Create a new social coverage request (requires authentication)
app.post("/api/social-requests", authenticateToken, async (req, res) => {
  try {
    const { fullname, uniqueid, coverageType, reason } = req.body || {};
    if (!fullname || !uniqueid || !coverageType || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "Champs manquants" });
    }
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await dbRun(
      `INSERT INTO social_requests (id, fullname, uniqueid, coverageType, reason, status, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fullname,
        uniqueid,
        coverageType,
        reason,
        "attente",
        req.user.userId || null,
        createdAt,
      ]
    );
    const newRow = await dbGet(`SELECT * FROM social_requests WHERE id = ?`, [
      id,
    ]);
    return res
      .status(201)
      .json({ success: true, message: "Demande reçue", data: newRow });
  } catch (err) {
    console.error("Erreur creation social request:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// POST /api/support - create a support ticket (requires login)
app.post("/api/support", authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body || {};
    if (!subject || !message)
      return res
        .status(400)
        .json({ success: false, message: "Champs manquants" });
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await dbRun(
      `INSERT INTO support_tickets (id, userId, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user.userId || null, subject, message, "open", createdAt]
    );
    // create a notification for admins
    await dbRun(
      `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        null,
        "SUPPORT",
        "Nouveau ticket de support",
        subject,
        0,
        createdAt,
      ]
    );
    // simulate email queued
    setTimeout(() => {
      console.log("[Support] Email simulated for ticket", id);
    }, 1000);
    return res.json({
      success: true,
      message: "Support ticket créé",
      data: { id },
    });
  } catch (err) {
    console.error("Erreur création support:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET /api/support (admin only - list all) OR ?userId=... to list user tickets
app.get("/api/support", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const rows = await dbAll(
        `SELECT * FROM support_tickets WHERE userId = ? ORDER BY createdAt DESC`,
        [userId]
      );
      return res.json({ success: true, data: rows });
    }
    // only admin can list all
    if (
      !req.user ||
      (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")
    )
      return res.status(403).json({ success: false, message: "Accès refusé" });
    const rows = await dbAll(
      `SELECT * FROM support_tickets ORDER BY createdAt DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Erreur GET support:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// PUT /api/support/:id/status (admin only) - update ticket status
app.put(
  "/api/support/:id/status",
  authenticateToken,
  enforceRole("ADMIN"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body || {};
      if (!["open", "in_progress", "closed"].includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Status invalide" });
      await dbRun(
        `UPDATE support_tickets SET status = ?, updatedAt = ? WHERE id = ?`,
        [status, new Date().toISOString(), id]
      );
      const updated = await dbGet(
        `SELECT * FROM support_tickets WHERE id = ?`,
        [id]
      );
      // create a notification for the user
      await dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          updated.userId || null,
          "SUPPORT_STATUS",
          "Mise à jour du ticket",
          `Le ticket ${id} a été mis à jour: ${status}`,
          0,
          new Date().toISOString(),
        ]
      );
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error("Erreur update support:", err);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur" });
    }
  }
);

// Get social requests: by uniqueid or all (admin only)
app.get("/api/social-requests", async (req, res) => {
  try {
    const { uniqueid } = req.query;
    if (uniqueid) {
      const rows = await dbAll(
        `SELECT * FROM social_requests WHERE uniqueid = ? ORDER BY createdAt DESC`,
        [uniqueid]
      );
      return res.json({ success: true, data: rows });
    }
    // No uniqueid query -> require auth and admin
    const auth = req.headers["authorization"];
    if (!auth)
      return res
        .status(401)
        .json({ success: false, message: "Token manquant" });
    // verify token
    const token = auth.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      if (
        !payload ||
        (payload.role &&
          payload.role !== "ADMIN" &&
          payload.role !== "SUPER_ADMIN")
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Accès interdit" });
      }
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: "Token invalide" });
    }
    const rows = await dbAll(
      `SELECT * FROM social_requests ORDER BY createdAt DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Erreur GET social-requests:", err);
    return res.status(500).json({ success: false, message: "Erreur interne" });
  }
});

// Update request status (validate/refuse) - admin only
app.put(
  "/api/social-requests/:id/status",
  authenticateToken,
  enforceRole("ADMIN"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body || {};
      if (!["attente", "validee", "refusee"].includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Status invalide" });
      const row = await dbGet(`SELECT * FROM social_requests WHERE id = ?`, [
        id,
      ]);
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Demande introuvable" });
      await dbRun(
        `UPDATE social_requests SET status = ?, processedBy = ?, updatedAt = ? WHERE id = ?`,
        [status, req.user.userId || null, new Date().toISOString(), id]
      );
      const updated = await dbGet(
        `SELECT * FROM social_requests WHERE id = ?`,
        [id]
      );
      // Add a notification for assigned user
      await dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          updated.createdBy || null,
          "SOCIAL_STATUS",
          "Mise à jour demande",
          `La demande ${id} a été mise à jour: ${status}`,
          0,
          new Date().toISOString(),
        ]
      );
      return res.json({
        success: true,
        message: "Status mis à jour",
        data: updated,
      });
    } catch (err) {
      console.error("Erreur update social request status:", err);
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne" });
    }
  }
);

app.put("/api/appointments/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const existing = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      appointmentId,
    ]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Rendez-vous non trouvé" });
    }

    const nextDoctorId =
      req.body && req.body.doctorId !== undefined
        ? req.body.doctorId
        : existing.doctorId;
    const nextDate =
      req.body && req.body.date !== undefined ? req.body.date : existing.date;
    const nextTime =
      req.body && req.body.time !== undefined ? req.body.time : existing.time;

    if (nextDoctorId) {
      const conflict = await dbGet(
        `SELECT id FROM appointments WHERE doctorId = ? AND date = ? AND time = ? AND id <> ? LIMIT 1`,
        [nextDoctorId, nextDate, nextTime, appointmentId]
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Ce créneau n'est pas disponible pour ce médecin",
        });
      }
    }

    let scheduledDateTime = existing.scheduledDateTime;
    if (nextDate && nextTime) {
      const nextMoment = moment(`${nextDate} ${nextTime}`, "YYYY-MM-DD HH:mm");
      if (!nextMoment.isValid()) {
        return res
          .status(400)
          .json({ success: false, message: "Date ou heure invalide" });
      }
      scheduledDateTime = nextMoment.toISOString();
    }

    const allowedFields = [
      "fullName",
      "email",
      "phone",
      "service",
      "consultationType",
      "date",
      "time",
      "mode",
      "notes",
      "status",
      "doctorId",
      "facilityId",
      "appointmentType",
    ];
    const updates = [];
    const params = [];

    allowedFields.forEach((key) => {
      if (req.body && req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    });

    updates.push("scheduledDateTime = ?");
    params.push(scheduledDateTime);
    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());
    params.push(appointmentId);

    await dbRun(
      `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    const updatedRow = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      appointmentId,
    ]);
    res.json({
      success: true,
      message: "Rendez-vous mis à jour avec succès",
      data: mapAppointmentRow(updatedRow),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
});

app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const existing = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      appointmentId,
    ]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Rendez-vous non trouvé" });
    }

    await dbRun(`DELETE FROM appointments WHERE id = ?`, [appointmentId]);
    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès",
      data: mapAppointmentRow(existing),
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
});

// API Routes - Médecins
app.get("/api/doctors", (req, res) => {
  res.json({
    success: true,
    data: doctors,
    total: doctors.length,
  });
});

app.get("/api/doctors/:id", (req, res) => {
  const doctor = doctors.find((d) => d.id === req.params.id);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Médecin non trouvé",
    });
  }
  res.json({
    success: true,
    data: doctor,
  });
});

app.post("/api/doctors", (req, res) => {
  try {
    const { name, specialty, email, phone, facilityId, schedule } = req.body;

    const required = ["name", "specialty", "email", "phone"];
    const missing = required.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Champs manquants: " + missing.join(", "),
      });
    }

    const newDoctor = {
      id: uuidv4(),
      name: name.trim(),
      specialty: specialty.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      facilityId: facilityId || null,
      schedule: schedule || {
        monday: ["09:00", "17:00"],
        tuesday: ["09:00", "17:00"],
        wednesday: ["09:00", "17:00"],
        thursday: ["09:00", "17:00"],
        friday: ["09:00", "17:00"],
        saturday: [],
        sunday: [],
      },
      createdAt: new Date().toISOString(),
    };

    doctors.push(newDoctor);

    res.status(201).json({
      success: true,
      message: "Médecin ajouté avec succès",
      data: newDoctor,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du médecin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

app.put("/api/doctors/:id", (req, res) => {
  try {
    const doctorIndex = doctors.findIndex((d) => d.id === req.params.id);

    if (doctorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Médecin non trouvé",
      });
    }

    const updatedDoctor = {
      ...doctors[doctorIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };

    doctors[doctorIndex] = updatedDoctor;

    res.json({
      success: true,
      message: "Médecin mis à jour avec succès",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// API Routes - Teleconsultation
app.get("/api/teleconsultation/doctors", (req, res) => {
  const availableDoctors = doctors.filter(
    (d) => d.availableForTeleconsultation
  );
  res.json({
    success: true,
    data: availableDoctors,
    total: availableDoctors.length,
  });
});

// API Routes - Alertes Locales
app.get("/api/alerts", (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      success: false,
      message: "Le paramètre `city` est requis.",
    });
  }

  const alertsForCity = localAlerts.filter(
    (alert) => alert.city.toLowerCase() === city.toLowerCase()
  );

  res.json({
    success: true,
    data: alertsForCity.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    ),
    total: alertsForCity.length,
  });
});

app.post("/api/alerts/subscribe", (req, res) => {
  const { email, city } = req.body;

  if (!email || !city) {
    return res.status(400).json({
      success: false,
      message: "L'email et la ville sont requis.",
    });
  }

  // Simulation d'inscription
  console.log(`Nouvelle inscription aux alertes pour ${city}: ${email}`);

  res.json({
    success: true,
    message: `Vous avez bien été inscrit aux alertes pour la ville de ${city}.`,
  });
});

app.post("/api/teleconsultation/request", (req, res) => {
  const { specialty } = req.body;

  if (!specialty) {
    return res.status(400).json({
      success: false,
      message: "La spécialité est requise.",
    });
  }

  // Find an available doctor for the requested specialty
  const availableDoctor = doctors.find(
    (d) =>
      d.specialty.toLowerCase() === specialty.toLowerCase() &&
      d.availableForTeleconsultation
  );

  if (!availableDoctor) {
    return res.status(404).json({
      success: false,
      message: `Aucun médecin disponible pour la spécialité: ${specialty}`,
    });
  }

  // Simulate creating a secure consultation room
  const consultationId = uuidv4();
  const consultationLink = `https://meet.jit.si/GeniDoc-${consultationId}`;

  res.json({
    success: true,
    message: "Médecin trouvé et salle de consultation créée.",
    data: {
      doctor: doctor,
      consultationId: consultationId,
      consultationLink: consultationLink,
    },
  });
});

// --- EMBEDDING CONFIG (simulation) ---
let embeddingConfig = { model: "gemini-pro", dimension: 768 };
app.get("/api/embedding-config", (req, res) => {
  res.json({ success: true, config: embeddingConfig });
});
app.post("/api/embedding-config", (req, res) => {
  embeddingConfig = { ...embeddingConfig, ...req.body };
  res.json({ success: true, config: embeddingConfig });
});
// Routes pour servir les pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/doctors", (req, res) => {
  res.sendFile(path.join(__dirname, "doctors.html"));
});

app.get("/facilities", (req, res) => {
  res.sendFile(path.join(__dirname, "facilities.html"));
});

// --- ADMINISTRATION ---
// Middleware to enforce role-based access control
function enforceRole(role) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (userRole !== role && userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }
    next();
  };
}

// Helper function to generate tokens
function generateToken(userId, role) {
  const payload = { userId, role };
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

// Establishment login endpoint
app.post("/api/establishment/login", (req, res) => {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;
  console.log(
    `GeniDoc: /api/establishment/login attempt for ${email || "unknown"}`
  );
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Champs manquants" });

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err)
      return res.status(500).json({ success: false, message: "Erreur DB" });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non trouvé" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Mot de passe incorrect" });

    // Find establishment linked to this admin user (or by email)
    db.get(
      `SELECT * FROM establishments WHERE adminUserId = ? OR email = ? LIMIT 1`,
      [user.id, email],
      (e, est) => {
        if (e)
          return res.status(500).json({ success: false, message: "Erreur DB" });
        if (!est)
          return res
            .status(404)
            .json({ success: false, message: "Établissement non trouvé" });

        const token = generateToken(user.id, "ADMIN");
        return res.json({
          success: true,
          establishment: { id: est.id, name: est.name, email: est.email },
          token,
        });
      }
    );
  });
});

// GET admin details by establishment id (used by establishment-login.html)
app.get("/api/admin/:establishmentId", (req, res) => {
  const establishmentId = req.params.establishmentId;
  db.get(
    `SELECT * FROM establishments WHERE id = ?`,
    [establishmentId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: "Établissement non trouvé" });

      db.get(
        `SELECT id, email, firstName, lastName, role FROM users WHERE id = ?`,
        [est.adminUserId],
        (e, user) => {
          if (e)
            return res
              .status(500)
              .json({ success: false, message: "Erreur DB" });
          if (!user)
            return res
              .status(404)
              .json({ success: false, message: "Admin non trouvé" });

          res.json({
            success: true,
            data: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
          });
        }
      );
    }
  );
});

// Get establishment by admin user id (used to decide redirect after admin login)
app.get("/api/establishments/admin/:userId", authenticateToken, (req, res) => {
  const userId = req.params.userId;
  // Only allow the requester if they are the same user or a SUPER_ADMIN
  if (req.user.userId !== userId && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ success: false, message: "Accès refusé" });
  }

  db.get(
    `SELECT * FROM establishments WHERE adminUserId = ? LIMIT 1`,
    [userId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: "Aucun établissement lié" });

      res.json({
        success: true,
        data: { id: est.id, name: est.name, email: est.email, city: est.city },
      });
    }
  );
});

// Public: list establishments (used by appointment page to populate "Lieu")
app.get("/api/establishments", (req, res) => {
  db.all(
    `SELECT id, name, email, city, address, phone, adminUserId, createdAt FROM establishments ORDER BY name COLLATE NOCASE`,
    [],
    (err, rows) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      const data = (rows || []).map((r) => ({
        id: r.id,
        nom: r.name || "",
        ville: r.city || "",
        email: r.email || "",
        adresse: r.address || "",
        telephone: r.phone || "",
        // keep 'specialite' key for front-end compatibility (may be empty)
        specialite: r.specialite || "",
        adminId: r.adminUserId || null,
        createdAt: r.createdAt || null,
      }));

      res.json({ success: true, data });
    }
  );
});

// Establishment: list appointment requests (requires token)
app.get("/api/establishments/:id/requests", authenticateToken, (req, res) => {
  const estId = req.params.id;
  // Get the adminUserId for this establishment
  db.get(
    `SELECT adminUserId FROM establishments WHERE id = ?`,
    [estId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: "Erreur DB" });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: "Établissement non trouvé" });
      if (
        req.user.userId !== est.adminUserId &&
        req.user.role !== "SUPER_ADMIN"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Accès refusé" });
      }

      // JOIN appointments with establishments to always get the name and filter by adminUserId
      db.all(
        `SELECT a.*, e.name as establishment_name, e.city as establishment_ville, e.specialite as establishment_specialite
         FROM appointments a
         JOIN establishments e ON a.establishment_id = e.id
         WHERE e.adminUserId = ?
         ORDER BY a.createdAt DESC`,
        [est.adminUserId],
        (aErr, rows) => {
          if (aErr)
            return res
              .status(500)
              .json({ success: false, message: "Erreur DB" });
          const data = (rows || []).map(mapAppointmentRow);
          console.log(
            `[ADMIN RDV DEBUG] adminUserId ${est.adminUserId} : ${data.length} rendez-vous trouvés`,
            data
          );
          return res.json({ success: true, data });
        }
      );
    }
  );
});

// Establishment: act on a request (confirm/reject/modify)
app.put(
  "/api/establishments/requests/:appointmentId",
  authenticateToken,
  (req, res) => {
    const appointmentId = req.params.appointmentId;
    const { action, newDate, newTime, note } = req.body;

    // Fetch appointment and facility (support both facilityId and establishment_id)
    db.get(
      `SELECT * FROM appointments WHERE id = ?`,
      [appointmentId],
      (err, appt) => {
        if (err)
          return res.status(500).json({ success: false, message: "Erreur DB" });
        if (!appt)
          return res
            .status(404)
            .json({ success: false, message: "Rendez-vous non trouvé" });

        // Cherche l'établissement par facilityId OU establishment_id
        const establishmentId = appt.facilityId || appt.establishment_id;
        if (!establishmentId) {
          return res.status(404).json({
            success: false,
            message: "Établissement non trouvé (aucun id lié au RDV)",
          });
        }
        db.get(
          `SELECT * FROM establishments WHERE id = ?`,
          [establishmentId],
          (e, est) => {
            if (e)
              return res
                .status(500)
                .json({ success: false, message: "Erreur DB" });
            if (!est)
              return res
                .status(404)
                .json({ success: false, message: "Établissement non trouvé" });
            if (
              req.user.userId !== est.adminUserId &&
              req.user.role !== "SUPER_ADMIN"
            ) {
              return res
                .status(403)
                .json({ success: false, message: "Accès refusé" });
            }

            let updates = [];
            let params = [];
            let newStatus = appt.status;

            if (action === "confirm") {
              newStatus = "CONFIRMED";
              updates.push("status = ?");
              params.push(newStatus);
            } else if (action === "reject") {
              newStatus = "REJECTED";
              updates.push("status = ?");
              params.push(newStatus);
            } else if (action === "modify") {
              newStatus = "MODIFIED";
              updates.push("status = ?");
              params.push(newStatus);
              if (newDate && newTime) {
                const newDateTime = moment(
                  `${newDate} ${newTime}`,
                  "YYYY-MM-DD HH:mm"
                ).toISOString();
                updates.push("scheduledDateTime = ?");
                params.push(newDateTime);
              }
            } else {
              return res
                .status(400)
                .json({ success: false, message: "Action inconnue" });
            }

            if (note) {
              updates.push("notes = ?");
              params.push(note);
            }
            params.push(appointmentId);

            const sql = `UPDATE appointments SET ${updates.join(
              ", "
            )} WHERE id = ?`;
            db.run(sql, params, function (uErr) {
              if (uErr)
                return res
                  .status(500)
                  .json({ success: false, message: "Erreur DB" });

              // Notify patient if possible
              if (appt.patientId) {
                const noteId = uuidv4();
                const title =
                  action === "confirm"
                    ? "Rendez-vous confirmé"
                    : action === "reject"
                    ? "Rendez-vous refusé"
                    : "Rendez-vous modifié";
                const msg =
                  note ||
                  `Votre rendez-vous (${appt.appointmentNumber}) a été ${action}.`;
                db.run(
                  `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    noteId,
                    appt.userId || appt.patientId,
                    "APPOINTMENT_UPDATE",
                    title,
                    msg,
                    0,
                    new Date().toISOString(),
                  ],
                  (nerr) => {
                    if (nerr) console.error("Failed to notify patient", nerr);
                  }
                );
              }

              return res.json({
                success: true,
                message: "Action appliquée",
                appointmentId,
                status: newStatus,
              });
            });
          }
        );
      }
    );
  }
);

// --- ROUTAGE STATIC ---
app.get(/^\/(.+)$/, (req, res, next) => {
  // Ne pas interférer avec les routes API ou Express explicites
  if (req.path.startsWith("/api/")) return next();
  const filePath = path.join(__dirname, req.params[0]);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return next();
    res.sendFile(filePath);
  });
});

// ...existing code...

// (Removed duplicate /api/doctor/:id endpoint to avoid route conflicts)

// Route 404 JSON fallback (doit être tout à la fin)
app.use((req, res) => {
  console.log("[404] Route non trouvée:", req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: "Endpoint non trouvé",
  });
});

const PORT = process.env.PORT || 3000;

// --- DOCTOR PROFILE ENDPOINT (accept doctorId or userId) ---
app.get("/api/doctor/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // On tente d'abord comme doctorId
    db.get(
      `SELECT u.id as userId, u.firstName as userFirstName, u.lastName as userLastName, u.email, u.phone as userPhone,
              d.id as doctorId, d.firstName as doctorFirstName, d.lastName as doctorLastName, d.phone as doctorPhone, d.specialty, d.birthdate, d.establishmentId,
              e.name AS establishmentName, e.id AS establishmentId, e.city AS establishmentCity, e.specialite AS establishmentSpecialty
       FROM doctors d
       LEFT JOIN users u ON d.userId = u.id
       LEFT JOIN establishments e ON e.id = d.establishmentId
       WHERE d.id = ?`,
      [id],
      async (err, row) => {
        if (err) {
          console.error("[API DEBUG] DB error (doctorId):", err);
          return res.status(500).json({ success: false, message: "Erreur DB" });
        }
        if (row) {
          // Récupérer les rendez-vous liés à l'établissement si possible
          let establishmentAppointments = [];
          if (row.establishmentId) {
            try {
              establishmentAppointments = await dbAll(
                `SELECT * FROM appointments WHERE establishment_id = ? ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`,
                [row.establishmentId]
              );
            } catch (e) {
              console.error(
                "[API DEBUG] Erreur récupération RDV établissement:",
                e
              );
            }
          }
          return res.json({
            success: true,
            data: { ...row, establishmentAppointments },
          });
        }
        // Sinon, on tente comme userId (fallback)
        db.get(
          `SELECT u.id as userId, u.firstName as userFirstName, u.lastName as userLastName, u.email, u.phone as userPhone,
                  d.id as doctorId, d.firstName as doctorFirstName, d.lastName as doctorLastName, d.phone as doctorPhone, d.specialty, d.birthdate, d.establishmentId,
                  e.name AS establishmentName, e.id AS establishmentId, e.city AS establishmentCity, e.specialite AS establishmentSpecialty
           FROM users u
           LEFT JOIN doctors d ON d.userId = u.id
           LEFT JOIN establishments e ON e.id = d.establishmentId
           WHERE u.id = ? AND u.role = 'DOCTOR'`,
          [id],
          async (err2, row2) => {
            if (err2) {
              console.error("[API DEBUG] DB error (userId):", err2);
              return res
                .status(500)
                .json({ success: false, message: "Erreur DB" });
            }
            if (!row2) {
              return res
                .status(404)
                .json({ success: false, message: "Médecin non trouvé" });
            }
            let establishmentAppointments = [];
            if (row2.establishmentId) {
              try {
                establishmentAppointments = await dbAll(
                  `SELECT * FROM appointments WHERE establishment_id = ? ORDER BY datetime(COALESCE(updatedAt, createdAt)) DESC`,
                  [row2.establishmentId]
                );
              } catch (e) {
                console.error(
                  "[API DEBUG] Erreur récupération RDV établissement:",
                  e
                );
              }
            }
            return res.json({
              success: true,
              data: { ...row2, establishmentAppointments },
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("[API DEBUG] Exception:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Fermeture du serveur...");
  db.close(() => {
    console.log("Base de données fermée.");
    process.exit(0);
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint non trouvé",
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur GeniDoc démarré sur le port ${PORT}`);
  console.log(`📱 Interface web: http://<IP_PUBLIQUE> :${PORT}`);
  console.log(`👨‍⚕️ Gestion médecins: http://<IP_PUBLIQUE> :${PORT}/doctors`);
  console.log(
    `🏥 Gestion établissements: http://<IP_PUBLIQUE> :${PORT}/facilities`
  );
  console.log(`⚙️ Administration: http://<IP_PUBLIQUE> :${PORT}/admin`);
  console.log(`🔗 API: http://<IP_PUBLIQUE> :${PORT}/api`);
});
