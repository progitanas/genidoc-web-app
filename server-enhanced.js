const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const DB_FILE = path.join(__dirname, 'genidoc.sqlite');

// Helper to generate a unique GeniDoc ID (GD-XXXXXX)
function generateGenidocId() {
  // 6 random digits, zero-padded
  const num = Math.floor(100000 + Math.random() * 900000);
  return `GD-${num}`;
}

let dbType = process.env.DB_TYPE || 'sqlite'; // "mysql" ou "sqlite"
let db = null;
let mysqlPool = null;
let mysql2 = null;
const sqlite3 = require('sqlite3').verbose();

// Alibaba Cloud RDS / MySQL config (exemple)
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'rm-xxxxxx.mysql.rds.aliyuncs.com',
  user: process.env.MYSQL_USER || 'genidoc',
  password: process.env.MYSQL_PASSWORD || 'Alibaba2025!',
  database: process.env.MYSQL_DATABASE || 'genidoc',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

function initDatabaseMulti(recreate = false) {
  if (dbType === 'mysql') {
    try {
      mysql2 = require('mysql2');
      mysqlPool = mysql2.createPool(MYSQL_CONFIG);
      db = {
        run: (sql, params = [], cb) => mysqlPool.query(sql, params, cb),
        get: (sql, params = [], cb) =>
          mysqlPool.query(sql, params, (err, rows) => cb(err, rows && rows[0])),
        all: (sql, params = [], cb) =>
          mysqlPool.query(sql, params, (err, rows) => cb(err, rows)),
      };
      console.log('✅ Connecté à MySQL (Alibaba Cloud/RDS)');
    } catch (e) {
      console.error(
        '❌ mysql2 non installé ou erreur de connexion, fallback SQLite',
        e
      );
      dbType = 'sqlite';
    }
  }
  if (dbType === 'sqlite') {
    db = new sqlite3.Database(DB_FILE);
    console.log('✅ Connecté à SQLite (local)');
  }
}
// Utiliser la nouvelle fonction d'init multi-DB
initDatabaseMulti(false);
if (dbType === 'mysql') {
  // Appel de la fonction d'init MySQL/compatibilité
  const { initDatabaseCompat } = require('./init-mysql.js');
  initDatabaseCompat(false)
    .then(() => {
      console.log('✅ Schéma MySQL vérifié');
    })
    .catch((e) => {
      console.error('Erreur migration MySQL:', e);
    });
}

