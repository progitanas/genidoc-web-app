// OCR + IA: Analyse d’ordonnances (API)
// POST /api/ocr-ordonnance
// Handles file upload, OCR extraction, medication/posology parsing, and returns IA/OCR result.
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Tesseract = require("tesseract.js");
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

router.post(
  "/ocr-ordonnance",
  upload.single("ordonnance"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Aucun fichier reçu." });
      }
      const filePath = req.file.path;
      // 1. OCR multilingue (français + arabe)
      let text = "";
      try {
        // Essai FR puis AR (Tesseract doit être entraîné pour l'arabe)
        const fr = await Tesseract.recognize(filePath, "fra", {
          logger: (m) => {},
        });
        text = fr.data.text;
        if (text.replace(/\s/g, "").length < 10) {
          // Si peu de texte, tenter arabe
          const ar = await Tesseract.recognize(filePath, "ara", {
            logger: (m) => {},
          });
          if (
            ar.data.text.replace(/\s/g, "").length >
            text.replace(/\s/g, "").length
          ) {
            text = ar.data.text;
          }
        }
      } catch (ocrErr) {
        text = "";
      }

      // 2. Extraction IA avancée multilingue
      // Listes simulées FR/AR (en vrai: base de données ou API médicale multilingue)
      const MEDICAMENTS_FR = [
        "Doliprane",
        "Paracétamol",
        "Ibuprofène",
        "Amoxicilline",
        "Augmentin",
        "Aspirine",
        "Efferalgan",
        "Spasfon",
        "Cefixime",
        "Ceftriaxone",
        "Metformine",
        "Lantus",
        "Insuline",
        "Omeprazole",
        "Ramipril",
        "Amlodipine",
        "Simvastatine",
        "Atorvastatine",
      ];
      const MEDICAMENTS_AR = [
        "باراسيتامول",
        "ايبوبروفين",
        "اموكسيسيلين",
        "اسبريين",
        "افيرالغان",
        "سباسفون",
        "سيفيكسيم",
        "سيفترياكسون",
        "ميتفورمين",
        "انسولين",
        "اوميبرازول",
        "راميبريل",
        "املوديبين",
        "سيمفاستاتين",
        "اتورفاستاتين",
      ];
      // Extraction par ligne, détection nom, posologie, forme, fréquence (FR/AR)
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      let medicaments = [];
      let alertes = [];
      const foundNames = new Set();
      // Fuzzy match utilitaire (levenshtein simple)
      function fuzzyMatch(str, arr) {
        str = str.toLowerCase();
        let best = null,
          minDist = 3;
        for (const med of arr) {
          const medLow = med.toLowerCase();
          if (str.includes(medLow)) return med;
          // Levenshtein (distance <=2)
          let d = 0,
            i = 0;
          while (
            i < Math.min(str.length, medLow.length) &&
            str[i] === medLow[i]
          )
            i++;
          d =
            Math.abs(str.length - medLow.length) + (i < medLow.length ? 1 : 0);
          if (d < minDist) {
            minDist = d;
            best = med;
          }
        }
        return minDist <= 2 ? best : null;
      }

      // NLP enrichi : extraction d'entités médicales par pattern
      function extractEntities(line) {
        // Médicaments (mot majuscule ou connu)
        const medPattern = /([A-ZÉÈÎÂÔÛÇ][a-zéèêàâôûçîïüëöœA-Z0-9\-']{2,})/g;
        // Posologie (nombre + unité)
        const posoPattern =
          /(\d+\s?(mg|ملغ|ml|مل|g|غ|UI|وحدة|mcg|µg|ميكروغرام))/gi;
        // Fréquence
        const freqPattern =
          /(\d+\s?(x|fois)\s?(par\s?jour)?|matin|soir|nuit|toutes? les? \d+ ?h|مرة|مرتين|ثلاث|يوميا|صباحا|مساء)/gi;
        // Forme galénique
        const formePattern =
          /(comprim[ée]s?|gélules?|sirop|pommade|injection|sachet|capsule|solution|spray|قرص|أقراص|شراب|حقنة|كبسولة|مرهم)/gi;
        return {
          medicaments: Array.from(line.matchAll(medPattern)).map((m) => m[1]),
          posologies: Array.from(line.matchAll(posoPattern)).map((m) => m[1]),
          frequences: Array.from(line.matchAll(freqPattern)).map((m) => m[1]),
          formes: Array.from(line.matchAll(formePattern)).map((m) => m[1]),
        };
      }
      lines.forEach((line) => {
        // Extraction contextuelle enrichie
        const entities = extractEntities(line);
        // Médicaments connus (FR/AR)
        const medsFr = MEDICAMENTS_FR.filter((med) =>
          line.toLowerCase().includes(med.toLowerCase())
        );
        const medsAr = MEDICAMENTS_AR.filter((med) => line.includes(med));
        let meds = [...medsFr, ...medsAr];
        // Fuzzy match si rien trouvé
        if (meds.length === 0) {
          const fuzzy = fuzzyMatch(line, MEDICAMENTS_FR.concat(MEDICAMENTS_AR));
          if (fuzzy) meds.push(fuzzy);
        }
        // Pour chaque médicament détecté (connu ou pattern)
        if (meds.length === 0 && entities.medicaments.length > 0) {
          meds = entities.medicaments;
        }
        if (meds.length === 0) {
          // Extraction brute si pas de nom connu mais posologie présente
          if (entities.posologies.length > 0) {
            medicaments.push({
              nom: null,
              posologie: entities.posologies[0],
              forme: entities.formes[0] || null,
              frequence: entities.frequences[0] || null,
              ligne: line,
              note: "Médicament non reconnu, posologie détectée",
            });
          }
        } else {
          meds.forEach((found) => {
            if (!foundNames.has(found)) {
              medicaments.push({
                nom: found,
                posologie: entities.posologies[0] || null,
                forme: entities.formes[0] || null,
                frequence: entities.frequences[0] || null,
                ligne: line,
              });
              foundNames.add(found);
            }
          });
        }
      });
      // 3. Alertes IA avancées (interactions, allergies, surdosage, multilingue)
      // Ex: interaction fictive FR/AR
      const noms = medicaments.map((m) => m.nom.toLowerCase());
      if (
        (noms.includes("ibuprofène") && noms.includes("aspirine")) ||
        (noms.includes("ايبوبروفين") && noms.includes("اسبريين"))
      ) {
        alertes.push(
          "Association Ibuprofène/Aspirine déconseillée (risque hémorragique) / لا ينصح بجمع ايبوبروفين مع اسبريين (خطر النزيف)"
        );
      }
      medicaments.forEach((med) => {
        if (
          med.posologie &&
          (/1000\s?mg/.test(med.posologie) || /1000\s?ملغ/.test(med.posologie))
        ) {
          alertes.push(`Dose élevée détectée pour ${med.nom}`);
        }
        if (
          (med.nom.toLowerCase() === "metformine" || med.nom === "ميتفورمين") &&
          med.posologie &&
          />\s?2000\s?mg|>\s?2000\s?ملغ/.test(med.posologie)
        ) {
          alertes.push(
            "Surdosage possible de Metformine / جرعة زائدة محتملة من ميتفورمين"
          );
        }
      });
      // 4. Nettoyage fichier uploadé
      fs.unlink(filePath, () => {});
      res.json({
        success: true,
        medicaments,
        alertes,
        texte: text.trim(),
      });
    } catch (err) {
      console.error("Erreur OCR ordonnance:", err);
      res
        .status(500)
        .json({ success: false, message: "Erreur lors de l'analyse OCR/IA." });
    }
  }
);

module.exports = router;
