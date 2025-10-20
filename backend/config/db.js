import mongoose from "mongoose";

// connectDB: conecta a MongoDB usando MONGODB_URI o MONGO_URI
// Devuelve la promesa de conexión para que el servidor pueda esperar antes de listen
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    const msg = "Falta la variable de entorno MONGODB_URI o MONGO_URI. Por favor configúrala.";
    console.error(msg);
    throw new Error(msg);
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
    throw error;
  }
};
