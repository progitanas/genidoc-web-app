const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "genidoc.sqlite");
const db = new sqlite3.Database(dbPath);

// Liste des établissements de santé du Maroc (Hôpitaux, CHU, CHI, Centres de Santé)
const establishments = [
  // Casablanca
  {
    nom: "CHU Ibn Rochd",
    specialite: "Hôpital Universitaire",
    adresse: "1, rue des Hôpitaux",
    ville: "Casablanca",
    quartier: "Casablanca Centre",
    telephone: "+212522488888",
    latitude: 33.5731,
    longitude: -7.5898,
  },
  {
    nom: "Clinique Ain Sebaa",
    specialite: "Clinique Privée",
    adresse: "Boulevard Ain Sebaa",
    ville: "Casablanca",
    quartier: "Ain Sebaa",
    telephone: "+212522351234",
    latitude: 33.63,
    longitude: -7.52,
  },
  {
    nom: "Centre de Santé Hay Mohammadi",
    specialite: "Centre de Santé",
    adresse: "Rue de Hay Mohammadi",
    ville: "Casablanca",
    quartier: "Hay Mohammadi",
    telephone: "+212522301234",
    latitude: 33.545,
    longitude: -7.65,
  },
  {
    nom: "Hôpital 20 Août",
    specialite: "Hôpital Public",
    adresse: "Boulevard 20 Août",
    ville: "Casablanca",
    quartier: "Belvedere",
    telephone: "+212522271234",
    latitude: 33.59,
    longitude: -7.62,
  },
  {
    nom: "Clinique des Iris",
    specialite: "Clinique Privée",
    adresse: "Rue des Iris",
    ville: "Casablanca",
    quartier: "Maarif",
    telephone: "+212522256789",
    latitude: 33.58,
    longitude: -7.63,
  },

  // Rabat
  {
    nom: "CHU Ibn Sina",
    specialite: "Hôpital Universitaire",
    adresse: "Avenue Al Madani Ibn Al Houceini",
    ville: "Rabat",
    quartier: "Agdal",
    telephone: "+212537681234",
    latitude: 33.9716,
    longitude: -6.8498,
  },
  {
    nom: "Hôpital Militaire Mohammed V",
    specialite: "Hôpital Militaire",
    adresse: "Avenue des FAR",
    ville: "Rabat",
    quartier: "Hay Riad",
    telephone: "+212537671234",
    latitude: 33.98,
    longitude: -6.87,
  },
  {
    nom: "Centre de Santé Akkari",
    specialite: "Centre de Santé",
    adresse: "Avenue Akkari",
    ville: "Rabat",
    quartier: "Akkari",
    telephone: "+212537401234",
    latitude: 33.99,
    longitude: -6.86,
  },
  {
    nom: "Clinique Al Amal",
    specialite: "Clinique Privée",
    adresse: "Rue Al Amal",
    ville: "Rabat",
    quartier: "Souissi",
    telephone: "+212537651234",
    latitude: 33.995,
    longitude: -6.88,
  },
  {
    nom: "Hôpital d'Enfants de Rabat",
    specialite: "Hôpital Pédiatrique",
    adresse: "Avenue Allal Ben Abdellah",
    ville: "Rabat",
    quartier: "Hassan",
    telephone: "+212537721234",
    latitude: 34.0209,
    longitude: -6.8417,
  },

  // Marrakech
  {
    nom: "CHU Mohammed VI",
    specialite: "Hôpital Universitaire",
    adresse: "Avenue Ibn Sina",
    ville: "Marrakech",
    quartier: "Amerchich",
    telephone: "+212524301234",
    latitude: 31.6295,
    longitude: -7.9811,
  },
  {
    nom: "Clinique du Sud",
    specialite: "Clinique Privée",
    adresse: "Avenue Mohamed VI",
    ville: "Marrakech",
    quartier: "Hivernage",
    telephone: "+212524431234",
    latitude: 31.62,
    longitude: -8.02,
  },
  {
    nom: "Centre de Santé Guéliz",
    specialite: "Centre de Santé",
    adresse: "Avenue Mohammed V",
    ville: "Marrakech",
    quartier: "Guéliz",
    telephone: "+212524301456",
    latitude: 31.634,
    longitude: -8.0089,
  },
  {
    nom: "Hôpital Ibn Tofail",
    specialite: "Hôpital Public",
    adresse: "Route de Casablanca",
    ville: "Marrakech",
    quartier: "Sidi Youssef Ben Ali",
    telephone: "+212524351234",
    latitude: 31.67,
    longitude: -7.99,
  },
  {
    nom: "Polyclinique Nakhil",
    specialite: "Polyclinique",
    adresse: "Quartier Nakhil",
    ville: "Marrakech",
    quartier: "Nakhil",
    telephone: "+212524361234",
    latitude: 31.65,
    longitude: -8.01,
  },

  // Fès
  {
    nom: "CHU Hassan II",
    specialite: "Hôpital Universitaire",
    adresse: "Route de Sefrou",
    ville: "Fès",
    quartier: "Atlas Fès",
    telephone: "+212535621234",
    latitude: 34.0181,
    longitude: -5.0078,
  },
  {
    nom: "Clinique Atlas Fès",
    specialite: "Clinique Privée",
    adresse: "Avenue Hassan II",
    ville: "Fès",
    quartier: "Ville Nouvelle",
    telephone: "+212535651234",
    latitude: 34.033,
    longitude: -4.9998,
  },
  {
    nom: "Centre de Santé Bensouda",
    specialite: "Centre de Santé",
    adresse: "Quartier Bensouda",
    ville: "Fès",
    quartier: "Bensouda",
    telephone: "+212535641234",
    latitude: 34.04,
    longitude: -5.01,
  },
  {
    nom: "Hôpital Ghassani",
    specialite: "Hôpital Public",
    adresse: "Avenue Allal Ben Abdellah",
    ville: "Fès",
    quartier: "Medina",
    telephone: "+212535631234",
    latitude: 34.0533,
    longitude: -4.9998,
  },
  {
    nom: "Polyclinique de Fès",
    specialite: "Polyclinique",
    adresse: "Route d'Immouzer",
    ville: "Fès",
    quartier: "Route d'Immouzer",
    telephone: "+212535661234",
    latitude: 34.025,
    longitude: -4.985,
  },

  // Tanger
  {
    nom: "CHI Mohammed VI",
    specialite: "Centre Hospitalier International",
    adresse: "Boulevard Mohammed VI",
    ville: "Tanger",
    quartier: "Boukhalef",
    telephone: "+212539941234",
    latitude: 35.7595,
    longitude: -5.833,
  },
  {
    nom: "Clinique Tanger Med",
    specialite: "Clinique Privée",
    adresse: "Zone Franche Tanger",
    ville: "Tanger",
    quartier: "Tanger Med",
    telephone: "+212539931234",
    latitude: 35.8,
    longitude: -5.7,
  },
  {
    nom: "Centre de Santé Beni Makada",
    specialite: "Centre de Santé",
    adresse: "Quartier Beni Makada",
    ville: "Tanger",
    quartier: "Beni Makada",
    telephone: "+212539371234",
    latitude: 35.76,
    longitude: -5.79,
  },
  {
    nom: "Hôpital Mohammed V",
    specialite: "Hôpital Public",
    adresse: "Avenue des FAR",
    ville: "Tanger",
    quartier: "Centre Ville",
    telephone: "+212539321234",
    latitude: 35.7673,
    longitude: -5.8009,
  },
  {
    nom: "Polyclinique Iberia",
    specialite: "Polyclinique",
    adresse: "Rue Iberia",
    ville: "Tanger",
    quartier: "Iberia",
    telephone: "+212539361234",
    latitude: 35.77,
    longitude: -5.81,
  },

  // Agadir
  {
    nom: "CHU Hassan II",
    specialite: "Hôpital Universitaire",
    adresse: "Avenue Mohammed VI",
    ville: "Agadir",
    quartier: "Agadir",
    telephone: "+212528841234",
    latitude: 30.4278,
    longitude: -9.5981,
  },
  {
    nom: "Clinique Al Kindy",
    specialite: "Clinique Privée",
    adresse: "Boulevard Hassan II",
    ville: "Agadir",
    quartier: "Centre Ville",
    telephone: "+212528821234",
    latitude: 30.4202,
    longitude: -9.5982,
  },
  {
    nom: "Centre de Santé Talborjt",
    specialite: "Centre de Santé",
    adresse: "Quartier Talborjt",
    ville: "Agadir",
    quartier: "Talborjt",
    telephone: "+212528831234",
    latitude: 30.43,
    longitude: -9.61,
  },
  {
    nom: "Hôpital Militaire Agadir",
    specialite: "Hôpital Militaire",
    adresse: "Route de Marrakech",
    ville: "Agadir",
    quartier: "Tilila",
    telephone: "+212528851234",
    latitude: 30.44,
    longitude: -9.58,
  },
  {
    nom: "Polyclinique de la Baie",
    specialite: "Polyclinique",
    adresse: "Front de Mer",
    ville: "Agadir",
    quartier: "Front de Mer",
    telephone: "+212528861234",
    latitude: 30.415,
    longitude: -9.605,
  },

  // Oujda
  {
    nom: "CHU Mohammed VI",
    specialite: "Hôpital Universitaire",
    adresse: "Boulevard Mohammed VI",
    ville: "Oujda",
    quartier: "Oujda",
    telephone: "+212536681234",
    latitude: 34.6814,
    longitude: -1.9086,
  },
  {
    nom: "Clinique Al Farabi",
    specialite: "Clinique Privée",
    adresse: "Avenue Hassan II",
    ville: "Oujda",
    quartier: "Centre Ville",
    telephone: "+212536701234",
    latitude: 34.685,
    longitude: -1.91,
  },
  {
    nom: "Centre de Santé Lazaret",
    specialite: "Centre de Santé",
    adresse: "Quartier Lazaret",
    ville: "Oujda",
    quartier: "Lazaret",
    telephone: "+212536691234",
    latitude: 34.69,
    longitude: -1.92,
  },
  {
    nom: "Hôpital Al Farabi",
    specialite: "Hôpital Public",
    adresse: "Avenue Allal Ben Abdellah",
    ville: "Oujda",
    quartier: "Al Qods",
    telephone: "+212536711234",
    latitude: 34.68,
    longitude: -1.9,
  },

  // Meknès
  {
    nom: "CHU Moulay Ismail",
    specialite: "Hôpital Universitaire",
    adresse: "Route d'Azrou",
    ville: "Meknès",
    quartier: "Toulal",
    telephone: "+212535521234",
    latitude: 33.8731,
    longitude: -5.5407,
  },
  {
    nom: "Clinique Belle Vue",
    specialite: "Clinique Privée",
    adresse: "Avenue Hassan II",
    ville: "Meknès",
    quartier: "Hamria",
    telephone: "+212535531234",
    latitude: 33.895,
    longitude: -5.55,
  },
  {
    nom: "Centre de Santé Hamria",
    specialite: "Centre de Santé",
    adresse: "Quartier Hamria",
    ville: "Meknès",
    quartier: "Hamria",
    telephone: "+212535541234",
    latitude: 33.89,
    longitude: -5.56,
  },
  {
    nom: "Hôpital Moulay Ismail",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Meknès",
    quartier: "Ville Nouvelle",
    telephone: "+212535551234",
    latitude: 33.888,
    longitude: -5.547,
  },

  // Tétouan
  {
    nom: "Hôpital Saniat Rmel",
    specialite: "Hôpital Public",
    adresse: "Avenue Saniat Rmel",
    ville: "Tétouan",
    quartier: "Saniat Rmel",
    telephone: "+212539961234",
    latitude: 35.5889,
    longitude: -5.3626,
  },
  {
    nom: "Clinique Al Andalous",
    specialite: "Clinique Privée",
    adresse: "Avenue Mohammed V",
    ville: "Tétouan",
    quartier: "Centre Ville",
    telephone: "+212539971234",
    latitude: 35.57,
    longitude: -5.37,
  },
  {
    nom: "Centre de Santé Mellaliyine",
    specialite: "Centre de Santé",
    adresse: "Quartier Mellaliyine",
    ville: "Tétouan",
    quartier: "Mellaliyine",
    telephone: "+212539981234",
    latitude: 35.58,
    longitude: -5.36,
  },

  // Kénitra
  {
    nom: "Hôpital Régional Mohammed V",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Kénitra",
    quartier: "Centre Ville",
    telephone: "+212537371234",
    latitude: 34.261,
    longitude: -6.5802,
  },
  {
    nom: "Clinique Al Andalous Kénitra",
    specialite: "Clinique Privée",
    adresse: "Avenue Hassan II",
    ville: "Kénitra",
    quartier: "Saknia",
    telephone: "+212537381234",
    latitude: 34.265,
    longitude: -6.585,
  },
  {
    nom: "Centre de Santé Ouled Oujih",
    specialite: "Centre de Santé",
    adresse: "Quartier Ouled Oujih",
    ville: "Kénitra",
    quartier: "Ouled Oujih",
    telephone: "+212537391234",
    latitude: 34.27,
    longitude: -6.59,
  },

  // Safi
  {
    nom: "Hôpital Mohammed V",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Safi",
    quartier: "Safi",
    telephone: "+212524621234",
    latitude: 32.2994,
    longitude: -9.2372,
  },
  {
    nom: "Clinique Atlas Safi",
    specialite: "Clinique Privée",
    adresse: "Route de Marrakech",
    ville: "Safi",
    quartier: "Route de Marrakech",
    telephone: "+212524631234",
    latitude: 32.305,
    longitude: -9.24,
  },
  {
    nom: "Centre de Santé Hay Moulay Youssef",
    specialite: "Centre de Santé",
    adresse: "Hay Moulay Youssef",
    ville: "Safi",
    quartier: "Hay Moulay Youssef",
    telephone: "+212524641234",
    latitude: 32.29,
    longitude: -9.23,
  },

  // El Jadida
  {
    nom: "Hôpital Mohammed V El Jadida",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "El Jadida",
    quartier: "El Jadida",
    telephone: "+212523341234",
    latitude: 33.2316,
    longitude: -8.5007,
  },
  {
    nom: "Clinique Chams",
    specialite: "Clinique Privée",
    adresse: "Boulevard de Fès",
    ville: "El Jadida",
    quartier: "Centre Ville",
    telephone: "+212523351234",
    latitude: 33.24,
    longitude: -8.51,
  },
  {
    nom: "Centre de Santé Sidi Bouzid",
    specialite: "Centre de Santé",
    adresse: "Quartier Sidi Bouzid",
    ville: "El Jadida",
    quartier: "Sidi Bouzid",
    telephone: "+212523361234",
    latitude: 33.235,
    longitude: -8.495,
  },

  // Beni Mellal
  {
    nom: "Hôpital Régional Beni Mellal",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Beni Mellal",
    quartier: "Beni Mellal",
    telephone: "+212523481234",
    latitude: 32.3372,
    longitude: -6.3498,
  },
  {
    nom: "Clinique Tadla",
    specialite: "Clinique Privée",
    adresse: "Avenue Mohammed V",
    ville: "Beni Mellal",
    quartier: "Centre Ville",
    telephone: "+212523491234",
    latitude: 32.34,
    longitude: -6.355,
  },
  {
    nom: "Centre de Santé Amal",
    specialite: "Centre de Santé",
    adresse: "Quartier Amal",
    ville: "Beni Mellal",
    quartier: "Amal",
    telephone: "+212523501234",
    latitude: 32.33,
    longitude: -6.36,
  },

  // Nador
  {
    nom: "Hôpital Hassani",
    specialite: "Hôpital Public",
    adresse: "Boulevard Hassan II",
    ville: "Nador",
    quartier: "Nador",
    telephone: "+212536601234",
    latitude: 35.1681,
    longitude: -2.9332,
  },
  {
    nom: "Clinique Rif",
    specialite: "Clinique Privée",
    adresse: "Avenue Mohammed V",
    ville: "Nador",
    quartier: "Centre Ville",
    telephone: "+212536611234",
    latitude: 35.17,
    longitude: -2.93,
  },
  {
    nom: "Centre de Santé Hay Massira",
    specialite: "Centre de Santé",
    adresse: "Hay Massira",
    ville: "Nador",
    quartier: "Hay Massira",
    telephone: "+212536621234",
    latitude: 35.165,
    longitude: -2.94,
  },

  // Settat
  {
    nom: "Hôpital Provincial Settat",
    specialite: "Hôpital Public",
    adresse: "Route de Casablanca",
    ville: "Settat",
    quartier: "Settat",
    telephone: "+212523401234",
    latitude: 33.001,
    longitude: -7.6164,
  },
  {
    nom: "Clinique Chaouia",
    specialite: "Clinique Privée",
    adresse: "Avenue Hassan II",
    ville: "Settat",
    quartier: "Centre Ville",
    telephone: "+212523411234",
    latitude: 33.005,
    longitude: -7.62,
  },
  {
    nom: "Centre de Santé Hay Essalam",
    specialite: "Centre de Santé",
    adresse: "Hay Essalam",
    ville: "Settat",
    quartier: "Hay Essalam",
    telephone: "+212523421234",
    latitude: 32.995,
    longitude: -7.61,
  },

  // Taza
  {
    nom: "Hôpital Provincial Taza",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Taza",
    quartier: "Taza",
    telephone: "+212535671234",
    latitude: 34.2133,
    longitude: -4.01,
  },
  {
    nom: "Centre de Santé Massira",
    specialite: "Centre de Santé",
    adresse: "Hay Massira",
    ville: "Taza",
    quartier: "Hay Massira",
    telephone: "+212535681234",
    latitude: 34.21,
    longitude: -4.015,
  },

  // Khémisset
  {
    nom: "Hôpital Mohammed V Khémisset",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Khémisset",
    quartier: "Khémisset",
    telephone: "+212537551234",
    latitude: 33.8244,
    longitude: -6.0661,
  },
  {
    nom: "Centre de Santé Al Amal",
    specialite: "Centre de Santé",
    adresse: "Hay Al Amal",
    ville: "Khémisset",
    quartier: "Al Amal",
    telephone: "+212537561234",
    latitude: 33.82,
    longitude: -6.07,
  },

  // Berkane
  {
    nom: "Hôpital Provincial Berkane",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Berkane",
    quartier: "Berkane",
    telephone: "+212536601234",
    latitude: 34.9181,
    longitude: -2.3222,
  },
  {
    nom: "Centre de Santé Massira Berkane",
    specialite: "Centre de Santé",
    adresse: "Hay Massira",
    ville: "Berkane",
    quartier: "Hay Massira",
    telephone: "+212536611234",
    latitude: 34.915,
    longitude: -2.325,
  },

  // Khouribga
  {
    nom: "Hôpital Provincial Khouribga",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Khouribga",
    quartier: "Khouribga",
    telephone: "+212523561234",
    latitude: 32.8811,
    longitude: -6.9063,
  },
  {
    nom: "Clinique Al Khawarizmi",
    specialite: "Clinique Privée",
    adresse: "Boulevard Hassan II",
    ville: "Khouribga",
    quartier: "Centre Ville",
    telephone: "+212523571234",
    latitude: 32.885,
    longitude: -6.91,
  },
  {
    nom: "Centre de Santé Hay Mohammadi",
    specialite: "Centre de Santé",
    adresse: "Hay Mohammadi",
    ville: "Khouribga",
    quartier: "Hay Mohammadi",
    telephone: "+212523581234",
    latitude: 32.875,
    longitude: -6.9,
  },

  // Larache
  {
    nom: "Hôpital Mohammed V Larache",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Larache",
    quartier: "Larache",
    telephone: "+212539521234",
    latitude: 35.1932,
    longitude: -6.1559,
  },
  {
    nom: "Centre de Santé Hay Essalam",
    specialite: "Centre de Santé",
    adresse: "Hay Essalam",
    ville: "Larache",
    quartier: "Hay Essalam",
    telephone: "+212539531234",
    latitude: 35.19,
    longitude: -6.16,
  },

  // Guelmim
  {
    nom: "Hôpital Hassan II Guelmim",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Guelmim",
    quartier: "Guelmim",
    telephone: "+212528871234",
    latitude: 29.0333,
    longitude: -10.0667,
  },
  {
    nom: "Centre de Santé Hay Al Qods",
    specialite: "Centre de Santé",
    adresse: "Hay Al Qods",
    ville: "Guelmim",
    quartier: "Hay Al Qods",
    telephone: "+212528881234",
    latitude: 29.03,
    longitude: -10.07,
  },

  // Essaouira
  {
    nom: "Hôpital Sidi Mohammed Ben Abdellah",
    specialite: "Hôpital Public",
    adresse: "Avenue El Qods",
    ville: "Essaouira",
    quartier: "Essaouira",
    telephone: "+212524471234",
    latitude: 31.5085,
    longitude: -9.7595,
  },
  {
    nom: "Clinique de l'Atlantique",
    specialite: "Clinique Privée",
    adresse: "Boulevard Mohammed V",
    ville: "Essaouira",
    quartier: "Centre Ville",
    telephone: "+212524481234",
    latitude: 31.51,
    longitude: -9.77,
  },
  {
    nom: "Centre de Santé Hay Dakhla",
    specialite: "Centre de Santé",
    adresse: "Hay Dakhla",
    ville: "Essaouira",
    quartier: "Hay Dakhla",
    telephone: "+212524491234",
    latitude: 31.505,
    longitude: -9.765,
  },

  // Tiznit
  {
    nom: "Hôpital Hassan II Tiznit",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Tiznit",
    quartier: "Tiznit",
    telephone: "+212528861234",
    latitude: 29.6975,
    longitude: -9.7317,
  },
  {
    nom: "Centre de Santé Massira",
    specialite: "Centre de Santé",
    adresse: "Hay Massira",
    ville: "Tiznit",
    quartier: "Hay Massira",
    telephone: "+212528871234",
    latitude: 29.695,
    longitude: -9.735,
  },

  // Ouarzazate
  {
    nom: "Hôpital Provincial Ouarzazate",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Ouarzazate",
    quartier: "Ouarzazate",
    telephone: "+212524881234",
    latitude: 30.9336,
    longitude: -6.937,
  },
  {
    nom: "Centre de Santé Tassoumaate",
    specialite: "Centre de Santé",
    adresse: "Quartier Tassoumaate",
    ville: "Ouarzazate",
    quartier: "Tassoumaate",
    telephone: "+212524891234",
    latitude: 30.93,
    longitude: -6.94,
  },

  // Errachidia
  {
    nom: "Hôpital Moulay Ali Cherif",
    specialite: "Hôpital Public",
    adresse: "Avenue Moulay Ali Cherif",
    ville: "Errachidia",
    quartier: "Errachidia",
    telephone: "+212535571234",
    latitude: 31.9314,
    longitude: -4.424,
  },
  {
    nom: "Centre de Santé Hay Al Massira",
    specialite: "Centre de Santé",
    adresse: "Hay Al Massira",
    ville: "Errachidia",
    quartier: "Hay Al Massira",
    telephone: "+212535581234",
    latitude: 31.93,
    longitude: -4.43,
  },

  // Taroudant
  {
    nom: "Hôpital Hassan II Taroudant",
    specialite: "Hôpital Public",
    adresse: "Route d'Agadir",
    ville: "Taroudant",
    quartier: "Taroudant",
    telephone: "+212528851234",
    latitude: 30.4728,
    longitude: -8.8779,
  },
  {
    nom: "Centre de Santé Hay Salam",
    specialite: "Centre de Santé",
    adresse: "Hay Salam",
    ville: "Taroudant",
    quartier: "Hay Salam",
    telephone: "+212528861234",
    latitude: 30.47,
    longitude: -8.88,
  },

  // Chefchaouen
  {
    nom: "Hôpital Mohammed V Chefchaouen",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Chefchaouen",
    quartier: "Chefchaouen",
    telephone: "+212539981234",
    latitude: 35.1688,
    longitude: -5.2631,
  },
  {
    nom: "Centre de Santé Hay Andalous",
    specialite: "Centre de Santé",
    adresse: "Hay Andalous",
    ville: "Chefchaouen",
    quartier: "Hay Andalous",
    telephone: "+212539991234",
    latitude: 35.165,
    longitude: -5.265,
  },

  // Al Hoceima
  {
    nom: "Hôpital Mohammed V Al Hoceima",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Al Hoceima",
    quartier: "Al Hoceima",
    telephone: "+212539981234",
    latitude: 35.2517,
    longitude: -3.9317,
  },
  {
    nom: "Centre de Santé Imzouren",
    specialite: "Centre de Santé",
    adresse: "Imzouren",
    ville: "Al Hoceima",
    quartier: "Imzouren",
    telephone: "+212539991234",
    latitude: 35.145,
    longitude: -3.855,
  },

  // Sidi Kacem
  {
    nom: "Hôpital Provincial Sidi Kacem",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Sidi Kacem",
    quartier: "Sidi Kacem",
    telephone: "+212537591234",
    latitude: 34.2214,
    longitude: -5.7081,
  },
  {
    nom: "Centre de Santé Hay Mohammadi",
    specialite: "Centre de Santé",
    adresse: "Hay Mohammadi",
    ville: "Sidi Kacem",
    quartier: "Hay Mohammadi",
    telephone: "+212537601234",
    latitude: 34.22,
    longitude: -5.71,
  },

  // Sidi Slimane
  {
    nom: "Hôpital Provincial Sidi Slimane",
    specialite: "Hôpital Public",
    adresse: "Avenue Mohammed V",
    ville: "Sidi Slimane",
    quartier: "Sidi Slimane",
    telephone: "+212537441234",
    latitude: 34.265,
    longitude: -5.9267,
  },
  {
    nom: "Centre de Santé Bir Rami",
    specialite: "Centre de Santé",
    adresse: "Bir Rami",
    ville: "Sidi Slimane",
    quartier: "Bir Rami",
    telephone: "+212537451234",
    latitude: 34.26,
    longitude: -5.93,
  },

  // Youssoufia
  {
    nom: "Hôpital Provincial Youssoufia",
    specialite: "Hôpital Public",
    adresse: "Avenue Hassan II",
    ville: "Youssoufia",
    quartier: "Youssoufia",
    telephone: "+212524661234",
    latitude: 32.2467,
    longitude: -8.5286,
  },
  {
    nom: "Centre de Santé Hay Al Wahda",
    specialite: "Centre de Santé",
    adresse: "Hay Al Wahda",
    ville: "Youssoufia",
    quartier: "Hay Al Wahda",
    telephone: "+212524671234",
    latitude: 32.245,
    longitude: -8.53,
  },
];

