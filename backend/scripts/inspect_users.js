import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI/MONGO_URI no configurado.');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri);
    const users = await User.find({ email: { $in: ['admin@agrosens.cl', 'agricultor@agrosens.cl'] } }).lean();
    for (const u of users) {
      console.log({ email: u.email, rol: u.rol, password_hash: u.password_hash });
    }
    if (users.length === 0) console.log('No se encontraron usuarios objetivo.');
    process.exit(0);
  } catch (e) {
    console.error('Error inspeccionando usuarios:', e?.message || e);
    process.exit(1);
  }
})();
