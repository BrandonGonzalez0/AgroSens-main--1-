import mongoose from 'mongoose';

const MetricStateSchema = new mongoose.Schema({
  status: { type: String, enum: ['ok','manual','no_sensor'], default: 'no_sensor' },
  lastValue: { type: mongoose.Schema.Types.Mixed, default: null },
  lastSeen: { type: Date, default: null }
}, { _id: false });

const SensorSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true, unique: true },
  metrics: {
    soilMoisture: { type: MetricStateSchema, default: () => ({}) },
    temperature: { type: MetricStateSchema, default: () => ({}) },
    airHumidity: { type: MetricStateSchema, default: () => ({}) },
    ph: { type: MetricStateSchema, default: () => ({}) }
  },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
});

SensorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Sensor || mongoose.model('Sensor', SensorSchema);