console.log(
  `📊 Insertion de ${establishments.length} établissements de santé au Maroc...\n`
);

const insertStmt = db.prepare(`
  INSERT INTO establishment (nom, specialite, adresse, ville, quartier, latitude, longitude, telephone, site_web, resume, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
establishments.forEach((est, index) => {
  const createdAt = new Date().toISOString();
  const resume = `${est.specialite} situé à ${est.ville}, ${est.quartier}. Contact: ${est.telephone}`;

  insertStmt.run(
    est.nom,
    est.specialite,
    est.adresse,
    est.ville,
    est.quartier,
    est.latitude,
    est.longitude,
    est.telephone,
    est.site_web || null,
    resume,
    createdAt,
    (err) => {
      if (err) {
        console.error(`❌ Erreur insertion ${est.nom}:`, err.message);
      } else {
        count++;
        if ((index + 1) % 10 === 0) {
          console.log(`✅ ${count} établissements insérés...`);
        }
      }
    }
  );
});

insertStmt.finalize(() => {
  console.log(`\n🎉 ${count} établissements insérés avec succès !`);
  console.log(`\n📍 Répartition par ville:`);

  db.all(
    `SELECT ville, COUNT(*) as count FROM establishment GROUP BY ville ORDER BY count DESC`,
    [],
    (err, rows) => {
      if (!err) {
        rows.forEach((row) => {
          console.log(`   ${row.ville}: ${row.count} établissements`);
        });
      }

      console.log(`\n📋 Types d'établissements:`);
      db.all(
        `SELECT specialite, COUNT(*) as count FROM establishment GROUP BY specialite ORDER BY count DESC`,
        [],
        (err, rows) => {
          if (!err) {
            rows.forEach((row) => {
              console.log(`   ${row.specialite}: ${row.count}`);
            });
          }

          db.close();
          console.log(`\n✅ Base de données mise à jour !`);
          console.log(
            `💡 Vous pouvez maintenant utiliser genidoc-map.html pour voir tous les établissements`
          );
        }
      );
    }
  );
});
