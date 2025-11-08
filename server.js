require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const Tesseract = require("tesseract.js");
const NodeGeocoder = require("node-geocoder");

const upload = multer({ dest: "uploads/" });
const geocoder = NodeGeocoder({ provider: "openstreetmap" });

// Correction simple d'OCR (exemples)
function corrigerTexte(str) {
  if (!str) return "";
  return str
    .replace(/hopital/gi, "Hôpital")
    .replace(/clinque/gi, "Clinique")
    .replace(/medecin/gi, "Médecin")
    .replace(/generale/gi, "générale")
    .replace(/analyse(s)?/gi, "analyses")
    .replace(/vaccin(ation)?/gi, "vaccination")
    .replace(/cabinet/gi, "Cabinet")
    .replace(/quartier/gi, "quartier")
    .replace(/casablanca/gi, "Casablanca");
}

function extraireInfos(texte) {
  texte = corrigerTexte(texte);
  const nom =
    (texte.match(
      /(Cabinet|Clinique|Hôpital|Hopital|Centre)\s+(du\s+Dr\.?\s+\w+|[\w\s\-\.]+)/i
    ) || [])[0] || "inconnu";
  const specialite =
    (texte.match(
      /(Médecin généraliste|Pédiatre|Labo d'analyses|Vaccination|Cardiologue|Dermatologue|Gynécologue|Ophtalmologue|Dentiste|Radiologie|analyses|générale|pédiatrie|vaccination)/i
    ) || [])[0] || "inconnu";
  const telephone =
    (texte.match(/(\+212|0)[5-7][0-9]{8,}/) || [])[0] || "inconnu";
  const site_web =
    (texte.match(/(www\.[a-zA-Z0-9\-\.]+\.[a-z]{2,})/) || [])[0] || "inconnu";
  const adresse =
    (texte.match(
      /\d+\s+[^,]+,?\s*[^,]*,?\s*[^,]*,?\s*\b(Casablanca|Rabat|Marrakech|Fès|Tanger|Agadir|Kenitra|Oujda|Tetouan|El Jadida)\b/i
    ) || [])[0] || "inconnu";
  const ville =
    (texte.match(
      /\b(Casablanca|Rabat|Marrakech|Fès|Tanger|Agadir|Kenitra|Oujda|Tetouan|El Jadida)\b/i
    ) || [])[0] || "inconnu";
  const quartier =
    (texte.match(
      /\b(Maarif|Gauthier|Oasis|Bourgogne|Agdal|Hay Riad|Médina|Centre Ville|Sidi Maarouf|Ain Sebaa|Anfa)\b/i
    ) || [])[0] || "inconnu";
  return { nom, specialite, adresse, ville, quartier, telephone, site_web };
}

const DBSOURCE = "genidoc.sqlite";
const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error("Erreur ouverture DB:", err.message);
    throw err;
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS patient (
            genidocId TEXT PRIMARY KEY,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            birthdate TEXT,
            createdAt TEXT,
            updatedAt TEXT
        )`,
      (err) => {
        if (err) console.error("Erreur création table patient:", err.message);
      }
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS establishment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT,
            specialite TEXT,
            adresse TEXT,
            ville TEXT,
            quartier TEXT,
            latitude REAL,
            longitude REAL,
            telephone TEXT,
            site_web TEXT,
            resume TEXT,
            createdAt TEXT
        )`,
      (err) => {
        if (err)
          console.error("Erreur création table establishment:", err.message);
      }
    );
    // documents table for uploads / RAG
    db.run(
      `CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filepath TEXT,
            mimetype TEXT,
            text TEXT,
            createdAt TEXT
        )`,
      (err) => {
        if (err) console.error("Erreur creation table documents:", err.message);
      }
    );
    // embeddings table (stores vectors as JSON)
    db.run(
      `CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER,
            vector TEXT,
            createdAt TEXT,
            FOREIGN KEY(doc_id) REFERENCES documents(id)
        )`,
      (err) => {
        if (err)
          console.error("Erreur creation table embeddings:", err.message);
      }
    );
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/static", express.static(path.join(__dirname, "static")));

