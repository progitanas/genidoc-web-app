const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './uploads';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base de données en mémoire (en production, utilisez une vraie base de données)
let appointments = [];
let doctors = [];
let medicalFacilities = [];
let patients = [];
let localAlerts = [];

// Données de test pour les médecins
doctors = [
    {
        id: uuidv4(),
        name: 'Dr. Marie Dubois',
        specialty: 'Cardiologue',
        email: 'marie.dubois@genidoc.fr',
        phone: '+33123456789',
        facilityId: null,
        schedule: {
            monday: ['09:00', '17:00'],
            tuesday: ['09:00', '17:00'],
            wednesday: ['09:00', '17:00'],
            thursday: ['09:00', '17:00'],
            friday: ['09:00', '17:00'],
            saturday: ['09:00', '13:00'],
            sunday: []
        },
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Dr. Jean Martin',
        specialty: 'Médecin généraliste',
        email: 'jean.martin@genidoc.fr',
        phone: '+33123456790',
        facilityId: null,
        schedule: {
            monday: ['08:00', '18:00'],
            tuesday: ['08:00', '18:00'],
            wednesday: ['08:00', '18:00'],
            thursday: ['08:00', '18:00'],
            friday: ['08:00', '18:00'],
            saturday: [],
            sunday: []
        },
        createdAt: new Date().toISOString()
    }
];

// Données de test pour les établissements
medicalFacilities = [
    {
        id: uuidv4(),
        name: 'Hôpital Central',
        type: 'hôpital',
        address: '123 Rue de la Santé, 75001 Paris',
        phone: '+33145678901',
        email: 'contact@hopital-central.fr',
        services: ['Urgences', 'Cardiologie', 'Chirurgie', 'Maternité'],
        coordinates: { lat: 48.8566, lng: 2.3522 },
        image: null,
        verified: true,
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Cabinet Médical Voltaire',
        type: 'cabinet',
        address: '45 Avenue Voltaire, 75011 Paris',
        phone: '+33143567890',
        email: 'contact@cabinet-voltaire.fr',
        services: ['Consultation générale', 'Dermatologie'],
        coordinates: { lat: 48.8566, lng: 2.3722 },
        image: null,
        verified: false,
        createdAt: new Date().toISOString()
    }
];

// Routes pour servir les pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'appintment.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/doctors', (req, res) => {
    res.sendFile(path.join(__dirname, 'doctors.html'));
});

app.get('/facilities', (req, res) => {
    res.sendFile(path.join(__dirname, 'facilities.html'));
});

// API Routes - Rendez-vous (existantes)
app.get('/api/appointments', (req, res) => {
    res.json({
        success: true,
        data: appointments,
        total: appointments.length
    });
});

app.get('/api/appointments/:id', (req, res) => {
    const appointment = appointments.find(a => a.id === req.params.id);
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Rendez-vous non trouvé'
        });
    }
    res.json({
        success: true,
        data: appointment
    });
});