// --- DB Utility Functions (Promise wrappers for async/await) ---
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'mysql') {
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
    if (dbType === 'mysql') {
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
    if (dbType === 'mysql') {
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
  let status = row.status || 'en attente';
  if (typeof status === 'string') status = status.trim();
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
    'Consultation';
  // Normalize establishment fields
  let establishment = row.establishment_name || row.establishment || '';
  let ville = row.establishment_ville || row.ville || '';
  let specialite = row.establishment_specialite || row.specialite || '';
  return {
    id: row.id,
    appointmentNumber: row.appointmentNumber,
    fullName: row.fullName || row.patientName || row.patient || 'Patient',
    email: row.email || row.patientEmail || '',
    phone: row.phone || '',
    service,
    mode: row.mode || '',
    date,
    time,
    notes: row.notes || '',
    status,
    patientId: row.patientId,
    doctorId: row.doctorId,
    userId: row.userId,
    facilityId: row.facilityId,
    appointmentType:
      row.appointmentType || row.consultationType || row.service || '',
    appointmentType:
      row.appointmentType || row.consultationType || row.service || '',
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
// --- API: Suggestion intelligente de service (prise de RDV patient) ---
const motifsServices = [
  { motif: /fièvre|rhume|toux|mal de gorge/i, service: 'consultation' },
  {
    motif: /renouvellement|ordonnance|prescription/i,
    service: 'téléconsultation',
  },
  { motif: /avis|expert|deuxième avis/i, service: 'téléexpertise' },
  { motif: /soin|pansement|injection/i, service: 'telesoin' },
  { motif: /urgence|douleur|accident/i, service: 'urgence' },
];
app.post('/api/suggest-service', (req, res) => {
  const { motif } = req.body;
  if (!motif)
    return res.status(400).json({ success: false, message: 'Motif requis' });
  let suggestion = 'consultation';
  for (const ms of motifsServices) {
    if (ms.motif.test(motif)) {
      suggestion = ms.service;
      break;
    }
  }
  res.json({ success: true, service: suggestion });
});
// --- TABLE DOCUMENTS MÉDICAUX (médecin) ---
db.run(`CREATE TABLE IF NOT EXISTS medical_documents (
  id TEXT PRIMARY KEY,
  doctorId TEXT,
  appointmentId TEXT,
  service TEXT,
  fileName TEXT,
  filePath TEXT,
  uploadedAt TEXT
);`);

// --- API: Téléversement de documents (médecin) ---
const uploadDoc = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = './uploads/medical';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});
// POST upload
app.post(
  '/api/doctor/:doctorId/appointments/:appointmentId/documents',
  uploadDoc.single('file'),
  async (req, res) => {
    const { doctorId, appointmentId } = req.params;
    const { service } = req.body;
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    const id = uuidv4();
    const uploadedAt = new Date().toISOString();
    await dbRun(
      'INSERT INTO medical_documents (id, doctorId, appointmentId, service, fileName, filePath, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        doctorId,
        appointmentId,
        service || '',
        req.file.originalname,
        req.file.path,
        uploadedAt,
      ]
    );
    res.json({ success: true, id });
  }
);
// GET documents d'un rendez-vous/service
app.get(
  '/api/doctor/:doctorId/appointments/:appointmentId/documents',
  async (req, res) => {
    const { doctorId, appointmentId } = req.params;
    const rows = await dbAll(
      'SELECT * FROM medical_documents WHERE doctorId = ? AND appointmentId = ? ORDER BY uploadedAt DESC',
      [doctorId, appointmentId]
    );
    res.json({ success: true, data: rows });
  }
);
// DELETE un document
app.delete('/api/doctor/:doctorId/documents/:id', async (req, res) => {
  const { id } = req.params;
  const doc = await dbGet('SELECT * FROM medical_documents WHERE id = ?', [id]);
  if (doc && doc.filePath && fs.existsSync(doc.filePath))
    fs.unlinkSync(doc.filePath);
  await dbRun('DELETE FROM medical_documents WHERE id = ?', [id]);
  res.json({ success: true });
});
// --- TABLE MESSAGERIE SÉCURISÉE (médecin/patient) ---
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  appointmentId TEXT,
  senderId TEXT,
  receiverId TEXT,
  service TEXT,
  content TEXT,
  sentAt TEXT,
  isRead INTEGER DEFAULT 0
);`);

// --- API: Messagerie sécurisée par rendez-vous/service ---
// GET messages d'un rendez-vous
app.get('/api/appointments/:appointmentId/messages', async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const rows = await dbAll(
    'SELECT * FROM messages WHERE appointmentId = ? ORDER BY sentAt ASC',
    [appointmentId]
  );
  res.json({ success: true, data: rows });
});
// POST envoyer un message
app.post('/api/appointments/:appointmentId/messages', async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const { senderId, receiverId, service, content } = req.body;
  if (!senderId || !receiverId || !content) {
    return res
      .status(400)
      .json({ success: false, message: 'Champs requis manquants' });
  }
  const id = uuidv4();
  const sentAt = new Date().toISOString();
  await dbRun(
    'INSERT INTO messages (id, appointmentId, senderId, receiverId, service, content, sentAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, appointmentId, senderId, receiverId, service || '', content, sentAt]
  );
  res.json({ success: true, id });
});
// POST marquer un message comme lu
app.post('/api/messages/:id/read', async (req, res) => {
  await dbRun('UPDATE messages SET isRead = 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});
// --- TABLE DISPONIBILITÉS PAR SERVICE (médecin) ---
db.run(`CREATE TABLE IF NOT EXISTS doctor_availabilities (
  id TEXT PRIMARY KEY,
  doctorId TEXT,
  service TEXT,
  dayOfWeek INTEGER,
  startTime TEXT,
  endTime TEXT,
  createdAt TEXT
);`);

// --- API: CRUD disponibilités par service ---
// GET toutes les dispos d'un médecin
app.get('/api/doctor/:doctorId/availabilities', async (req, res) => {
  const doctorId = req.params.doctorId;
  const rows = await dbAll(
    'SELECT * FROM doctor_availabilities WHERE doctorId = ? ORDER BY dayOfWeek, startTime',
    [doctorId]
  );
  res.json({ success: true, data: rows });
});
// POST ajouter une dispo
app.post('/api/doctor/:doctorId/availabilities', async (req, res) => {
  const doctorId = req.params.doctorId;
  const { service, dayOfWeek, startTime, endTime } = req.body;
  if (!service || dayOfWeek === undefined || !startTime || !endTime) {
    return res
      .status(400)
      .json({ success: false, message: 'Champs requis manquants' });
  }
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  await dbRun(
    'INSERT INTO doctor_availabilities (id, doctorId, service, dayOfWeek, startTime, endTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, doctorId, service, dayOfWeek, startTime, endTime, createdAt]
  );
  res.json({ success: true, id });
});
// DELETE une dispo
app.delete('/api/doctor/:doctorId/availabilities/:id', async (req, res) => {
  await dbRun('DELETE FROM doctor_availabilities WHERE id = ?', [
    req.params.id,
  ]);
  res.json({ success: true });
});
// PUT modifier une dispo
app.put('/api/doctor/:doctorId/availabilities/:id', async (req, res) => {
  const { service, dayOfWeek, startTime, endTime } = req.body;
  await dbRun(
    'UPDATE doctor_availabilities SET service = ?, dayOfWeek = ?, startTime = ?, endTime = ? WHERE id = ?',
    [service, dayOfWeek, startTime, endTime, req.params.id]
  );
  res.json({ success: true });
});

// --- API: Statistiques par service pour un médecin ---
app.get('/api/doctor/:doctorId/service-stats', async (req, res) => {
  const doctorId = req.params.doctorId;
  // Nombre de patients, taux d’absentéisme, durée moyenne par service
  const rows = await dbAll(
    `
    SELECT service,
      COUNT(DISTINCT patientId) as nbPatients,
      COUNT(*) as nbRdv,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as nbAbsents,
      AVG((julianday(updatedAt) - julianday(createdAt)) * 24 * 60) as dureeMoyenneMinutes
    FROM appointments
    WHERE doctorId = ?
    GROUP BY service
    ORDER BY service
  `,
    [doctorId]
  );
  // Calcul taux d’absentéisme
  const stats = rows.map((r) => ({
    service: r.service,
    nbPatients: r.nbPatients,
    nbRdv: r.nbRdv,
    nbAbsents: r.nbAbsents,
    tauxAbsent: r.nbRdv ? Math.round((r.nbAbsents / r.nbRdv) * 100) : 0,
    dureeMoyenneMinutes: r.dureeMoyenneMinutes
      ? Math.round(r.dureeMoyenneMinutes)
      : null,
  }));
  res.json({ success: true, data: stats });
});

// --- TABLE NOTIFICATIONS (médecin) ---
db.run(`CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  doctorId TEXT,
  type TEXT,
  message TEXT,
  data TEXT,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT
);`);

// --- DB MIGRATION: Ensure notifications table has all expected columns ---
db.all('PRAGMA table_info(notifications)', [], (nErr, nCols) => {
  if (nErr) {
    console.error('Failed reading notifications table info', nErr);
    return;
  }
  const names = (nCols || []).map((c) => c.name);
  const expected = [
    { name: 'id', sql: 'TEXT PRIMARY KEY' },
    { name: 'doctorId', sql: 'TEXT' },
    { name: 'userId', sql: 'TEXT' },
    { name: 'type', sql: 'TEXT' },
    { name: 'title', sql: 'TEXT' },
    { name: 'message', sql: 'TEXT' },
    { name: 'data', sql: 'TEXT' },
    { name: 'isRead', sql: 'INTEGER DEFAULT 0' },
    { name: 'createdAt', sql: 'TEXT' },
  ];
  expected.forEach((col) => {
    if (!names.includes(col.name)) {
      console.log(
        '[DB MIGRATION] Adding missing column to notifications:',
        col.name
      );
      try {
        db.run(
          `ALTER TABLE notifications ADD COLUMN ${col.name} ${col.sql}`,
          (e) => {
            if (e) console.error(`Failed to add notifications.${col.name}:`, e);
            else
              console.log(
                `Migration applied: notifications.${col.name} added.`
              );
          }
        );
      } catch (e) {
        console.error('Error applying migration for notifications:', e);
      }
    }
  });
});

// --- SSE (Server-Sent Events) pour notifications temps réel ---
const doctorClients = {};
app.get('/api/doctor/:doctorId/notifications/stream', (req, res) => {
  const doctorId = req.params.doctorId;
  req.socket.setTimeout(0);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  if (!doctorClients[doctorId]) doctorClients[doctorId] = [];
  doctorClients[doctorId].push(res);
  req.on('close', () => {
    doctorClients[doctorId] = (doctorClients[doctorId] || []).filter(
      (r) => r !== res
    );
  });
});

function sendDoctorNotification(doctorId, notif) {
  if (doctorClients[doctorId]) {
    doctorClients[doctorId].forEach((res) => {
      res.write(`data: ${JSON.stringify(notif)}\n\n`);
    });
  }
}

// --- Endpoint pour récupérer les notifications d'un médecin ---
app.get('/api/doctor/:doctorId/notifications', async (req, res) => {
  const doctorId = req.params.doctorId;
  const rows = await dbAll(
    'SELECT * FROM notifications WHERE doctorId = ? ORDER BY createdAt DESC LIMIT 50',
    [doctorId]
  );
  res.json({ success: true, data: rows });
});

// --- Marquer une notification comme lue ---
app.post(
  '/api/doctor/:doctorId/notifications/:notifId/read',
  async (req, res) => {
    await dbRun('UPDATE notifications SET isRead = 1 WHERE id = ?', [
      req.params.notifId,
    ]);
    res.json({ success: true });
  }
);

// db est déjà initialisé par initDatabaseMulti
// Promise that resolves when DB schema migrations/rebuilds are finished
let migrationsReady = Promise.resolve();
let _resolveMigrations = null;

function initDatabase(recreate = false) {
  // --- MIGRATION: Ensure 'establishmentId' column exists in doctors table ---
  db.all('PRAGMA table_info(doctors)', [], (docErr, docCols) => {
    if (docErr) {
      console.error('Failed to read doctors table info', docErr);
      return;
    }
    const docNames = (docCols || []).map((c) => c.name);
    if (!docNames.includes('establishmentId')) {
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
  db.all('PRAGMA table_info(doctors)', [], (docErr, docCols) => {
    if (docErr) {
      console.error('Failed to read doctors table info', docErr);
      return;
    }
    const docNames = (docCols || []).map((c) => c.name);
    if (!docNames.includes('birthdate')) {
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
  db.all('PRAGMA table_info(users)', [], (userErr, userCols) => {
    if (userErr) {
      console.error('Failed to read users table info', userErr);
      return;
    }
    const userNames = (userCols || []).map((c) => c.name);
    if (!userNames.includes('phone')) {
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
  const mode = recreate ? 'RECREATE' : 'INIT';
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
    // Ensure teleconsultationRoom column exists
    db.all('PRAGMA table_info(appointments)', [], (err, cols) => {
      const names = (cols || []).map((c) => c.name);
      if (!names.includes('teleconsultationRoom')) {
        console.log(
          "[DB MIGRATION] Adding 'teleconsultationRoom' column to appointments"
        );
        db.run(
          `ALTER TABLE appointments ADD COLUMN teleconsultationRoom TEXT`,
          (e) => {
            if (e)
              console.error('Failed to add teleconsultationRoom column:', e);
          }
        );
      }
    });
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
    const uploadPath = './uploads';
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
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
      authorization: hasAuth ? '[redacted]' : undefined,
    })}`
  );
  next();
});

