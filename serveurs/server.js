// --- Contact Form Endpoint ---
const nodemailer = require('nodemailer');

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields required.' });
  }
  try {
    // Stocker dans la base
    await db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.run(
      `INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`,
      [name, email, message]
    );

    // Envoi email via nodemailer (SMTP local ou config SendGrid)
    // Remplacez les valeurs SMTP par vos identifiants si besoin
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'votre.email@gmail.com',
        pass: process.env.SMTP_PASS || 'votre_mot_de_passe',
      },
    });

    await transporter.sendMail({
      from: `GeniDoc Contact <${
        process.env.SMTP_USER || 'votre.email@gmail.com'
      }>`,
      to: 'asenhaji2@Um6ss.ma',
      subject: `Nouveau message de contact GeniDoc`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `<b>Nom:</b> ${name}<br><b>Email:</b> ${email}<br><b>Message:</b><br>${message.replace(
        /\n/g,
        '<br>'
      )}`,
    });

    res.json({
      success: true,
      message: "Message envoyé à l'équipe GeniDoc. Merci pour votre contact !",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});
const Tesseract = require('tesseract.js');
// --- SQLite DB (simple patient profile persistence) ---
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, '../genidoc.sqlite'),
    driver: sqlite3.Database,
  });
  // Create tables if not exist (minimal for patient profile)
  await db.run(`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		firstName TEXT,
		lastName TEXT,
		email TEXT,
		phone TEXT,
		photo TEXT
	)`);
  await db.run(`CREATE TABLE IF NOT EXISTS patients (
		id TEXT PRIMARY KEY,
		userId TEXT,
		genidocId TEXT UNIQUE,
		birthdate TEXT,
		createdAt TEXT,
		FOREIGN KEY(userId) REFERENCES users(id)
	)`);
  // Establishments table for GeniDoc Map
  await db.run(`CREATE TABLE IF NOT EXISTS establishments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		specialty TEXT,
		address TEXT,
		city TEXT,
		lat REAL,
		lng REAL,
		phone TEXT,
		contact TEXT,
		hours TEXT,
		services TEXT,
		ice TEXT,
		ordre TEXT,
		notes TEXT,
		photo TEXT,
		ocrText TEXT,
		createdAt TEXT DEFAULT CURRENT_TIMESTAMP
	)`);
}
initDb();

// Helper for get/run
function dbGet(sql, params) {
  return db.get(sql, params);
}
function dbRun(sql, params) {
  return db.run(sql, params);
}

