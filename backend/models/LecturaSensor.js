import mongoose from 'mongoose';

const lecturaSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  ph: Number,
  soilMoisture: Number,
  temperature: Number,
  raw: mongoose.Schema.Types.Mixed
}, { collection: 'lecturas_sensores', timestamps: true });

export default mongoose.models.LecturaSensor || mongoose.model('LecturaSensor', lecturaSchema);