// --- AUTHENTIFICATION ADMIN ---
// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;
  console.log(`GeniDoc: /api/admin/login attempt for ${email || 'unknown'}`);
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Champs manquants' });
  }

  // Lookup admin user in SQLite
  db.get(
    `SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1`,
    [email],
    async (err, userRow) => {
      if (err) {
        console.error('GeniDoc: DB error during admin login', err);
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      }
      if (!userRow)
        return res
          .status(401)
          .json({ success: false, message: 'Admin non trouvé' });

      const ok = await bcrypt.compare(password, userRow.password);
      if (!ok)
        return res
          .status(401)
          .json({ success: false, message: 'Mot de passe incorrect' });

      // generate token
      const token = generateToken(userRow.id, 'ADMIN');

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
app.post('/api/facility-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Champs manquants' });
  }
  // Look up user in SQLite users table (admins are establishment accounts)
  db.get(
    `SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1`,
    [email],
    (err, userRow) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      }
      if (!userRow) {
        return res.status(404).json({
          success: false,
          message: 'Établissement ou administrateur non trouvé',
        });
      }
      // Check password
      bcrypt.compare(password, userRow.password, (err, ok) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Erreur DB' });
        }
        if (!ok) {
          return res
            .status(401)
            .json({ success: false, message: 'Mot de passe incorrect' });
        }
        db.get(
          `SELECT * FROM establishments WHERE adminUserId = ? LIMIT 1`,
          [userRow.id],
          (e, estRow) => {
            if (e) {
              console.error('GeniDoc: DB error fetching establishment', e);
              return res
                .status(500)
                .json({ success: false, message: 'Erreur DB' });
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
            const token = generateToken(userRow.id, 'ADMIN');
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
app.post('/api/admin/register', async (req, res) => {
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
        .json({ success: false, message: 'Champs obligatoires manquants' });
    }
    // Vérifier email unique
    const existing = await dbGet(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email déjà utilisé' });
    }
    const adminId = uuidv4();
    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    // Créer l'utilisateur admin
    await dbRun(
      `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, email, hashed, firstName, lastName || '', 'ADMIN', createdAt]
    );
    // Créer l'établissement lié
    const estId = uuidv4();
    await dbRun(
      `INSERT INTO establishments (id, name, email, city, address, phone, adminUserId, specialite, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estId,
        establishmentName,
        email,
        city || '',
        address || '',
        phone || '',
        adminId,
        specialite || '',
        createdAt,
      ]
    );
    return res.json({ success: true, adminId, establishmentId: estId });
  } catch (err) {
    console.error('Erreur inscription admin:', err);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// --- API: Teleconsultation helpers ---
// List doctors available for teleconsultation
app.get('/api/teleconsultation/doctors', async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT id, firstName, lastName, specialty, phone FROM doctors WHERE specialty IS NOT NULL'
    );
    const data = (rows || []).map((r) => ({
      id: r.id,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      specialty: r.specialty || 'Généraliste',
      fee: 30,
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error /api/teleconsultation/doctors', err);
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// Request a teleconsultation: pick a doctor (by specialty), create appointment and Jitsi room
app.post('/api/teleconsultation/request', async (req, res) => {
  try {
    const { specialty } = req.body || {};
    if (!specialty)
      return res
        .status(400)
        .json({ success: false, message: 'Specialty required' });
    // find a doctor with that specialty
    const doctor = await dbGet(
      'SELECT * FROM doctors WHERE specialty = ? LIMIT 1',
      [specialty]
    );
    if (!doctor) {
      // fallback: any doctor
      const anyDoc = await dbGet('SELECT * FROM doctors LIMIT 1');
      if (!anyDoc)
        return res
          .status(404)
          .json({ success: false, message: 'Aucun médecin disponible' });
      doctor = anyDoc;
    }
    const appointmentId = uuidv4();
    const appointmentNumber = `RDV-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toISOString().slice(11, 16);
    const service = 'téléconsultation';
    const teleRoom = `GeniDoc-${appointmentId}`;
    await dbRun(
      `INSERT INTO appointments (id, appointmentNumber, fullName, email, phone, service, date, time, status, patientId, doctorId, createdAt, teleconsultationRoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentId,
        appointmentNumber,
        'Patient anonyme',
        '',
        '',
        service,
        date,
        time,
        'confirmé',
        null,
        doctor.id,
        createdAt,
        teleRoom,
      ]
    );

    const link = `/teleconsultation-call.html?room=${encodeURIComponent(
      teleRoom
    )}&appointmentId=${appointmentId}`;

    // notify doctor
    const notif = {
      id: uuidv4(),
      doctorId: doctor.id,
      type: 'nouveau_rdv_tele',
      message: `Nouvelle téléconsultation planifiée (${date} ${time})`,
      data: JSON.stringify({ appointmentId }),
      createdAt,
    };
    await dbRun(
      'INSERT INTO notifications (id, doctorId, type, message, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [
        notif.id,
        notif.doctorId,
        notif.type,
        notif.message,
        notif.data,
        notif.createdAt,
      ]
    );
    sendDoctorNotification(doctor.id, notif);

    res.json({
      success: true,
      data: {
        doctor: {
          name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
          specialty: doctor.specialty || 'Généraliste',
          fee: 30,
        },
        consultation: { id: appointmentId, link },
      },
    });
  } catch (err) {
    console.error('Error /api/teleconsultation/request', err);
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// Mark teleconsultation started (optional heartbeat)
app.post('/api/appointments/:id/tele-start', async (req, res) => {
  try {
    const id = req.params.id;
    await dbRun('UPDATE appointments SET updatedAt = ? WHERE id = ?', [
      new Date().toISOString(),
      id,
    ]);
    const appt = await dbGet('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appt && appt.doctorId) {
      const notif = {
        id: uuidv4(),
        doctorId: appt.doctorId,
        type: 'tele_start',
        message: 'La téléconsultation a commencé',
        data: JSON.stringify({ appointmentId: id }),
        createdAt: new Date().toISOString(),
      };
      await dbRun(
        'INSERT INTO notifications (id, doctorId, type, message, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          notif.id,
          notif.doctorId,
          notif.type,
          notif.message,
          notif.data,
          notif.createdAt,
        ]
      );
      sendDoctorNotification(appt.doctorId, notif);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error tele-start', err);
    res.status(500).json({ success: false });
  }
});

// Inscription médecin (choix établissement)
app.post('/api/doctor/register', async (req, res) => {
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
        .json({ success: false, message: 'Champs obligatoires manquants' });
    }
    // Vérifier email unique
    const existing = await dbGet(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email déjà utilisé' });
    }
    // Vérifier que l'établissement existe
    const est = await dbGet(`SELECT id FROM establishments WHERE id = ?`, [
      establishmentId,
    ]);
    if (!est) {
      return res
        .status(404)
        .json({ success: false, message: 'Établissement non trouvé' });
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
        lastName || '',
        'DOCTOR',
        phone || '',
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
        lastName || '',
        phone || '',
        specialty || '',
        createdAt,
        birthdate || null,
        establishmentId,
      ]
    );
    // (Optionnel) Lier le médecin à l'établissement (si table de liaison, à ajouter)
    // Ici, on suppose que l'établissement référence les médecins via d'autres endpoints
    return res.json({ success: true, doctorUserId, doctorId });
  } catch (err) {
    console.error('Erreur inscription médecin:', err);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});
// Patient registration (stored in SQLite users + patients tables)
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, birthdate } = req.body;
    if (!username || !email || !password || !birthdate) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs manquants' });
    }

    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [email],
      async (err, row) => {
        if (err)
          return res.status(500).json({ success: false, message: 'Erreur DB' });
        if (row)
          return res
            .status(409)
            .json({ success: false, message: 'Email déjà utilisé' });

        const userId = uuidv4();
        const hashed = await bcrypt.hash(password, 10);
        const createdAt = new Date().toISOString();
        const genidocId = generateGenidocId();

        db.run(
          `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, email, hashed, username, '', 'PATIENT', createdAt],
          function (uErr) {
            if (uErr)
              return res.status(500).json({
                success: false,
                message: 'Erreur création utilisateur',
              });

            const patientId = uuidv4();
            db.run(
              `INSERT INTO patients (id, userId, genidocId, birthdate, createdAt) VALUES (?, ?, ?, ?, ?)`,
              [patientId, userId, genidocId, birthdate, createdAt],
              function (pErr) {
                if (pErr)
                  return res.status(500).json({
                    success: false,
                    message: 'Erreur création patient',
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
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// Patient login (SQLite)
app.post('/api/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};
    const identifier = email;
    if (!identifier || !password) {
      console.log('[LOGIN] Email/GeniDocId ou mot de passe manquant.');
      return res
        .status(400)
        .json({ success: false, message: 'Champs manquants' });
    }

    // 1. PATIENT LOGIN (by email or GeniDoc ID)
    let user = null;
    let patient = null;
    if (/^GD-\d{6}$/.test(identifier)) {
      // Login by GeniDoc ID
      patient = await dbGet(
        `SELECT p.*, u.* FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
        [identifier]
      );
      if (patient) {
        user = patient;
        email = patient.email;
      }
    } else {
      // Login by email
      user = await dbGet(`SELECT * FROM users WHERE email = ?`, [identifier]);
      if (user && user.role === 'PATIENT') {
        patient = await dbGet(`SELECT * FROM patients WHERE userId = ?`, [
          user.id,
        ]);
      }
    }

    if (user && user.role === 'PATIENT' && patient) {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        console.log('[LOGIN] Mot de passe patient incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Identifiants invalides' });
      }
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        genidocId: patient.genidocId,
      };
      const token = generateToken(user.id, user.role || 'PATIENT');
      console.log(`[LOGIN] Patient connecté: ${user.email || user.genidocId}`);
      return res.json({
        success: true,
        genidocId: patient.genidocId,
        data: safeUser,
        token,
      });
    }

    // 2. DOCTOR LOGIN (by email)
    if (user && user.role === 'DOCTOR') {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        console.log('[LOGIN] Mot de passe médecin incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Identifiants invalides' });
      }
      // Get doctorId
      const doctor = await dbGet(`SELECT * FROM doctors WHERE userId = ?`, [
        user.id,
      ]);
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        doctorId: doctor ? doctor.id : null,
        specialty: doctor ? doctor.specialty : null,
        establishmentId: doctor ? doctor.establishmentId : null,
      };
      const token = generateToken(user.id, user.role);
      console.log(`[LOGIN] Médecin connecté: ${user.email}`);
      return res.json({
        success: true,
        data: safeUser,
        token,
      });
    }

    // 3. ADMIN LOGIN (by email)
    if (user && user.role === 'ADMIN') {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        console.log('[LOGIN] Mot de passe admin incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Identifiants invalides' });
      }
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
      const token = generateToken(user.id, user.role);
      console.log(`[LOGIN] Admin connecté: ${user.email}`);
      return res.json({
        success: true,
        data: safeUser,
        token,
      });
    }

    // Not found
    console.log(`[LOGIN] Utilisateur non trouvé: ${identifier}`);
    return res
      .status(404)
      .json({ success: false, message: 'Utilisateur non trouvé.' });
  } catch (error) {
    console.error('[LOGIN] Erreur serveur:', error);
    res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth)
    return res.status(401).json({ success: false, message: 'Token manquant' });
  const parts = auth.split(' ');
  if (parts.length !== 2)
    return res
      .status(401)
      .json({ success: false, message: 'Format token invalide' });
  const token = parts[1];

  // Check blacklist
  db.get(
    `SELECT id FROM blacklisted_tokens WHERE token = ?`,
    [token],
    (err, row) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      if (row)
        return res
          .status(401)
          .json({ success: false, message: 'Token révoqué' });

      const secret = process.env.JWT_SECRET || 'dev-secret';
      jwt.verify(token, secret, (e, payload) => {
        if (e)
          return res
            .status(401)
            .json({ success: false, message: 'Token invalide' });
        req.user = payload;
        next();
      });
    }
  );
}

