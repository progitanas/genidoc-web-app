// --- Multi-DB: Création des tables et migrations critiques pour MySQL ---
async function initDatabaseCompat(recreate = false) {
  if (dbType !== "mysql") return;
  const exec = (sql) =>
    new Promise((resolve, reject) =>
      db.run(sql, [], (err) => (err ? reject(err) : resolve()))
    );
  if (recreate) {
    await exec("DROP TABLE IF EXISTS patients");
    await exec("DROP TABLE IF EXISTS users");
  }
  // Types adaptés pour MySQL
  await exec(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    role VARCHAR(32) DEFAULT 'PATIENT',
    createdAt DATETIME,
    phone VARCHAR(32)
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(64) UNIQUE,
    genidocId VARCHAR(32) UNIQUE,
    birthdate VARCHAR(32),
    createdAt DATETIME,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(64) UNIQUE,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    phone VARCHAR(32),
    licenseNumber VARCHAR(64) UNIQUE,
    specialty VARCHAR(100),
    bio TEXT,
    createdAt DATETIME,
    birthdate VARCHAR(32),
    establishmentId VARCHAR(64),
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(establishmentId) REFERENCES establishments(id) ON DELETE SET NULL
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    appointmentNumber VARCHAR(32) UNIQUE,
    fullName VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(32),
    service VARCHAR(100),
    consultationType VARCHAR(100),
    date VARCHAR(32),
    time VARCHAR(32),
    mode VARCHAR(32),
    notes TEXT,
    status VARCHAR(32),
    patientId VARCHAR(64),
    doctorId VARCHAR(64),
    userId VARCHAR(64),
    facilityId VARCHAR(64),
    appointmentType VARCHAR(32),
    scheduledDateTime VARCHAR(32),
    establishment_id VARCHAR(64),
    establishment_name VARCHAR(100),
    establishment_ville VARCHAR(100),
    establishment_specialite VARCHAR(100),
    genidocId VARCHAR(32),
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY(doctorId) REFERENCES doctors(id) ON DELETE SET NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(facilityId) REFERENCES establishments(id) ON DELETE SET NULL
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(64),
    type VARCHAR(32),
    title VARCHAR(255),
    message TEXT,
    isRead TINYINT DEFAULT 0,
    createdAt DATETIME,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    transactionId VARCHAR(64) UNIQUE,
    appointmentId VARCHAR(64),
    userId VARCHAR(64),
    amount DECIMAL(10,2),
    currency VARCHAR(8),
    status VARCHAR(32),
    createdAt DATETIME
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id VARCHAR(64) PRIMARY KEY,
    token VARCHAR(512) UNIQUE,
    userId VARCHAR(64),
    expiresAt DATETIME,
    createdAt DATETIME
  )`);
  await exec(`CREATE TABLE IF NOT EXISTS establishments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    city VARCHAR(100),
    address VARCHAR(255),
    phone VARCHAR(32),
    adminUserId VARCHAR(64),
    createdAt DATETIME,
    specialite VARCHAR(100),
    FOREIGN KEY(adminUserId) REFERENCES users(id) ON DELETE SET NULL
  )`);
  // Seed admin si absent
  db.get(
    `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`,
    [],
    (err, row) => {
      if (err) return console.error("DB seed error", err);
      if (!row) {
        const adminId = uuidv4();
        const hashed = bcrypt.hashSync("AdminGeniDoc2025!", 10);
        db.run(
          `INSERT INTO users (id, email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            adminId,
            "admin@genidoc.ma",
            hashed,
            "Admin",
            "GeniDoc",
            "ADMIN",
            new Date().toISOString(),
          ],
          (e) => {
            if (e) console.error("Failed to seed admin", e);
            else
              console.log(
                "Seeded default admin: admin@genidoc.ma / AdminGeniDoc2025!"
              );
          }
        );
      }
    }
  );
}
