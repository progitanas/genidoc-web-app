// ========== GÉNIDOC HEALTHCARE PLATFORM - SERVER.JS ========== 
// Serveur Node.js/Express avec SQLite pour la plateforme de santé
// Version: 1.0.0
// Description: API RESTful pour gestion des patients, rendez-vous, établissements
// Technologies: Express.js, SQLite, Multer, Tesseract.js, Gemini AI
// Auteur: Équipe GeniDoc
// Date: 2024

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Tesseract = require('tesseract.js');
const NodeGeocoder = require('node-geocoder');

// Configuration du geocoder
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

// Configuration du stockage des fichiers uploadés
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- BASE DE DONNÉES ---
const db = new sqlite3.Database('genidoc.sqlite', (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
  } else {
    console.log('Connexion à la base de données SQLite réussie.');
  }
});

// --- ROUTES PRINCIPALES ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'genidoc.html'));
});
app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/appintment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'appintment.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});
app.get('/doctors', (req, res) => {
  res.sendFile(path.join(__dirname, 'doctors.html'));
});
app.get('/establishments', (req, res) => {
  res.sendFile(path.join(__dirname, 'establishments.html'));
});

// --- API PATIENTS ---
app.post('/api/register', (req, res) => {
  // ... logique d'inscription ...
  res.json({ success: true, message: 'Inscription simulée.' });
});
app.post('/api/login', (req, res) => {
  // ... logique de connexion ...
  res.json({ success: true, message: 'Connexion simulée.' });
});
app.get('/api/patient/:genidocId', (req, res) => {
  // ... logique récupération patient ...
  res.json({ success: true, data: { genidocId: req.params.genidocId } });
});

// --- API RENDEZ-VOUS ---
app.get('/api/appointments', (req, res) => {
  // ... logique récupération rendez-vous ...
  res.json({ success: true, data: [] });
});
app.post('/api/appointments', (req, res) => {
  // ... logique création rendez-vous ...
  res.json({ success: true, message: 'Rendez-vous simulé.' });
});
app.put('/api/appointments/:id', (req, res) => {
  // ... logique mise à jour rendez-vous ...
  res.json({ success: true, message: 'Mise à jour simulée.' });
});
app.delete('/api/appointments/:id', (req, res) => {
  // ... logique suppression rendez-vous ...
  res.json({ success: true, message: 'Suppression simulée.' });
});

// --- API ÉTABLISSEMENTS ---
app.get('/api/establishments', (req, res) => {
  // ... logique récupération établissements ...
  res.json({ success: true, data: [] });
});

// --- API UPLOAD ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier envoyé.' });
  }
  res.json({ success: true, filename: req.file.filename });
});

// --- LANCEMENT SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur GeniDoc legacy démarré sur le port ${PORT}`);
});