// Logout (blacklist token)
app.post('/api/logout', authenticateToken, (req, res) => {
  const auth = req.headers['authorization'];
  const token = auth.split(' ')[1];
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h default
  db.run(
    `INSERT INTO blacklisted_tokens (id, token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [id, token, req.user.userId || null, expiresAt, new Date().toISOString()],
    (err) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      // Also clear local in-memory session if any
      return res.json({ success: true, message: 'Déconnecté' });
    }
  );
});

// Patient profile endpoint (fetch from SQLite)
app.get('/api/patient/:genidocId', (req, res) => {
  const genidocId = req.params.genidocId;
  db.get(
    `SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.role
     FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
    [genidocId],
    (err, row) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: 'Patient non trouvé' });

      const safe = {
        genidocId: row.genidocId,
        email: row.email,
        username: row.firstName,
        fullName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
        birthdate: row.birthdate,
        role: row.role,
        createdAt: row.patientCreatedAt,
      };

      res.json({ success: true, data: safe });
    }
  );
});

// --- API: Historique patient groupé par service (rendez-vous + documents) ---
app.get('/api/patient/:genidocId/history-by-service', async (req, res) => {
  try {
    const genidocId = req.params.genidocId;
    const patientRow = await dbGet(
      'SELECT * FROM patients WHERE genidocId = ?',
      [genidocId]
    );
    if (!patientRow)
      return res
        .status(404)
        .json({ success: false, message: 'Patient introuvable' });
    const patientId = patientRow.id;

    // Récupérer tous les rendez-vous du patient
    const appts = await dbAll(
      'SELECT * FROM appointments WHERE patientId = ? OR genidocId = ? ORDER BY date DESC, time DESC',
      [patientId, genidocId]
    );

    // Construire la liste d'ids de rendez-vous
    const apptIds = appts.map((a) => a.id).filter(Boolean);
    let docs = [];
    if (apptIds.length) {
      const placeholders = apptIds.map(() => '?').join(',');
      docs = await dbAll(
        `SELECT * FROM medical_documents WHERE appointmentId IN (${placeholders}) ORDER BY uploadedAt DESC`,
        apptIds
      );
    }

    // Grouper par service
    const map = {};
    appts.forEach((a) => {
      const service = (a.service || a.appointmentType || 'Autre').toString();
      if (!map[service]) map[service] = { appointments: [], documents: [] };
      map[service].appointments.push(mapAppointmentRow(a));
    });
    docs.forEach((d) => {
      const service = (d.service || 'Autre').toString();
      if (!map[service]) map[service] = { appointments: [], documents: [] };
      map[service].documents.push(d);
    });

    // Transformer en tableau
    const result = Object.keys(map).map((s) => ({ service: s, ...map[s] }));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Erreur historique patient par service:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Patient profile update endpoint (PUT)
app.put('/api/patient/:genidocId', async (req, res) => {
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
        .json({ success: false, message: 'Patient non trouvé' });
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
          fullName: `${updated.firstName || ''} ${
            updated.lastName || ''
          }`.trim(),
          birthdate: updated.birthdate,
          role: updated.role,
          createdAt: updated.patientCreatedAt,
          photo: updated.photo,
        }
      : null;
    return res.json({
      success: true,
      message: 'Profil patient mis à jour',
      data: safe,
    });
  } catch (err) {
    console.error('Erreur update patient:', err);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// Admin profile update endpoint (PUT)
app.put('/api/admin/:userId', async (req, res) => {
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
        .json({ success: false, message: 'Admin non trouvé' });
    }
    await dbRun(
      `UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), phone = COALESCE(?, phone), photo = COALESCE(?, photo) WHERE id = ?`,
      [username, lastName, email, telephone, photo, userId]
    );
    return res.json({ success: true, message: 'Profil admin mis à jour' });
  } catch (err) {
    console.error('Erreur update admin:', err);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// Doctor profile update endpoint (PUT)
app.put('/api/doctor/:userId', async (req, res) => {
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
        .json({ success: false, message: 'Médecin non trouvé' });
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
    // Optionnel: mettre à jour la date de naissance si présente dans la table doctors
    if (birthdate) {
      await dbRun(`UPDATE doctors SET birthdate = ? WHERE id = ?`, [
        birthdate,
        row.doctorId,
      ]);
    }
    return res.json({ success: true, message: 'Profil médecin mis à jour' });
  } catch (err) {
    console.error('Erreur update doctor:', err);
    return res.status(500).json({ success: false, message: 'Erreur interne' });
  }
});

// db reset endpoint (use with caution). Require header X-RESET-SECRET matching env or allow if ALLOW_DB_RESET=true
app.post('/api/db/reset', (req, res) => {
  const secret = req.headers['x-reset-secret'];
  if (
    process.env.ALLOW_DB_RESET !== 'true' &&
    process.env.RESET_SECRET &&
    process.env.RESET_SECRET !== secret
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  initDatabase(true);
  return res.json({ success: true, message: 'Database reinitialized' });
});

// --- UPLOAD & OCR (Tesseract.js simulation) ---
const Tesseract = require('tesseract.js');
// === OCR ordonnance API (modulaire)
const ocrOrdonnanceApi = require('./ocr-ordonnance-api');
app.use('/api', ocrOrdonnanceApi);
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Aucun fichier envoyé' });
  }
  try {
    // Simuler OCR (en vrai: await Tesseract.recognize...)
    const text = `Texte extrait simulé du fichier ${req.file.originalname}`;
    res.json({ success: true, text, filename: req.file.filename });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur OCR' });
  }
});

// --- GENIDOC MAP (OCR + géocodage) ---
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });
app.post('/api/genidoc-map', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Aucune image envoyée' });
  }
  try {
    // Simuler OCR et géocodage
    const ocrText = `Texte simulé de l'image ${req.file.originalname}`;
    const geo = await geocoder.geocode('123 Rue de la Santé, Paris');
    res.json({ success: true, ocr: ocrText, geocode: geo });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur map/ocr' });
  }
});