// Helper to determine embedding endpoint and headers
function getEmbeddingConfig() {
  const key = process.env.GEMINI_API_KEY;
  let url = process.env.GEMINI_EMBEDDING_URL || null;
  const headers = { "Content-Type": "application/json" };
  // If no explicit EMB URL, but an API key is provided, default to Google's Generative Language embedding endpoint
  if (!url && key) {
    // Note: this uses an API key as a query param. If you use OAuth tokens, set GEMINI_EMBEDDING_URL and the Authorization header.
    url = `https://generativelanguage.googleapis.com/v1beta2/models/textembedding-gecko-001:embedText?key=${encodeURIComponent(
      key
    )}`;
  } else if (url && key) {
    // If a custom URL is provided and a key exists, prefer Bearer authorization
    headers["Authorization"] = `Bearer ${key}`;
  }
  return { url, headers };
}

// Simple language list we can serve to the frontend
const LANGUAGES = [
  { code: "fr-FR", name: "Français – France" },
  { code: "fr-MA", name: "Français – Maroc" },
  { code: "en-US", name: "English – United States" },
  { code: "es-ES", name: "Español – España" },
];

// Endpoint to get available languages
app.get("/api/languages", (req, res) => {
  res.json({ success: true, data: LANGUAGES });
});

// Endpoint to set language preference (stores in cookie)
app.post("/api/set-language", (req, res) => {
  const { code } = req.body;
  if (!code)
    return res
      .status(400)
      .json({ success: false, message: "Missing language code" });
  // set cookie for 1 year
  res.cookie("genidoc_lang", code, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: false,
  });
  res.json({ success: true, code });
});

// Endpoint to get current language from cookie
app.get("/api/get-language", (req, res) => {
  const code =
    req.cookies && req.cookies.genidoc_lang ? req.cookies.genidoc_lang : null;
  res.json({ success: true, code });
});

// Get current embedding config (masked key)
app.get("/api/embedding-config", (req, res) => {
  res.type("application/json");
  const key = process.env.GEMINI_API_KEY || null;
  const url = process.env.GEMINI_EMBEDDING_URL || null;
  let masked = null;
  if (key) {
    if (key.length > 8) masked = key.slice(0, 4) + "..." + key.slice(-4);
    else masked = key.replace(/.(?=.{4})/g, "*");
  }
  return res.json({ success: true, data: { key: masked, url } });
});

// Set embedding config (store in-memory and persist to .env)
app.post("/api/embedding-config", express.json(), (req, res) => {
  res.type("application/json");
  const { key, url } = req.body || {};
  if (!key && !url)
    return res
      .status(400)
      .json({ success: false, message: "Missing key or url" });
  if (key) process.env.GEMINI_API_KEY = key;
  if (url) process.env.GEMINI_EMBEDDING_URL = url;
  const fs = require("fs");
  const envPath = path.join(__dirname, ".env");
  const jsonPath = path.join(__dirname, "embedding-config.json");
  // Try to persist to .env first; if it fails, persist to embedding-config.json
  try {
    let content = "";
    if (fs.existsSync(envPath)) content = fs.readFileSync(envPath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "" && !l.startsWith("#"));
    const map = {};
    lines.forEach((l) => {
      const m = l.match(/^([^=]+)=(.*)$/);
      if (m) map[m[1]] = m[2];
    });
    if (key) map["GEMINI_API_KEY"] = key;
    if (url) map["GEMINI_EMBEDDING_URL"] = url;
    const out =
      Object.keys(map)
        .map((k) => `${k}=${map[k]}`)
        .join("\n") + "\n";
    fs.writeFileSync(envPath, out, "utf8");
    return res.json({
      success: true,
      message: "Embedding config updated",
      persistedTo: ".env",
    });
  } catch (e) {
    console.warn("Could not persist .env", e);
    // fallback: write a JSON file with the config
    try {
      const cfg = {
        GEMINI_API_KEY: key || process.env.GEMINI_API_KEY || null,
        GEMINI_EMBEDDING_URL: url || process.env.GEMINI_EMBEDDING_URL || null,
      };
      fs.writeFileSync(jsonPath, JSON.stringify(cfg, null, 2), "utf8");
      return res.json({
        success: true,
        message: "Embedding config updated (fallback)",
        persistedTo: "embedding-config.json",
      });
    } catch (e2) {
      console.error("Could not persist embedding-config.json", e2);
      return res
        .status(500)
        .json({
          success: false,
          message: "Could not persist configuration to disk",
          error: String(e2).slice(0, 1000),
        });
    }
  }
});