app.post('/api/appointments', (req, res) => {
    try {
        const {
            fullName, email, phone, service, consultationType,
            date, time, mode, notes, doctorId, facilityId
        } = req.body;

        // Validation des champs obligatoires
        const required = ['fullName', 'email', 'phone', 'service', 'date', 'time', 'mode'];
        const missing = required.filter(field => !req.body[field] || String(req.body[field]).trim() === '');
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Champs manquants: ' + missing.join(', ')
            });
        }

        // Vérifier si le médecin existe
        if (doctorId) {
            const doctor = doctors.find(d => d.id === doctorId);
            if (!doctor) {
                return res.status(400).json({
                    success: false,
                    message: 'Médecin non trouvé'
                });
            }
        }

        // Vérifier si l'établissement existe
        if (facilityId) {
            const facility = medicalFacilities.find(f => f.id === facilityId);
            if (!facility) {
                return res.status(400).json({
                    success: false,
                    message: 'Établissement non trouvé'
                });
            }
        }

        // Vérifier disponibilité du créneau
        const appointmentDateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
        const conflictingAppointment = appointments.find(apt => {
            const existingDateTime = moment(`${apt.date} ${apt.time}`, 'YYYY-MM-DD HH:mm');
            const sameDoctor = doctorId && apt.doctorId === doctorId;
            const timeDiff = Math.abs(existingDateTime.diff(appointmentDateTime, 'minutes'));
            return sameDoctor && timeDiff < 30;
        });

        if (conflictingAppointment) {
            return res.status(409).json({
                success: false,
                message: 'Ce créneau n\'est pas disponible pour ce médecin'
            });
        }

        const newAppointment = {
            id: uuidv4(),
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            service: service.trim(),
            consultationType: consultationType || service,
            date, time, mode,
            notes: notes || '',
            doctorId: doctorId || null,
            facilityId: facilityId || null,
            status: 'confirmé',
            createdAt: new Date().toISOString(),
            when: appointmentDateTime.toISOString()
        };

        appointments.push(newAppointment);

        res.status(201).json({
            success: true,
            message: 'Rendez-vous créé avec succès',
            data: newAppointment
        });

    } catch (error) {
        console.error('Erreur lors de la création du rendez-vous:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

app.put('/api/appointments/:id', (req, res) => {
    try {
        const appointmentIndex = appointments.findIndex(a => a.id === req.params.id);
        
        if (appointmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Rendez-vous non trouvé'
            });
        }

        const updatedAppointment = {
            ...appointments[appointmentIndex],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        appointments[appointmentIndex] = updatedAppointment;

        res.json({
            success: true,
            message: 'Rendez-vous mis à jour avec succès',
            data: updatedAppointment
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

app.delete('/api/appointments/:id', (req, res) => {
    try {
        const appointmentIndex = appointments.findIndex(a => a.id === req.params.id);
        
        if (appointmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Rendez-vous non trouvé'
            });
        }

        const deletedAppointment = appointments.splice(appointmentIndex, 1)[0];

        res.json({
            success: true,
            message: 'Rendez-vous supprimé avec succès',
            data: deletedAppointment
        });

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// API Routes - Médecins
app.get('/api/doctors', (req, res) => {
    res.json({
        success: true,
        data: doctors,
        total: doctors.length
    });
});

app.get('/api/doctors/:id', (req, res) => {
    const doctor = doctors.find(d => d.id === req.params.id);
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Médecin non trouvé'
        });
    }
    res.json({
        success: true,
        data: doctor
    });
});

app.post('/api/doctors', (req, res) => {
    try {
        const { name, specialty, email, phone, facilityId, schedule } = req.body;

        const required = ['name', 'specialty', 'email', 'phone'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Champs manquants: ' + missing.join(', ')
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
                monday: ['09:00', '17:00'],
                tuesday: ['09:00', '17:00'],
                wednesday: ['09:00', '17:00'],
                thursday: ['09:00', '17:00'],
                friday: ['09:00', '17:00'],
                saturday: [],
                sunday: []
            },
            createdAt: new Date().toISOString()
        };

        doctors.push(newDoctor);

        res.status(201).json({
            success: true,
            message: 'Médecin ajouté avec succès',
            data: newDoctor
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout du médecin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

app.put('/api/doctors/:id', (req, res) => {
    try {
        const doctorIndex = doctors.findIndex(d => d.id === req.params.id);
        
        if (doctorIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Médecin non trouvé'
            });
        }

        const updatedDoctor = {
            ...doctors[doctorIndex],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        doctors[doctorIndex] = updatedDoctor;

        res.json({
            success: true,
            message: 'Médecin mis à jour avec succès',
            data: updatedDoctor
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// API Routes - Teleconsultation
app.get('/api/teleconsultation/doctors', (req, res) => {
    const availableDoctors = doctors.filter(d => d.availableForTeleconsultation);
    res.json({
        success: true,
        data: availableDoctors,
        total: availableDoctors.length
    });
});

// API Routes - Alertes Locales
app.get('/api/alerts', (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({
            success: false,
            message: 'Le paramètre `city` est requis.'
        });
    }

    const alertsForCity = localAlerts.filter(alert => alert.city.toLowerCase() === city.toLowerCase());

    res.json({
        success: true,
        data: alertsForCity.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
        total: alertsForCity.length
    });
});

app.post('/api/alerts/subscribe', (req, res) => {
    const { email, city } = req.body;

    if (!email || !city) {
        return res.status(400).json({
            success: false,
            message: 'L\'email et la ville sont requis.'
        });
    }

    // Simulation d'inscription
    console.log(`Nouvelle inscription aux alertes pour ${city}: ${email}`);

    res.json({
        success: true,
        message: `Vous avez bien été inscrit aux alertes pour la ville de ${city}.`
    });
});

app.post('/api/teleconsultation/request', (req, res) => {
    const { specialty } = req.body;

    if (!specialty) {
        return res.status(400).json({
            success: false,
            message: 'La spécialité est requise.'
        });
    }

    // Find an available doctor for the requested specialty
    const availableDoctor = doctors.find(d => 
        d.specialty.toLowerCase() === specialty.toLowerCase() && 
        d.availableForTeleconsultation
    );

    if (!availableDoctor) {
        return res.status(404).json({
            success: false,
            message: `Aucun médecin disponible pour la spécialité: ${specialty}`
        });
    }

    // Simulate creating a secure consultation room
    const consultationId = uuidv4();
    const consultationLink = `https://meet.jit.si/GeniDoc-${consultationId}`;

    res.json({
        success: true,
        message: 'Médecin trouvé et salle de consultation créée.',
        data: {
            doctor: {
});

app.delete('/api/doctors/:id', (req, res) => {
    try {
        const doctorIndex = doctors.findIndex(d => d.id === req.params.id);
        
        if (doctorIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Médecin non trouvé'
            });
        }

        const deletedDoctor = doctors.splice(doctorIndex, 1)[0];

        res.json({
            success: true,
            message: 'Médecin supprimé avec succès',
            data: deletedDoctor
        });

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// API Routes - Établissements médicaux
app.get('/api/facilities', (req, res) => {
    res.json({
        success: true,
        data: medicalFacilities,
        total: medicalFacilities.length
    });
});

app.get('/api/facilities/:id', (req, res) => {
    const facility = medicalFacilities.find(f => f.id === req.params.id);
    if (!facility) {
        return res.status(404).json({
            success: false,
            message: 'Établissement non trouvé'
        });
    }
    res.json({
        success: true,
        data: facility
    });
});

// Fonction de reconnaissance d'image simple (simulation)
async function analyzeImage(imagePath) {
    // Ici, vous intégreriez une vraie API de reconnaissance d'image
    // comme Google Vision API, Azure Computer Vision, etc.
    
    // Pour la démo, nous simulons la reconnaissance
    const imageBuffer = await sharp(imagePath)
        .jpeg({ quality: 80 })
        .toBuffer();
    
    // Simulation de résultats d'IA
    const mockResults = [
        {
            name: 'Hôpital Saint-Louis',
            type: 'hôpital',
            confidence: 0.85,
            detected_text: ['HOPITAL', 'SAINT-LOUIS', 'URGENCES']
        },
        {
            name: 'Cabinet Médical Republique',
            type: 'cabinet',
            confidence: 0.78,
            detected_text: ['CABINET', 'MEDICAL', 'DR', 'MARTIN']
        },
        {
            name: 'Clinique du Parc',
            type: 'clinique',
            confidence: 0.92,
            detected_text: ['CLINIQUE', 'DU', 'PARC', 'CHIRURGIE']
        }
    ];
    
    // Retourne un résultat aléatoire pour la démo
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    return {
        facility_detected: true,
        facility_name: randomResult.name,
        facility_type: randomResult.type,
        confidence: randomResult.confidence,
        detected_text: randomResult.detected_text,
        suggested_services: randomResult.type === 'hôpital' 
            ? ['Urgences', 'Consultation', 'Chirurgie', 'Radiologie']
            : ['Consultation générale', 'Vaccination', 'Dépistage']
    };
}

// Upload et analyse d'image pour établissement médical
app.post('/api/facilities/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        const imagePath = req.file.path;
        
        // Analyser l'image avec l'IA
        const analysisResult = await analyzeImage(imagePath);
        
        if (analysisResult.facility_detected) {
            // Créer automatiquement l'établissement détecté
            const newFacility = {
                id: uuidv4(),
                name: analysisResult.facility_name,
                type: analysisResult.facility_type,
                address: '', // À compléter par l'utilisateur
                phone: '',
                email: '',
                services: analysisResult.suggested_services,
                coordinates: null,
                image: `/uploads/${req.file.filename}`,
                verified: false,
                confidence: analysisResult.confidence,
                detected_text: analysisResult.detected_text,
                createdAt: new Date().toISOString(),
                createdBy: 'ai_detection'
            };

            medicalFacilities.push(newFacility);

            res.json({
                success: true,
                message: 'Établissement détecté et ajouté automatiquement',
                data: {
                    facility: newFacility,
                    analysis: analysisResult
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Aucun établissement médical détecté dans cette image',
                data: { analysis: analysisResult }
            });
        }

    } catch (error) {
        console.error('Erreur lors de l\'analyse d\'image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'analyse de l\'image'
        });
    }
});

app.post('/api/facilities', (req, res) => {
    try {
        const { name, type, address, phone, email, services, coordinates } = req.body;

        const required = ['name', 'type', 'address'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Champs manquants: ' + missing.join(', ')
            });
        }

        const newFacility = {
            id: uuidv4(),
            name: name.trim(),
            type: type.trim(),
            address: address.trim(),
            phone: phone ? phone.trim() : '',
            email: email ? email.trim().toLowerCase() : '',
            services: Array.isArray(services) ? services : [],
            coordinates: coordinates || null,
            image: null,
            verified: false,
            createdAt: new Date().toISOString(),
            createdBy: 'manual'
        };

        medicalFacilities.push(newFacility);

        res.status(201).json({
            success: true,
            message: 'Établissement ajouté avec succès',
            data: newFacility
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

app.put('/api/facilities/:id', (req, res) => {
    try {
        const facilityIndex = medicalFacilities.findIndex(f => f.id === req.params.id);
        
        if (facilityIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }

        const updatedFacility = {
            ...medicalFacilities[facilityIndex],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        medicalFacilities[facilityIndex] = updatedFacility;

        res.json({
            success: true,
            message: 'Établissement mis à jour avec succès',
            data: updatedFacility
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

app.delete('/api/facilities/:id', (req, res) => {
    try {
        const facilityIndex = medicalFacilities.findIndex(f => f.id === req.params.id);
        
        if (facilityIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }

        const deletedFacility = medicalFacilities.splice(facilityIndex, 1)[0];

        res.json({
            success: true,
            message: 'Établissement supprimé avec succès',
            data: deletedFacility
        });

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour les créneaux disponibles (mise à jour pour inclure les médecins)
app.get('/api/available-slots/:date/:doctorId?', (req, res) => {
    try {
        const { date, doctorId } = req.params;
        const requestedDate = moment(date);
        
        if (!requestedDate.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'Format de date invalide'
            });
        }

        // Générer les créneaux de base
        const allSlots = [];
        for (let hour = 9; hour < 17; hour++) {
            allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // Si un médecin est spécifié, filtrer selon ses horaires
        if (doctorId) {
            const doctor = doctors.find(d => d.id === doctorId);
            if (doctor) {
                const dayName = requestedDate.format('dddd').toLowerCase();
                const doctorSchedule = doctor.schedule[dayName];
                
                if (!doctorSchedule || doctorSchedule.length === 0) {
                    return res.json({
                        success: true,
                        data: {
                            date,
                            availableSlots: [],
                            bookedSlots: [],
                            message: 'Le médecin ne consulte pas ce jour-là'
                        }
                    });
                }
            }
        }

        // Filtrer les créneaux déjà pris
        const bookedSlots = appointments
            .filter(apt => {
                const sameDate = apt.date === date;
                const sameDoctor = !doctorId || apt.doctorId === doctorId;
                return sameDate && sameDoctor;
            })
            .map(apt => apt.time);

        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({
            success: true,
            data: {
                date,
                doctorId: doctorId || null,
                availableSlots,
                bookedSlots
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des créneaux:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour les statistiques (mise à jour)
app.get('/api/stats', (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const thisWeek = moment().startOf('week');
        const thisMonth = moment().startOf('month');

        const stats = {
            appointments: {
                total: appointments.length,
                today: appointments.filter(apt => apt.date === today).length,
                thisWeek: appointments.filter(apt => moment(apt.date).isSameOrAfter(thisWeek)).length,
                thisMonth: appointments.filter(apt => moment(apt.date).isSameOrAfter(thisMonth)).length,
                byService: {},
                byMode: {}
            },
            doctors: {
                total: doctors.length,
                bySpecialty: {}
            },
            facilities: {
                total: medicalFacilities.length,
                verified: medicalFacilities.filter(f => f.verified).length,
                aiDetected: medicalFacilities.filter(f => f.createdBy === 'ai_detection').length,
                byType: {}
            }
        };

        // Statistiques par service et mode
        appointments.forEach(apt => {
            stats.appointments.byService[apt.service] = (stats.appointments.byService[apt.service] || 0) + 1;
            stats.appointments.byMode[apt.mode] = (stats.appointments.byMode[apt.mode] || 0) + 1;
        });

        // Statistiques par spécialité
        doctors.forEach(doc => {
            stats.doctors.bySpecialty[doc.specialty] = (stats.doctors.bySpecialty[doc.specialty] || 0) + 1;
        });

        // Statistiques par type d'établissement
        medicalFacilities.forEach(facility => {
            stats.facilities.byType[facility.type] = (stats.facilities.byType[facility.type] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fichier trop volumineux. Taille maximum: 5MB'
            });
        }
    }
    
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Une erreur inattendue s\'est produite'
    });
});

// Route 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint non trouvé'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur GeniDoc démarré sur le port ${PORT}`);
    console.log(`📱 Interface web: http://localhost:${PORT}`);
    console.log(`👨‍⚕️ Gestion médecins: http://localhost:${PORT}/doctors`);
    console.log(`🏥 Gestion établissements: http://localhost:${PORT}/facilities`);
    console.log(`⚙️ Administration: http://localhost:${PORT}/admin`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});