// --- RAG SEARCH (simulation) ---
app.get('/api/rag-search', (req, res) => {
  const q = req.query.q || '';
  // Simuler une recherche vectorielle
  res.json({
    success: true,
    data: [{ doc: 'Document simulé', score: 0.95, query: q }],
  });
});

// --- GEMINI CHAT (simulation) ---
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message)
    return res
      .status(400)
      .json({ success: false, message: 'Message manquant' });
  // Simuler une réponse AI
  res.json({ success: true, response: `Réponse simulée à: ${message}` });
});

// API Routes - Rendez-vous (SQLite)
app.get('/api/appointments', async (req, res) => {
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
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res
      .status(500)
      .json({ success: false, message: 'Erreur interne du serveur' });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM appointments WHERE id = ?`, [
      req.params.id,
    ]);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: 'Rendez-vous non trouvé' });
    }
    res.json({ success: true, data: mapAppointmentRow(row) });
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    res
      .status(500)
      .json({ success: false, message: 'Erreur interne du serveur' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    // Ensure DB migrations/rebuilds are finished before attempting inserts
    try {
      await migrationsReady;
    } catch (mrErr) {
      console.warn('migrationsReady rejection (continuing):', mrErr);
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

    console.log('GeniDoc: incoming appointment payload', {
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
      'fullName',
      'email',
      'phone',
      'service',
      'date',
      'time',
      'mode',
    ];
    const missing = required.filter((field) => {
      const value = body ? body[field] : undefined;
      return !value || String(value).trim() === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Champs manquants: ' + missing.join(', '),
      });
    }

    const appointmentMoment = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
    if (!appointmentMoment.isValid()) {
      return res
        .status(400)
        .json({ success: false, message: 'Date ou heure invalide' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const selectedDoctor = doctorId
      ? doctors.find((d) => d.id === doctorId)
      : null;
    if (doctorId && !selectedDoctor) {
      return res
        .status(400)
        .json({ success: false, message: 'Médecin non trouvé' });
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
          message: 'Établissement sélectionné invalide. Veuillez réessayer.',
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
      const tableInfo = await dbAll('PRAGMA table_info(appointments)');
      console.log('[DB SCHEMA] appointments table info:', tableInfo);
    } catch (schemaErr) {
      console.warn('Failed to read appointments table schema:', schemaErr);
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
          notes || '', // notes
          'en attente', // status
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
            'id',
            'appointmentNumber',
            'fullName',
            'email',
            'phone',
            'service',
            'consultationType',
            'date',
            'time',
            'mode',
            'notes',
            'status',
            'patientId',
            'doctorId',
            'userId',
            'facilityId',
            'appointmentType',
            'scheduledDateTime',
            'establishment_id',
            'establishment_name',
            'establishment_ville',
            'establishment_specialite',
            'genidocId',
            'createdAt',
            'updatedAt',
          ];
          console.log('[DB INSERT DEBUG] INSERT column->value mapping:');
          insertColumns.forEach((n, i) => {
            console.log(`  ${i}: ${n} =>`, paramsToInsert[i]);
          });
        } catch (mapErr) {
          // non-fatal
          console.warn('Could not map insertColumns to params:', mapErr);
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
        const msg = err && err.message ? err.message : '';
        const isApptNumConflict =
          err &&
          err.code === 'SQLITE_CONSTRAINT' &&
          (msg.includes('appointmentNumber') ||
            msg.includes('appointments.appointmentNumber') ||
            msg.includes('UNIQUE'));

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
      const title = 'Nouvelle demande de rendez-vous';
      const message = `Demande de RDV pour ${fullName.trim()} le ${date} ${time}`;
      dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          establishmentRow.adminUserId,
          'APPOINTMENT_REQUEST',
          title,
          message,
          0,
          new Date().toISOString(),
        ]
      ).catch((err) =>
        console.error(
          'Failed to insert notification for establishment admin',
          err
        )
      );
    }

    if (patientRow && patientRow.userId) {
      const noteId = uuidv4();
      const title = 'Votre demande de rendez-vous a été reçue';
      const message = `Votre demande pour ${service.trim()} le ${date} ${time} a été envoyée à l'établissement.`;
      dbRun(
        `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          patientRow.userId,
          'APPOINTMENT_CONFIRMATION',
          title,
          message,
          0,
          new Date().toISOString(),
        ]
      ).catch((err) =>
        console.error('Failed to insert notification for patient', err)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: responsePayload,
    });
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res
      .status(500)
      .json({ success: false, message: 'Erreur interne du serveur' });
  }
});

// --- ADMIN: Attribuer un rendez-vous à un médecin (respecte la limite de RDV/jour) ---
app.post('/api/appointments/:id/assign', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { doctorId } = req.body || {};
    if (!doctorId) {
      return res
        .status(400)
        .json({ success: false, message: 'doctorId requis' });
    }
    // Récupérer le rendez-vous
    const appt = await dbGet('SELECT * FROM appointments WHERE id = ?', [
      appointmentId,
    ]);
    if (!appt)
      return res
        .status(404)
        .json({ success: false, message: 'Rendez-vous introuvable' });
    // Récupérer la date du rendez-vous
    const apptDate = appt.date;
    // Récupérer la limite de RDV/jour du médecin (champ maxAppointmentsPerDay)
    const doctor = await dbGet('SELECT * FROM doctors WHERE id = ?', [
      doctorId,
    ]);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: 'Médecin introuvable' });
    const maxPerDay = doctor.maxAppointmentsPerDay || 10; // défaut 10 si non défini
    // Compter les RDV déjà attribués à ce médecin ce jour-là
    const count = await dbGet(
      'SELECT COUNT(*) as n FROM appointments WHERE doctorId = ? AND date = ?',
      [doctorId, apptDate]
    );
    if (count && count.n >= maxPerDay) {
      return res.status(409).json({
        success: false,
        message: `Ce médecin a déjà atteint sa limite de ${maxPerDay} rendez-vous pour le ${apptDate}`,
      });
    }
    // Attribuer le rendez-vous
    await dbRun('UPDATE appointments SET doctorId = ? WHERE id = ?', [
      doctorId,
      appointmentId,
    ]);
    // Notifier le médecin
    const notif = {
      id: uuidv4(),
      doctorId,
      type: 'nouveau_rdv',
      message: `Nouveau rendez-vous attribué pour le ${apptDate}`,
      data: JSON.stringify({ appointmentId }),
      createdAt: new Date().toISOString(),
    };
    await dbRun(
      'INSERT INTO notifications (id, doctorId, type, message, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [
        notif.id,
        notif.doctorId,
        notif.type,
        notif.message,
        notif.data,
        notif.createdAt,
      ]
    );
    sendDoctorNotification(doctorId, notif);
    return res.json({
      success: true,
      message: 'Rendez-vous attribué au médecin',
    });
  } catch (err) {
    console.error('[ADMIN] Erreur assignation RDV:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- API: Appointment actions ---
// Mark appointment as completed
app.put('/api/appointments/:id/complete', async (req, res) => {
  try {
    const id = req.params.id;
    await dbRun('UPDATE appointments SET status = ? WHERE id = ?', [
      'completed',
      id,
    ]);
    res.json({ success: true, message: 'Appointment marked as completed.' });
  } catch (error) {
    console.error('Error marking appointment as completed:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Add diagnostic to appointment
app.post('/api/appointments/:id/diagnostic', async (req, res) => {
  try {
    const id = req.params.id;
    const { diagnostic } = req.body;
    if (!diagnostic) {
      return res
        .status(400)
        .json({ success: false, message: 'Diagnostic is required.' });
    }
    await dbRun(
      "UPDATE appointments SET notes = COALESCE(notes, '') || ? WHERE id = ?",
      [`\nDiagnostic: ${diagnostic}`, id]
    );
    res.json({ success: true, message: 'Diagnostic added successfully.' });
  } catch (error) {
    console.error('Error adding diagnostic:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Prescribe exam for appointment
app.post('/api/appointments/:id/prescribe-exam', async (req, res) => {
  try {
    const id = req.params.id;
    const { exam } = req.body;
    if (!exam) {
      return res
        .status(400)
        .json({ success: false, message: 'Exam details are required.' });
    }
    await dbRun(
      "UPDATE appointments SET notes = COALESCE(notes, '') || ? WHERE id = ?",
      [`\nPrescribed Exam: ${exam}`, id]
    );
    res.json({ success: true, message: 'Exam prescribed successfully.' });
  } catch (error) {
    console.error('Error prescribing exam:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Generate PDF for appointment
app.get('/api/appointments/:id/generate-pdf', async (req, res) => {
  try {
    const id = req.params.id;
    const appointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [
      id,
    ]);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: 'Appointment not found.' });
    }
    // Simulate PDF generation
    const pdfContent = `PDF for Appointment ${id}\nDetails: ${JSON.stringify(
      appointment
    )}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=appointment_${id}.pdf`
    );
    res.send(Buffer.from(pdfContent));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// View appointment history
app.get('/api/appointments/:id/history', async (req, res) => {
  try {
    const id = req.params.id;
    const history = await dbAll(
      'SELECT * FROM appointment_history WHERE appointmentId = ?',
      [id]
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Join appointment
app.post('/api/appointments/:id/join', async (req, res) => {
  try {
    const id = req.params.id;
    const appointment = await dbGet('SELECT * FROM appointments WHERE id = ?', [
      id,
    ]);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: 'Appointment not found.' });
    }
    res.json({
      success: true,
      message: 'Joined appointment successfully.',
      link: `/join/${id}`,
    });
  } catch (error) {
    console.error('Error joining appointment:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});
// --- ADMINISTRATION ---
// Middleware to enforce role-based access control
function enforceRole(role) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (userRole !== role && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    next();
  };
}

// Helper function to generate tokens
function generateToken(userId, role) {
  const payload = { userId, role };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

// Establishment login endpoint
app.post('/api/establishment/login', (req, res) => {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;
  console.log(
    `GeniDoc: /api/establishment/login attempt for ${email || 'unknown'}`
  );
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: 'Champs manquants' });

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err)
      return res.status(500).json({ success: false, message: 'Erreur DB' });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: 'Utilisateur non trouvé' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: 'Mot de passe incorrect' });

    // Find establishment linked to this admin user (or by email)
    db.get(
      `SELECT * FROM establishments WHERE adminUserId = ? OR email = ? LIMIT 1`,
      [user.id, email],
      (e, est) => {
        if (e)
          return res.status(500).json({ success: false, message: 'Erreur DB' });
        if (!est)
          return res
            .status(404)
            .json({ success: false, message: 'Établissement non trouvé' });

        const token = generateToken(user.id, 'ADMIN');
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
app.get('/api/admin/:establishmentId', (req, res) => {
  const establishmentId = req.params.establishmentId;
  db.get(
    `SELECT * FROM establishments WHERE id = ?`,
    [establishmentId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: 'Établissement non trouvé' });

      db.get(
        `SELECT id, email, firstName, lastName, role FROM users WHERE id = ?`,
        [est.adminUserId],
        (e, user) => {
          if (e)
            return res
              .status(500)
              .json({ success: false, message: 'Erreur DB' });
          if (!user)
            return res
              .status(404)
              .json({ success: false, message: 'Admin non trouvé' });

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
app.get('/api/establishments/admin/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  // Only allow the requester if they are the same user or a SUPER_ADMIN
  if (req.user.userId !== userId && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }

  db.get(
    `SELECT * FROM establishments WHERE adminUserId = ? LIMIT 1`,
    [userId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: 'Aucun établissement lié' });

      res.json({
        success: true,
        data: { id: est.id, name: est.name, email: est.email, city: est.city },
      });
    }
  );
});

// Public: list establishments (used by appointment page to populate "Lieu")
app.get('/api/establishments', (req, res) => {
  db.all(
    `SELECT id, name, email, city, address, phone, adminUserId, createdAt FROM establishments ORDER BY name COLLATE NOCASE`,
    [],
    (err, rows) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      const data = (rows || []).map((r) => ({
        id: r.id,
        nom: r.name || '',
        ville: r.city || '',
        email: r.email || '',
        adresse: r.address || '',
        telephone: r.phone || '',
        // keep 'specialite' key for front-end compatibility (may be empty)
        specialite: r.specialite || '',
        adminId: r.adminUserId || null,
        createdAt: r.createdAt || null,
      }));

      res.json({ success: true, data });
    }
  );
});

// Establishment: list appointment requests (requires token)
app.get('/api/establishments/:id/requests', authenticateToken, (req, res) => {
  const estId = req.params.id;
  // Get the adminUserId for this establishment
  db.get(
    `SELECT adminUserId FROM establishments WHERE id = ?`,
    [estId],
    (err, est) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Erreur DB' });
      if (!est)
        return res
          .status(404)
          .json({ success: false, message: 'Établissement non trouvé' });
      if (
        req.user.userId !== est.adminUserId &&
        req.user.role !== 'SUPER_ADMIN'
      ) {
        return res
          .status(403)
          .json({ success: false, message: 'Accès refusé' });
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
              .json({ success: false, message: 'Erreur DB' });
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
  '/api/establishments/requests/:appointmentId',
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
          return res.status(500).json({ success: false, message: 'Erreur DB' });
        if (!appt)
          return res
            .status(404)
            .json({ success: false, message: 'Rendez-vous non trouvé' });

        // Cherche l'établissement par facilityId OU establishment_id
        const establishmentId = appt.facilityId || appt.establishment_id;
        if (!establishmentId) {
          return res.status(404).json({
            success: false,
            message: 'Établissement non trouvé (aucun id lié au RDV)',
          });
        }
        db.get(
          `SELECT * FROM establishments WHERE id = ?`,
          [establishmentId],
          (e, est) => {
            if (e)
              return res
                .status(500)
                .json({ success: false, message: 'Erreur DB' });
            if (!est)
              return res
                .status(404)
                .json({ success: false, message: 'Établissement non trouvé' });
            if (
              req.user.userId !== est.adminUserId &&
              req.user.role !== 'SUPER_ADMIN'
            ) {
              return res
                .status(403)
                .json({ success: false, message: 'Accès refusé' });
            }

            let updates = [];
            let params = [];
            let newStatus = appt.status;

            if (action === 'confirm') {
              newStatus = 'CONFIRMED';
              updates.push('status = ?');
              params.push(newStatus);
            } else if (action === 'reject') {
              newStatus = 'REJECTED';
              updates.push('status = ?');
              params.push(newStatus);
            } else if (action === 'modify') {
              newStatus = 'MODIFIED';
              updates.push('status = ?');
              params.push(newStatus);
              if (newDate && newTime) {
                const newDateTime = moment(
                  `${newDate} ${newTime}`,
                  'YYYY-MM-DD HH:mm'
                ).toISOString();
                updates.push('scheduledDateTime = ?');
                params.push(newDateTime);
              }
            } else {
              return res
                .status(400)
                .json({ success: false, message: 'Action inconnue' });
            }

            if (note) {
              updates.push('notes = ?');
              params.push(note);
            }
            params.push(appointmentId);

            const sql = `UPDATE appointments SET ${updates.join(
              ', '
            )} WHERE id = ?`;
            db.run(sql, params, function (uErr) {
              if (uErr)
                return res
                  .status(500)
                  .json({ success: false, message: 'Erreur DB' });

              // Notify patient if possible
              if (appt.patientId) {
                const noteId = uuidv4();
                const title =
                  action === 'confirm'
                    ? 'Rendez-vous confirmé'
                    : action === 'reject'
                    ? 'Rendez-vous refusé'
                    : 'Rendez-vous modifié';
                const msg =
                  note ||
                  `Votre rendez-vous (${appt.appointmentNumber}) a été ${action}.`;
                db.run(
                  `INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    noteId,
                    appt.userId || appt.patientId,
                    'APPOINTMENT_UPDATE',
                    title,
                    msg,
                    0,
                    new Date().toISOString(),
                  ],
                  (nerr) => {
                    if (nerr) console.error('Failed to notify patient', nerr);
                  }
                );
              }

              return res.json({
                success: true,
                message: 'Action appliquée',
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
  if (req.path.startsWith('/api/')) return next();
  const filePath = path.join(__dirname, req.params[0]);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return next();
    res.sendFile(filePath);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Fermeture du serveur...');
  db.close(() => {
    console.log('Base de données fermée.');
    process.exit(0);
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur GeniDoc démarré sur http://47.84.127.55:${PORT}`);
  console.log(`📱 Interface web: http://47.84.127.55:${PORT}`);
  console.log(`👨‍⚕️ Gestion médecins: http://47.84.127.55:${PORT}/doctors`);
  console.log(`🏥 Gestion établissements: http://47.84.127.55:${PORT}/facilities`);
  console.log(`⚙️ Administration: http://47.84.127.55:${PORT}/admin`);
  console.log(`🔗 API: http://47.84.127.55:${PORT}/api`);
});
