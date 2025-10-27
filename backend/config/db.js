import mongoose from "mongoose";

// connectDB: conecta a MongoDB usando MONGODB_URI o MONGO_URI
// Devuelve la promesa de conexión para que el servidor pueda esperar antes de listen
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGODB_URI / MONGO_URI no configurada. Se iniciará el servidor en modo 'sin DB' (se usará almacenamiento local de respaldo).");
    return null;
  }

  try {
    // Opciones actuales son compatibles con mongoose >=5; en v6 algunas son implícitas
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB conectada correctamente");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB - conexión fallida:", error.message || error);
    // No lanzar: devolvemos null para permitir que el servidor arranque en modo degradado
    return null;
  }
};