// Patient profile endpoint (fetch from SQLite)
app.get('/api/patient/:genidocId', async (req, res) => {
  const genidocId = req.params.genidocId;
  try {
    const row = await dbGet(
      `SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.phone, u.photo
			 FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
      [genidocId]
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: 'Patient non trouvé' });
    const safe = {
      genidocId: row.genidocId,
      email: row.email,
      username: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      birthdate: row.birthdate,
      phone: row.phone,
      photo: row.photo,
      createdAt: row.patientCreatedAt,
    };
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur DB' });
  }
});

// Patient profile update endpoint (PUT)
app.put('/api/patient/:genidocId', async (req, res) => {
  const genidocId = req.params.genidocId;
  const { username, lastName, email, telephone, birthdate, photo } =
    req.body || {};
  try {
    const row = await dbGet(
      `SELECT p.id as patientId, u.id as userId FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
      [genidocId]
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: 'Patient non trouvé' });
    // Update users table (firstName, lastName, email, photo)
    if (username || lastName || email || photo) {
      await dbRun(
        `UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), photo = COALESCE(?, photo) WHERE id = ?`,
        [username, lastName, email, photo, row.userId]
      );
    }
    // Update patients table (birthdate)
    if (birthdate) {
      await dbRun(`UPDATE patients SET birthdate = ? WHERE id = ?`, [
        birthdate,
        row.patientId,
      ]);
    }
    // Optionally update phone if present in users table
    if (telephone) {
      await dbRun(`UPDATE users SET phone = ? WHERE id = ?`, [
        telephone,
        row.userId,
      ]);
    }
    // Fetch updated patient data to return
    const updated = await dbGet(
      `SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.phone, u.photo
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
          phone: updated.phone,
          photo: updated.photo,
          createdAt: updated.patientCreatedAt,
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
// --- LLM/RAG Chat API Demo Endpoint ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
// Security HTTP headers
app.use(helmet());
// Basic rate limiting (100 requests per 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(cors());
app.use(bodyParser.json());

// --- AUTH MIDDLEWARE ---
function requireAuth(req, res, next) {
  // Accept token in header: x-genidoc-id, x-admin-token, x-doctor-id
  const genidocId = req.headers['x-genidoc-id'];
  const adminToken = req.headers['x-admin-token'];
  const doctorId = req.headers['x-doctor-id'];
  // Accept also in query for legacy clients
  const qGenidocId = req.query.genidocId;
  const qAdminToken = req.query.adminToken;
  const qDoctorId = req.query.doctorId;
  // Acceptable: at least one valid token
  if (
    (genidocId && /^GD-\d{6}$/.test(genidocId)) ||
    (qGenidocId && /^GD-\d{6}$/.test(qGenidocId)) ||
    (adminToken && adminToken.length > 0) ||
    (qAdminToken && qAdminToken.length > 0) ||
    (doctorId && doctorId.length > 0) ||
    (qDoctorId && qDoctorId.length > 0)
  ) {
    return next();
  }
  return res
    .status(401)
    .json({ success: false, message: 'Authentication required' });
}

// --- PROTECT SENSITIVE ROUTES ---
// Example: protect all /api/patient/*, /api/appointments/*, /api/teleconsultation/request
app.use(
  [
    '/api/patient',
    '/api/patient/:genidocId',
    '/api/appointments',
    '/api/appointments/:id',
    '/api/teleconsultation/request',
    '/api/diagnostics',
    '/api/prescriptions',
    '/api/patient/:patientId/history',
  ],
  requireAuth
);

// Demo /api/chat endpoint (stub)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  // In production: call LLM/RAG backend here (OpenAI, Gemini, etc.)
  if (!message)
    return res.status(400).json({ success: false, message: 'Message requis' });
  // Demo: echo with fake AI response
  res.json({
    success: true,
    response: `🤖 (DEMO) Vous avez dit : "${message}"\nRéponse IA simulée. (Connectez une clé API pour activer l’IA réelle)`,
  });
});

// --- API Téléconsultation (stub/demo) ---
app.get('/api/teleconsultation/doctors', (req, res) => {
  // Demo: return fake specialties/doctors
  res.json({
    success: true,
    data: [
      { name: 'Dr. Jean Martin', specialty: 'Généraliste', fee: 30 },
      { name: 'Dr. Alice Dubois', specialty: 'Cardiologie', fee: 45 },
      { name: 'Dr. Karim Benali', specialty: 'Dermatologie', fee: 40 },
      { name: 'Dr. Sophie Petit', specialty: 'Pédiatrie', fee: 35 },
      { name: 'Dr. Paul Leroy', specialty: 'Psychiatrie', fee: 60 },
      { name: 'Dr. Emma Girard', specialty: 'Gynécologie', fee: 50 },
    ],
  });
});

app.post('/api/teleconsultation/request', (req, res) => {
  const { specialty } = req.body;
  // Demo: always return a doctor for the selected specialty
  const doctors = {
    Généraliste: { name: 'Dr. Jean Martin', specialty: 'Généraliste', fee: 30 },
    Cardiologie: {
      name: 'Dr. Alice Dubois',
      specialty: 'Cardiologie',
      fee: 45,
    },
    Dermatologie: {
      name: 'Dr. Karim Benali',
      specialty: 'Dermatologie',
      fee: 40,
    },
    Pédiatrie: { name: 'Dr. Sophie Petit', specialty: 'Pédiatrie', fee: 35 },
    Psychiatrie: { name: 'Dr. Paul Leroy', specialty: 'Psychiatrie', fee: 60 },
    Gynécologie: { name: 'Dr. Emma Girard', specialty: 'Gynécologie', fee: 50 },
  };
  const doctor = doctors[specialty] || doctors['Généraliste'];
  res.json({
    success: true,
    data: {
      doctor,
      consultation: {
        link: 'https://meet.jit.si/genidoc-demo-teleconsultation',
      },
    },
  });
});

// Start server (if not already started elsewhere)
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`GeniDoc server running on port ${PORT}`);
});
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} est déjà utilisé. Choisissez un autre port ou arrêtez le service existant.`
    );
    console.error(
      `Exemple pour démarrer sur 3001 (PowerShell): $env:PORT=3001; node server-enhanced.js`
    );
    process.exit(1);
  } else {
    console.error('Server error', err);
  }
});
// --- GeniDoc Map: établissement upload (photo + JSON) ---
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// POST /api/genidoc-map: receive establishment data (photo + JSON)
app.post('/api/genidoc-map', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    let data = req.body.description;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        /* ignore */
      }
    }
    let ocrText = null;
    if (file) {
      try {
        const ocr = await Tesseract.recognize(file.path, 'fra');
        ocrText = ocr.data.text;
      } catch (err) {
        ocrText = '(Erreur OCR: ' + err.message + ')';
      }
    }
    // Insert into SQLite
    try {
      await db.run(
        `INSERT INTO establishments (name, specialty, address, city, lat, lng, phone, contact, hours, services, ice, ordre, notes, photo, ocrText)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name || null,
          data.specialty || null,
          data.address || null,
          data.city || null,
          data.location && data.location.lat ? Number(data.location.lat) : null,
          data.location && data.location.lng ? Number(data.location.lng) : null,
          Array.isArray(data.phone)
            ? data.phone.join('; ')
            : data.phone || null,
          data.contact || null,
          data.hours || null,
          data.services || null,
          data.ice || null,
          data.order || null,
          data.notes || null,
          file ? file.filename : null,
          ocrText,
        ]
      );
    } catch (dbErr) {
      return res.status(500).json({
        success: false,
        message: 'Erreur DB établissement',
        error: dbErr.message,
      });
    }
    res.json({
      success: true,
      message: 'Établissement reçu et stocké',
      file: file ? file.filename : null,
      data,
      ocrText,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// --- LOGIN ENDPOINT (patients & doctors) ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  console.log('[LOGIN] Tentative de connexion:', { email });
  if (!email || !password) {
    console.log('[LOGIN] Email ou mot de passe manquant.');
    return res
      .status(400)
      .json({ success: false, message: 'Email et mot de passe requis.' });
  }

  try {
    // 1. PATIENT LOGIN (by email)
    const patientRow = await db.get(
      `SELECT p.genidocId, u.email, u.firstName, u.lastName, u.phone, u.photo, u.id as userId, p.birthdate, p.createdAt as patientCreatedAt, u.password as userPassword
       FROM patients p JOIN users u ON p.userId = u.id WHERE u.email = ?`,
      [email]
    );
    console.log('[LOGIN] Patient lookup:', patientRow);
    if (patientRow) {
      if (patientRow.userPassword === password) {
        console.log(
          '[LOGIN] Patient connecté avec succès:',
          patientRow.genidocId
        );
        return res.json({
          success: true,
          genidocId: patientRow.genidocId,
          data: {
            role: 'PATIENT',
            genidocId: patientRow.genidocId,
            email: patientRow.email,
            username: patientRow.firstName,
            lastName: patientRow.lastName,
            fullName: `${patientRow.firstName || ''} ${
              patientRow.lastName || ''
            }`.trim(),
            birthdate: patientRow.birthdate,
            phone: patientRow.phone,
            photo: patientRow.photo,
            createdAt: patientRow.patientCreatedAt,
          },
        });
      } else {
        console.log('[LOGIN] Mot de passe patient incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Mot de passe incorrect.' });
      }
    }

    // 2. DOCTOR LOGIN (by email)
    const doctorRow = await db.get(
      `SELECT d.id as doctorId, u.id as userId, u.email, u.firstName, u.lastName, u.phone, u.photo, d.specialty, d.establishmentId, u.password as userPassword
       FROM doctors d JOIN users u ON d.userId = u.id WHERE u.email = ?`,
      [email]
    );
    console.log('[LOGIN] Doctor lookup:', doctorRow);
    if (doctorRow) {
      if (doctorRow.userPassword === password) {
        console.log(
          '[LOGIN] Médecin connecté avec succès:',
          doctorRow.doctorId
        );
        return res.json({
          success: true,
          data: {
            role: 'DOCTOR',
            userId: doctorRow.doctorId,
            email: doctorRow.email,
            username: doctorRow.firstName,
            lastName: doctorRow.lastName,
            fullName: `${doctorRow.firstName || ''} ${
              doctorRow.lastName || ''
            }`.trim(),
            phone: doctorRow.phone,
            photo: doctorRow.photo,
            specialty: doctorRow.specialty,
            establishmentId: doctorRow.establishmentId,
          },
        });
      } else {
        console.log('[LOGIN] Mot de passe médecin incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Mot de passe incorrect.' });
      }
    }

    // 3. ADMIN LOGIN (optional, by email)
    const adminRow = await db.get(
      `SELECT a.id as adminId, u.id as userId, u.email, u.firstName, u.lastName, u.password as userPassword
       FROM admins a JOIN users u ON a.userId = u.id WHERE u.email = ?`,
      [email]
    );
    console.log('[LOGIN] Admin lookup:', adminRow);
    if (adminRow) {
      if (adminRow.userPassword === password) {
        console.log('[LOGIN] Admin connecté avec succès:', adminRow.adminId);
        return res.json({
          success: true,
          data: {
            role: 'ADMIN',
            userId: adminRow.adminId,
            email: adminRow.email,
            username: adminRow.firstName,
            lastName: adminRow.lastName,
            fullName: `${adminRow.firstName || ''} ${
              adminRow.lastName || ''
            }`.trim(),
          },
        });
      } else {
        console.log('[LOGIN] Mot de passe admin incorrect.');
        return res
          .status(401)
          .json({ success: false, message: 'Mot de passe incorrect.' });
      }
    }

    // Not found
    console.log('[LOGIN] Utilisateur non trouvé pour:', email);
    return res
      .status(404)
      .json({ success: false, message: 'Utilisateur non trouvé.' });
  } catch (err) {
    console.error('[LOGIN] Erreur serveur:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// Ensure appointments, diagnostics and prescriptions tables exist
(async function ensureTables() {
  try {
    await db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      doctorId TEXT,
      date TEXT,
      time TEXT,
      status TEXT,
      reason TEXT,
      service TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointmentId TEXT,
      patient TEXT,
      text TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointmentId TEXT,
      patient TEXT,
      text TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch (e) {
    console.error('Erreur creation tables:', e && e.message);
  }
})();

// Create diagnostic record
app.post('/api/diagnostics', async (req, res) => {
  const { appointmentId, patient, text } = req.body || {};
  if (!text || !patient) {
    return res
      .status(400)
      .json({ success: false, message: 'Données manquantes' });
  }
  try {
    const stmt = await dbRun(
      `INSERT INTO diagnostics (appointmentId, patient, text) VALUES (?, ?, ?)`,
      [appointmentId || null, patient, text]
    );
    res.json({
      success: true,
      message: 'Diagnostic enregistré',
      data: { id: stmt.lastID },
    });
  } catch (e) {
    console.error('Err diagnostics:', e);
    res.status(500).json({ success: false, message: 'Erreur DB' });
  }
});

// Create prescription record
app.post('/api/prescriptions', async (req, res) => {
  const { appointmentId, patient, text } = req.body || {};
  if (!text || !patient) {
    return res
      .status(400)
      .json({ success: false, message: 'Données manquantes' });
  }
  try {
    const stmt = await dbRun(
      `INSERT INTO prescriptions (appointmentId, patient, text) VALUES (?, ?, ?)`,
      [appointmentId || null, patient, text]
    );
    res.json({
      success: true,
      message: 'Prescription enregistrée',
      data: { id: stmt.lastID },
    });
  } catch (e) {
    console.error('Err prescriptions:', e);
    res.status(500).json({ success: false, message: 'Erreur DB' });
  }
});

// Get patient history (diagnostics + prescriptions + appointments)
app.get('/api/patient/:patientId/history', async (req, res) => {
  const patientId = req.params.patientId;
  try {
    const diagnostics = await db.all(
      `SELECT id, appointmentId, text, createdAt FROM diagnostics WHERE patient = ? ORDER BY createdAt DESC LIMIT 200`,
      [patientId]
    );
    const prescriptions = await db.all(
      `SELECT id, appointmentId, text, createdAt FROM prescriptions WHERE patient = ? ORDER BY createdAt DESC LIMIT 200`,
      [patientId]
    );
    const appointments = await db.all(
      `SELECT id, date, time, status, reason, service FROM appointments WHERE patientId = ? ORDER BY date DESC LIMIT 200`,
      [patientId]
    );
    res.json({
      success: true,
      data: diagnostics.concat(prescriptions).concat(appointments),
    });
  } catch (e) {
    console.error('Err history:', e);
    res.status(500).json({ success: false, message: 'Erreur DB' });
  }
});

// Update appointment (status etc.)
app.put('/api/appointments/:id', async (req, res) => {
  const id = req.params.id;
  const { status, date, time, reason } = req.body || {};
  try {
    const exists = await dbGet(`SELECT id FROM appointments WHERE id = ?`, [
      id,
    ]);
    if (!exists) {
      // If not exists, create a minimal record so frontends can work
      await dbRun(
        `INSERT INTO appointments (id, patientId, doctorId, date, time, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          null,
          null,
          date || null,
          time || null,
          status || 'en attente',
          reason || null,
        ]
      );
      return res.json({
        success: true,
        message: 'Rendez-vous créé (via update)',
        data: { id },
      });
    }
    const updates = [];
    const params = [];
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (time !== undefined) {
      updates.push('time = ?');
      params.push(time);
    }
    if (reason !== undefined) {
      updates.push('reason = ?');
      params.push(reason);
    }
    if (updates.length) {
      params.push(id);
      await dbRun(
        `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
    return res.json({ success: true, message: 'Rendez-vous mis à jour' });
  } catch (e) {
    console.error('Err update appointment:', e);
    res.status(500).json({ success: false, message: 'Erreur DB' });
  }
});
