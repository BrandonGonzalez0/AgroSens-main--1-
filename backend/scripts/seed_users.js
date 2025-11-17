import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI/MONGO_URI no configurado.');
  process.exit(1);
}

const users = [
  {
    nombre: 'Administrador AgroSens',
    email: 'admin@agrosens.cl',
    password_hash: '$2a$10$OKGapI33uKIfegzb9cv7fO2JQoExEZrQaIO/wV/Ths1x2tJtuSKaS',
    rol: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    nombre: 'Agricultor Demo',
    email: 'agricultor@agrosens.cl',
    password_hash: '$2a$10$aA32zTOp1coN4WXVYtMaQeGSBRSbBLgJGHZly/BoE2Xgp4IOWWKku',
    rol: 'agricultor',
    createdAt: new Date(),
    updatedAt: new Date()
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

    // Insertar usuarios si no existen
    for (const u of users) {
      const exists = await db.collection('users').findOne({ email: u.email });
      if (!exists) {
        await db.collection('users').insertOne(u);
        console.log('Usuario insertado:', u.email);
      } else {
        console.log('Usuario ya existe:', u.email);
      }
    }

    console.log('Seed completado.');
    process.exit(0);
  } catch (e) {
    console.error('Error en seed_users:', e?.message || e);
    process.exit(1);
  }
}

run();
