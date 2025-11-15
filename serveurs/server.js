const Tesseract = require('tesseract.js');
// --- SQLite DB (simple patient profile persistence) ---
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
let db;

async function initDb() {
	db = await open({
		filename: path.join(__dirname, '../genidoc.sqlite'),
		driver: sqlite3.Database
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
function dbGet(sql, params) { return db.get(sql, params); }
function dbRun(sql, params) { return db.run(sql, params); }

// Patient profile endpoint (fetch from SQLite)
app.get('/api/patient/:genidocId', async (req, res) => {
	const genidocId = req.params.genidocId;
	try {
		const row = await dbGet(
			`SELECT p.genidocId, p.birthdate, p.createdAt as patientCreatedAt, u.id as userId, u.email, u.firstName, u.lastName, u.phone, u.photo
			 FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
			[genidocId]
		);
		if (!row) return res.status(404).json({ success: false, message: 'Patient non trouvé' });
		const safe = {
			genidocId: row.genidocId,
			email: row.email,
			username: row.firstName,
			lastName: row.lastName,
			fullName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
			birthdate: row.birthdate,
			phone: row.phone,
			photo: row.photo,
			createdAt: row.patientCreatedAt
		};
		res.json({ success: true, data: safe });
	} catch (e) {
		res.status(500).json({ success: false, message: 'Erreur DB' });
	}
});

// Patient profile update endpoint (PUT)
app.put('/api/patient/:genidocId', async (req, res) => {
	const genidocId = req.params.genidocId;
	const { username, lastName, email, telephone, birthdate, photo } = req.body || {};
	try {
		const row = await dbGet(
			`SELECT p.id as patientId, u.id as userId FROM patients p JOIN users u ON p.userId = u.id WHERE p.genidocId = ?`,
			[genidocId]
		);
		if (!row) return res.status(404).json({ success: false, message: 'Patient non trouvé' });
		// Update users table (firstName, lastName, email, photo)
		if (username || lastName || email || photo) {
			await dbRun(
				`UPDATE users SET firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), email = COALESCE(?, email), photo = COALESCE(?, photo) WHERE id = ?`,
				[username, lastName, email, photo, row.userId]
			);
		}
		// Update patients table (birthdate)
		if (birthdate) {
			await dbRun(`UPDATE patients SET birthdate = ? WHERE id = ?`, [birthdate, row.patientId]);
		}
		// Optionally update phone if present in users table
		if (telephone) {
			await dbRun(`UPDATE users SET phone = ? WHERE id = ?`, [telephone, row.userId]);
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
					fullName: `${updated.firstName || ''} ${updated.lastName || ''}`.trim(),
					birthdate: updated.birthdate,
					phone: updated.phone,
					photo: updated.photo,
					createdAt: updated.patientCreatedAt
				}
			: null;
		return res.json({ success: true, message: 'Profil patient mis à jour', data: safe });
	} catch (err) {
		console.error('Erreur update patient:', err);
		return res.status(500).json({ success: false, message: 'Erreur interne' });
	}
});
// --- LLM/RAG Chat API Demo Endpoint ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Demo /api/chat endpoint (stub)
app.post('/api/chat', async (req, res) => {
	const { message } = req.body;
	// In production: call LLM/RAG backend here (OpenAI, Gemini, etc.)
	if (!message) return res.status(400).json({ success: false, message: 'Message requis' });
	// Demo: echo with fake AI response
	res.json({
		success: true,
		response: `🤖 (DEMO) Vous avez dit : "${message}"\nRéponse IA simulée. (Connectez une clé API pour activer l’IA réelle)`
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
			{ name: 'Dr. Emma Girard', specialty: 'Gynécologie', fee: 50 }
		]
	});
});

app.post('/api/teleconsultation/request', (req, res) => {
	const { specialty } = req.body;
	// Demo: always return a doctor for the selected specialty
	const doctors = {
		'Généraliste': { name: 'Dr. Jean Martin', specialty: 'Généraliste', fee: 30 },
		'Cardiologie': { name: 'Dr. Alice Dubois', specialty: 'Cardiologie', fee: 45 },
		'Dermatologie': { name: 'Dr. Karim Benali', specialty: 'Dermatologie', fee: 40 },
		'Pédiatrie': { name: 'Dr. Sophie Petit', specialty: 'Pédiatrie', fee: 35 },
		'Psychiatrie': { name: 'Dr. Paul Leroy', specialty: 'Psychiatrie', fee: 60 },
		'Gynécologie': { name: 'Dr. Emma Girard', specialty: 'Gynécologie', fee: 50 }
	};
	const doctor = doctors[specialty] || doctors['Généraliste'];
	res.json({
		success: true,
		data: {
			doctor,
			consultation: {
				link: 'https://meet.jit.si/genidoc-demo-teleconsultation'
			}
		}
	});
});

// Start server (if not already started elsewhere)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`GeniDoc server running on port ${PORT}`);
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
			try { data = JSON.parse(data); } catch (e) { /* ignore */ }
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
					Array.isArray(data.phone) ? data.phone.join('; ') : (data.phone || null),
					data.contact || null,
					data.hours || null,
					data.services || null,
					data.ice || null,
					data.order || null,
					data.notes || null,
					file ? file.filename : null,
					ocrText
				]
			);
		} catch (dbErr) {
			return res.status(500).json({ success: false, message: 'Erreur DB établissement', error: dbErr.message });
		}
		res.json({
			success: true,
			message: 'Établissement reçu et stocké',
			file: file ? file.filename : null,
			data,
			ocrText
		});
	} catch (err) {
		res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
	}
});
// Serveur principal Node.js/Express pour GeniDoc (à compléter selon besoins)