// Diagnostic endpoint: test embedding endpoint connectivity and return small response snippet
app.get("/api/embedding-test", async (req, res) => {
  res.type("application/json");
  try {
    const { url: EMB_URL, headers: EMB_HEADERS } = getEmbeddingConfig();
    if (!EMB_URL)
      return res
        .status(400)
        .json({ success: false, message: "No embedding URL configured" });
    const fetch = global.fetch || require("node-fetch");
    const payload = { instances: [{ content: "test" }] }; // Corrected payload structure
    const resp = await fetch(EMB_URL, {
      method: "POST",
      headers: Object.assign(
        { "Content-Type": "application/json" },
        EMB_HEADERS || {}
      ),
      body: JSON.stringify(payload),
      timeout: 20000,
    });
    const status = resp.status;
    let bodyText = "";
    try {
      const j = await resp.json();
      bodyText =
        typeof j === "object"
          ? JSON.stringify(j).slice(0, 2000)
          : String(j).slice(0, 2000);
    } catch (e) {
      try {
        const t = await resp.text();
        bodyText = String(t).slice(0, 2000);
      } catch (e2) {
        bodyText = "<unreadable response>";
      }
    }
    return res.json({ success: true, status, bodySnippet: bodyText });
  } catch (e) {
    console.error("Embedding test error", e);
    res.type("application/json");
    return res
      .status(500)
      .json({
        success: false,
        message: "Embedding request failed",
        error: String(e).slice(0, 1000),
      });
  }
});

// Global error handler for API routes: always return JSON instead of HTML
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err && err.stack ? err.stack : err);
  if (req && req.path && req.path.startsWith("/api")) {
    if (res.headersSent) return next(err);
    res.type("application/json");
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: String(err).slice(0, 1000),
      });
  }
  // for non-API routes, pass to default handler
  next(err);
});

// ...toutes les autres routes...

