import mongoose from 'mongoose';

const SensorReadingSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: () => new Date(), index: true },
  humedad_suelo: { type: Number, min: 0, max: 100, default: null },
  temperatura_aire: { type: Number, default: null },
  humedad_aire: { type: Number, default: null },
  ph_suelo: { type: Number, min: 0, max: 14, default: null },
  raw: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.SensorReading || mongoose.model('Sensorreadings', SensorReadingSchema);
