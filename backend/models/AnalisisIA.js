import mongoose from 'mongoose';

const analisisSchema = new mongoose.Schema({
  deviceId: String,
  cultivo: String,
  timestamp: { type: Date, default: Date.now },
  verdict: String,
  estimateDays: Number,
  avgColor: { r: Number, g: Number, b: Number },
  greenRatio: Number,
  redPortion: Number,
  bboxArea: Number,
  areaRatio: Number,
  image: Buffer,
  mlPredictions: [mongoose.Schema.Types.Mixed],
  heatmap: Buffer,
  raw: mongoose.Schema.Types.Mixed
}, { collection: 'analisis_ia', timestamps: true });

export default mongoose.models.AnalisisIA || mongoose.model('AnalisisIA', analisisSchema);
