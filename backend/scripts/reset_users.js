import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Carga variables de entorno desde backend/.env usando el cwd actual
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI/MONGO_URI no configurado.');
  process.exit(1);
}

const now = new Date();
const users = [
  {
    nombre: 'Administrador AgroSens',
    email: 'admin@agrosens.cl',
    password_hash: '$2a$10$OKGapI33uKIfegzb9cv7fO2JQoExEZrQaIO/wV/Ths1x2tJtuSKaS', // admin123
    rol: 'admin',
    updatedAt: now
  },
  {
    nombre: 'Agricultor Demo',
    email: 'agricultor@agrosens.cl',
    password_hash: '$2a$10$aA32zTOp1coN4WXVYtMaQeGSBRSbBLgJGHZly/BoE2Xgp4IOWWKku', // agro123
    rol: 'agricultor',
    updatedAt: now
  }
];

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // Crear colección si no existe
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('users');
      console.log('Colección users creada');
    }

    // Índice único en email
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('Índice único en email aplicado');

    for (const u of users) {
      const res = await db.collection('users').updateOne(
        { email: u.email },
        { $set: { nombre: u.nombre, password_hash: u.password_hash, rol: u.rol, updatedAt: u.updatedAt }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      console.log('Usuario actualizado:', u.email, res.upsertedCount ? '(creado)' : '(actualizado)');
    }

    console.log('Reset de usuarios completado.');
    process.exit(0);
  } catch (e) {
    console.error('Error en reset_users:', e?.message || e);
    process.exit(1);
  }
}

run();
