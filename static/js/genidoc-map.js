// Browser helpers for genidoc-map (attach functions to window)
(function (global) {
  function extractPhones(text) {
    const phoneRegex =
      /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?[\d\s.-]{6,}/g;
    const matches = (text || "").match(phoneRegex) || [];
    return [...new Set(matches.map((s) => s.trim()))].slice(0, 5);
  }

  function extractEmails(text) {
    const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    return (text || "").match(re) || [];
  }

  function extractUrls(text) {
    const re = /(https?:\/\/[^\s]+)/g;
    return (text || "").match(re) || [];
  }

  function guessNameAndSpecialty(text) {
    if (!text) return { name: "", specialty: "" };
    const parts = text
      .split(/[\n,–\-]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    let name = parts[0] || "";
    let specialty = "";
    const keywords = [
      "médecin",
      "dentiste",
      "pharmaci",
      "infirm",
      "clinique",
      "laboratoire",
      "chirurg",
      "ophtalm",
      "pédiatr",
      "gynécolog",
      "cardio",
      "psy",
    ];
    for (let p of parts.slice(0, 3)) {
      for (let k of keywords) {
        if (p.toLowerCase().includes(k)) {
          specialty = p;
          if (p !== name) name = parts[0];
        }
      }
    }
    return { name, specialty };
  }

  function extractAddress(text) {
    if (!text) return "";
    const streetRegex =
      /(\d{1,4}\s?[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+\s+(Rue|Av|Avenue|Boulevard|Bd|Place|Impasse|Ruelle|Lot|Chemin|Cours|Square)\b[^\n,]*)/i;
    const match = text.match(streetRegex);
    if (match) return match[0].trim();
    const cityRegex =
      /\b(Maarif|Casablanca|Rabat|Marrakech|Fès|Fez|Tanger|Tétouan)\b/i;
    const cityMatch = text.match(cityRegex);
    if (cityMatch) return (text.split(cityMatch[0])[0] + cityMatch[0]).trim();
    return "";
  }

  function buildJsonLd(obj) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "MedicalOrganization",
      name: obj.name || undefined,
      description: obj.notes || undefined,
      address: obj.address || undefined,
      telephone: obj.phone && obj.phone.length ? obj.phone : undefined,
      url: obj.contact || undefined,
    };
    Object.keys(schema).forEach(
      (k) => schema[k] === undefined && delete schema[k]
    );
    return JSON.stringify(schema, null, 2);
  }

  // expose helpers
  global.extractPhones = extractPhones;
  global.extractEmails = extractEmails;
  global.extractUrls = extractUrls;
  global.guessNameAndSpecialty = guessNameAndSpecialty;
  global.extractAddress = extractAddress;
  global.buildJsonLd = buildJsonLd;

  // also provide a namespace
  global.genidocMapHelpers = {
    extractPhones,
    extractEmails,
    extractUrls,
    guessNameAndSpecialty,
    extractAddress,
    buildJsonLd,
  };
})(window);
