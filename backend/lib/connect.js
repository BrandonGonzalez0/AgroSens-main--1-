import mongoose from 'mongoose';

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export default async function connectToDatabase(uri) {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = {};
    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