// Endpoint principal GeniDoc Map
app.post("/api/genidoc-map", upload.single("photo"), async (req, res) => {
  let texte = req.body.description || "";
  if (req.file) {
    try {
      const ocr = await Tesseract.recognize(req.file.path, "fra");
      texte += "\n" + ocr.data.text;
    } catch (e) {
      /* ignore OCR si erreur */
    }
  }
  texte = corrigerTexte(texte);
  const infos = extraireInfos(texte);
  let gps = { latitude: "inconnu", longitude: "inconnu" };
  if (infos.adresse !== "inconnu") {
    try {
      const geo = await geocoder.geocode(infos.adresse);
      if (geo && geo[0]) {
        gps = { latitude: geo[0].latitude, longitude: geo[0].longitude };
      }
    } catch (e) {}
  }
  const resume = `${infos.nom}, ${
    infos.specialite !== "inconnu" ? infos.specialite : ""
  }${infos.ville !== "inconnu" ? " à " + infos.ville : ""}${
    infos.quartier !== "inconnu" ? " (quartier " + infos.quartier + ")" : ""
  }.`;
  const result = {
    nom: infos.nom,
    specialite: infos.specialite,
    adresse: infos.adresse,
    ville: infos.ville,
    quartier: infos.quartier,
    gps,
    telephone: infos.telephone,
    site_web: infos.site_web,
    resume: resume.replace(/\s+/g, " ").trim(),
  };
  if (result.nom && result.nom !== "inconnu") {
    db.run(
      `INSERT INTO establishment (nom, specialite, adresse, ville, quartier, latitude, longitude, telephone, site_web, resume, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.nom,
        result.specialite,
        result.adresse,
        result.ville,
        result.quartier,
        result.gps.latitude !== "inconnu" ? result.gps.latitude : null,
        result.gps.longitude !== "inconnu" ? result.gps.longitude : null,
        result.telephone,
        result.site_web,
        result.resume,
        new Date().toISOString(),
      ]
    );
  }
  res.json(result);
});

let appointments = [];
let patients = [];

// Route pour servir le fichier HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "genidoc.html"));
});

// Route pour la prise de rendez-vous (appintment.html)
app.get("/appintment.html", (req, res) => {
  res.sendFile(path.join(__dirname, "appintment.html"));
});

// Route pour la carte vitale (index.html)
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route pour la page À propos
app.get("/about.html", (req, res) => {
  res.sendFile(path.join(__dirname, "about.html"));
});

// Route pour la page Services
app.get("/services.html", (req, res) => {
  res.sendFile(path.join(__dirname, "services.html"));
});

// Route pour la page App
app.get("/genidocapp.html", (req, res) => {
  res.sendFile(path.join(__dirname, "genidocapp.html"));
});

// Endpoint de connexion patient (login via email OU username, mot de passe)
app.post("/api/login", (req, res) => {
  const { email, username, password } = req.body;
  if ((!email && !username) || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Champs manquants" });
  }
  // Recherche par email OU username
  const query = email
    ? "SELECT * FROM patient WHERE email = ?"
    : "SELECT * FROM patient WHERE username = ?";
  const value = email ? email : username;
  db.get(query, [value], (err, row) => {
    if (err)
      return res.status(500).json({ success: false, message: "Erreur DB" });
    if (!row)
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non trouvé" });
    if (row.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Mot de passe incorrect" });
    }
    // Authentification réussie
    const userData = { ...row };
    delete userData.password; // Ne pas renvoyer le mot de passe
    res.json({ success: true, genidocId: row.genidocId, data: userData });
  });
});

// Endpoint pour inscription patient
app.post("/api/register", (req, res) => {
  const { username, email, password, birthdate } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Champs manquants" });
  }
  // Vérifie unicité email
  db.get("SELECT * FROM patient WHERE email = ?", [email], (err, row) => {
    if (err)
      return res.status(500).json({ success: false, message: "Erreur DB" });
    if (row) {
      // Email déjà utilisé, retourne le même GeniDoc ID
      return res
        .status(200)
        .json({ success: true, genidocId: row.genidocId, alreadyExists: true });
    }
    // Génère un ID unique GeniDoc
    function generateId(cb) {
      const id = "GD-" + Math.floor(100000 + Math.random() * 900000);
      db.get("SELECT * FROM patient WHERE genidocId = ?", [id], (err, row) => {
        if (row) return generateId(cb); // collision, recommence
        cb(id);
      });
    }
    generateId((genidocId) => {
      const createdAt = new Date().toISOString();
      db.run(
        "INSERT INTO patient (genidocId, username, email, password, birthdate, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        [genidocId, username, email, password, birthdate || "", createdAt],
        function (err) {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Erreur DB" });
          res.json({ success: true, genidocId });
        }
      );
    });
  });
  // Endpoint pour retrouver un patient par GeniDoc ID (SQLite)
  app.get("/api/patient/:genidocId", (req, res) => {
    db.get(
      "SELECT * FROM patient WHERE genidocId = ?",
      [req.params.genidocId],
      (err, row) => {
        if (err)
          return res.status(500).json({ success: false, message: "Erreur DB" });
        if (!row) return res.status;
        res.json({ success: true, data: row });
      }
    );
  });
});

app.get("/auth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "auth.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Routes pour les nouvelles fonctionnalités
app.get("/doctors", (req, res) => {
  res.sendFile(path.join(__dirname, "doctors.html"));
});

app.get("/establishments", (req, res) => {
  res.sendFile(path.join(__dirname, "establishments.html"));
});

// Route de test pour les fichiers statiques
app.get("/test-logo", (req, res) => {
  const logoPath = path.join(__dirname, "static", "genidoc-logo.png");
  console.log("Test logo path:", logoPath);
  res.sendFile(logoPath, (err) => {
    if (err) {
      console.log("Error serving logo:", err);
      res.status(404).send("Logo not found");
    }
  });
});

// Récupérer tous les rendez-vous
app.get("/api/appointments", (req, res) => {
  res.json({
    success: true,
    data: appointments,
    total: appointments.length,
  });
});

// Récupérer un rendez-vous spécifique
app.get("/api/appointments/:id", (req, res) => {
  const appointment = appointments.find((a) => a.id === req.params.id);
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Rendez-vous non trouvé",
    });
  }
  res.json({
    success: true,
    data: appointment,
  });
});

// Créer un nouveau rendez-vous
app.post("/api/appointments", (req, res) => {
  try {
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
    } = req.body;

    // Validation des champs obligatoires
    const required = [
      "fullName",
      "email",
      "phone",
      "service",
      "date",
      "time",
      "mode",
    ];
    const missing = required.filter(
      (field) => !req.body[field] || String(req.body[field]).trim() === ""
    );

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Champs manquants: " + missing.join(", "),
      });
    }

    // Vérifier si le créneau est disponible
    const appointmentDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
    const existingAppointment = appointments.find((apt) => {
      const existingDateTime = moment(
        `${apt.date} ${apt.time}`,
        "YYYY-MM-DD HH:mm"
      );
      return (
        Math.abs(existingDateTime.diff(appointmentDateTime, "minutes")) < 30
      );
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message:
          "Ce créneau horaire n'est pas disponible. Veuillez choisir un autre horaire.",
      });
    }

    // Créer le nouveau rendez-vous
    const newAppointment = {
      id: uuidv4(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      service: service.trim(),
      consultationType: consultationType || service,
      date,
      time,
      mode,
      notes: notes || "",
      status: "confirmé",
      createdAt: new Date().toISOString(),
      when: appointmentDateTime.toISOString(),
    };

    appointments.push(newAppointment);

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: newAppointment,
    });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Mettre à jour un rendez-vous
app.put("/api/appointments/:id", (req, res) => {
  try {
    const appointmentIndex = appointments.findIndex(
      (a) => a.id === req.params.id
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    const updatedAppointment = {
      ...appointments[appointmentIndex],
      ...req.body,
      id: req.params.id, // Préserver l'ID
      updatedAt: new Date().toISOString(),
    };

    appointments[appointmentIndex] = updatedAppointment;

    res.json({
      success: true,
      message: "Rendez-vous mis à jour avec succès",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Supprimer un rendez-vous
app.delete("/api/appointments/:id", (req, res) => {
  try {
    const appointmentIndex = appointments.findIndex(
      (a) => a.id === req.params.id
    );

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    const deletedAppointment = appointments.splice(appointmentIndex, 1)[0];

    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès",
      data: deletedAppointment,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Récupérer les créneaux disponibles pour une date donnée
app.get("/api/available-slots/:date", (req, res) => {
  try {
    const { date } = req.params;
    const requestedDate = moment(date);

    if (!requestedDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Format de date invalide",
      });
    }

    // Générer les créneaux horaires (9h-17h, créneaux de 30 minutes)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Filtrer les créneaux déjà pris
    const bookedSlots = appointments
      .filter((apt) => apt.date === date)
      .map((apt) => apt.time);

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Route pour les statistiques
app.get("/api/stats", (req, res) => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const thisWeek = moment().startOf("week");
    const thisMonth = moment().startOf("month");

    const stats = {
      total: appointments.length,
      today: appointments.filter((apt) => apt.date === today).length,
      thisWeek: appointments.filter((apt) =>
        moment(apt.date).isSameOrAfter(thisWeek)
      ).length,
      thisMonth: appointments.filter((apt) =>
        moment(apt.date).isSameOrAfter(thisMonth)
      ).length,
      byService: {},
      byMode: {},
    };

    // Statistiques par service
    appointments.forEach((apt) => {
      stats.byService[apt.service] = (stats.byService[apt.service] || 0) + 1;
      stats.byMode[apt.mode] = (stats.byMode[apt.mode] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Une erreur inattendue s'est produite",
  });
});

// Generic HTML file server: serve any top-level .html file in project root if it exists.
// IMPORTANT: ignore requests that target API or static prefixes to avoid accidental HTML responses for /api/*
app.get("/:page", (req, res, next) => {
  const page = req.params.page || "";
  const low = page.toLowerCase();
  // skip API/static asset paths explicitly
  if (
    low.startsWith("api") ||
    low.startsWith("static") ||
    !low.endsWith(".html")
  )
    return next();
  const filePath = path.join(__dirname, page);
  if (!fs.existsSync(filePath)) return next();
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});
// 404 handler and server listen moved to the end of the file (after all route definitions)

// Simple upload endpoint for files used by the chat (stores file + extracts text for RAG)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  const file = req.file;
  let extractedText = "";
  try {
    // If text-like file, attempt to read
    if (
      file.mimetype &&
      (file.mimetype.startsWith("text/") ||
        file.originalname.match(/\.txt|\.csv|\.md$/i))
    ) {
      const fs = require("fs");
      extractedText = fs.readFileSync(file.path, "utf8");
    } else if (file.mimetype && file.mimetype.startsWith("image/")) {
      // attempt OCR with tesseract if available
      try {
        const result = await Tesseract.recognize(file.path, "fra");
        extractedText = result.data && result.data.text ? result.data.text : "";
      } catch (e) {
        console.warn("OCR error", e);
      }
    }
  } catch (e) {
    console.warn("Extraction error", e);
  }
  const now = new Date().toISOString();
  db.run(
    "INSERT INTO documents (filename, filepath, mimetype, text, createdAt) VALUES (?, ?, ?, ?, ?)",
    [file.originalname, file.path, file.mimetype, extractedText, now],
    function (err) {
      if (err)
        return res.status(500).json({ success: false, message: "DB error" });
      const docId = this.lastID;
      // If GEMINI key + EMBEDDING_URL are set, attempt to generate and store an embedding
      (async function () {
        try {
          const { url: EMB_URL, headers: EMB_HEADERS } = getEmbeddingConfig();
          if (EMB_URL) {
            const fetch = global.fetch || require("node-fetch");
            const payload = { input: extractedText || file.originalname };
            const resp = await fetch(EMB_URL, {
              method: "POST",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                EMB_HEADERS || {}
              ),
              body: JSON.stringify(payload),
              timeout: 30000,
            });
            const j = await resp.json();
            // Try to extract embedding from several possible shapes
            let vector = null;
            if (
              j &&
              j.data &&
              Array.isArray(j.data) &&
              j.data[0] &&
              (j.data[0].embedding || j.data[0].embeddings)
            ) {
              vector = j.data[0].embedding || j.data[0].embeddings;
            } else if (j && j.embedding) vector = j.embedding;
            else if (j && j[0] && Array.isArray(j[0])) vector = j[0];
            if (vector) {
              const vstr = JSON.stringify(vector);
              db.run(
                "INSERT INTO embeddings (doc_id, vector, createdAt) VALUES (?, ?, ?)",
                [docId, vstr, new Date().toISOString()]
              );
              console.log("Stored embedding for doc", docId);
            } else {
              console.warn(
                "No embedding found in response for doc",
                docId,
                j && Object.keys(j).slice(0, 5)
              );
            }
          }
        } catch (e) {
          console.warn("Embedding generation failed", e);
        }
      })();

      res.json({
        success: true,
        data: {
          id: docId,
          filename: file.originalname,
          mimetype: file.mimetype,
          extractedText,
        },
      });
    }
  );
});

// Very small RAG search: naive substring match over uploaded documents
app.get("/api/rag-search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ success: true, data: [] });
  (async function () {
    try {
      // If embeddings exist, perform semantic search
      const { url: EMB_URL, headers: EMB_HEADERS } = getEmbeddingConfig();
      if (EMB_URL) {
        const fetch = global.fetch || require("node-fetch");
        // get embedding for query
        const resp = await fetch(EMB_URL, {
          method: "POST",
          headers: Object.assign(
            { "Content-Type": "application/json" },
            EMB_HEADERS || {}
          ),
          body: JSON.stringify({ input: q }),
          timeout: 20000,
        });
        const j = await resp.json();
        let qvec = null;
        if (
          j &&
          j.data &&
          Array.isArray(j.data) &&
          j.data[0] &&
          (j.data[0].embedding || j.data[0].embeddings)
        )
          qvec = j.data[0].embedding || j.data[0].embeddings;
        else if (j && j.embedding) qvec = j.embedding;
        if (qvec && Array.isArray(qvec)) {
          // load stored embeddings
          db.all(
            "SELECT e.doc_id, e.vector, d.filename, d.filepath, d.mimetype, d.text FROM embeddings e JOIN documents d ON e.doc_id = d.id",
            [],
            (err, rows) => {
              if (err)
                return res
                  .status(500)
                  .json({ success: false, message: "DB error" });
              const scored = rows
                .map((r) => {
                  let v = [];
                  try {
                    v = JSON.parse(r.vector);
                  } catch (e) {
                    v = [];
                  }
                  const score = cosineSimilarity(qvec, v);
                  return {
                    score: score || 0,
                    doc: {
                      id: r.doc_id,
                      filename: r.filename,
                      filepath: r.filepath,
                      mimetype: r.mimetype,
                      text: r.text,
                    },
                  };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
              res.json({ success: true, data: scored });
            }
          );
          return;
        }
      }
      // Fallback to naive LIKE search
      const like = "%" + q + "%";
      db.all(
        "SELECT id, filename, filepath, mimetype, text, createdAt FROM documents WHERE text LIKE ? OR filename LIKE ? ORDER BY createdAt DESC LIMIT 10",
        [like, like],
        (err, rows) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "DB error" });
          res.json({ success: true, data: rows });
        }
      );
    } catch (e) {
      console.error("RAG search error", e);
      res.status(500).json({ success: false, message: "search error" });
    }
  })();
});

// Utility: cosine similarity between two arrays
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

// Endpoint to (re)index all documents by calling embedding service and storing vectors
app.post("/api/embeddings/index-all", async (req, res) => {
  try {
    const { url: EMB_URL, headers: EMB_HEADERS } = getEmbeddingConfig();
    if (!EMB_URL)
      return res
        .status(400)
        .json({
          success: false,
          message: "GEMINI_API_KEY or GEMINI_EMBEDDING_URL not set",
        });
    const fetch = global.fetch || require("node-fetch");
    db.all(
      "SELECT id, text, filename FROM documents",
      [],
      async (err, rows) => {
        if (err)
          return res.status(500).json({ success: false, message: "DB error" });
        for (const r of rows) {
          try {
            const resp = await fetch(EMB_URL, {
              method: "POST",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                EMB_HEADERS || {}
              ),
              body: JSON.stringify({ input: r.text || r.filename }),
              timeout: 20000,
            });
            const j = await resp.json();
            let vector = null;
            if (
              j &&
              j.data &&
              Array.isArray(j.data) &&
              j.data[0] &&
              (j.data[0].embedding || j.data[0].embeddings)
            )
              vector = j.data[0].embedding || j.data[0].embeddings;
            else if (j && j.embedding) vector = j.embedding;
            if (vector) {
              db.run(
                "INSERT INTO embeddings (doc_id, vector, createdAt) VALUES (?, ?, ?)",
                [r.id, JSON.stringify(vector), new Date().toISOString()]
              );
            }
          } catch (e) {
            console.warn("Index error for doc", r.id, e);
          }
        }
        res.json({ success: true, message: "Indexing started/completed" });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "index error" });
  }
});

// Simple chat endpoint: performs RAG search and returns a synthesized reply (prototype)
app.post("/api/chat", express.json(), async (req, res) => {
  const prompt =
    req.body && req.body.prompt ? String(req.body.prompt).trim() : "";
  if (!prompt)
    return res.status(400).json({ success: false, message: "Missing prompt" });

  try {
    const { url: GEMINI_URL, headers: GEMINI_HEADERS } = getEmbeddingConfig();
    if (!GEMINI_URL) {
      return res
        .status(500)
        .json({
          success: false,
          message: "GEMINI_API_KEY or GEMINI_EMBEDDING_URL not set",
        });
    }

    const fetch = global.fetch || require("node-fetch");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { ...GEMINI_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ input: prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({
          success: false,
          message: "Gemini API error",
          error: errorText,
        });
    }

    const data = await response.json();
    const reply =
      data && data.candidates && data.candidates[0] && data.candidates[0].output
        ? data.candidates[0].output
        : "No response";

    res.json({ success: true, reply });
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
});

// Route 404: return JSON for API requests, otherwise serve main HTML (SPA fallback)
app.use((req, res) => {
  if (req.path && req.path.startsWith("/api")) {
    return res
      .status(404)
      .json({ success: false, message: "Endpoint non trouvé" });
  }
  // If request seems to be for a file that exists, serve it; otherwise serve the main HTML
  const requested = path.join(__dirname, req.path);
  if (req.path && req.path.endsWith(".html") && fs.existsSync(requested)) {
    return res.sendFile(requested);
  }
  // SPA fallback to the main genidoc page
  return res.sendFile(path.join(__dirname, "genidoc.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur GeniDoc démarré sur le port ${PORT}`);
  console.log(`📱 Interface web: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  // Log masked embedding config (do not print the raw key)
  try {
    const rawKey = process.env.GEMINI_API_KEY || null;
    const rawUrl = process.env.GEMINI_EMBEDDING_URL || null;
    let masked = null;
    if (rawKey) {
      masked =
        rawKey.length > 8
          ? rawKey.slice(0, 4) + "..." + rawKey.slice(-4)
          : rawKey.replace(/.(?=.{4})/g, "*");
    }
    console.log("Embedding config:", {
      key: masked,
      url: rawUrl
        ? rawUrl.length > 60
          ? rawUrl.slice(0, 60) + "..."
          : rawUrl
        : null,
    });
  } catch (e) {
    /* ignore */
  }
});
