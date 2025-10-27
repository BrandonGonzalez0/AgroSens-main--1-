import mongoose from "mongoose";

const analisisIASchema = new mongoose.Schema({
  deviceId: { type: String, default: 'camera-analysis' },
  cultivo: String,
  verdict: String,
  confidence: Number,
  daysToMaturity: Number,
  image: Buffer,
  heatmap: Buffer,
  heatmapEnabled: { type: Boolean, default: false },
  avgColor: {
    r: Number,
    g: Number,
    b: Number
  },
  greenRatio: Number,
  redPortion: Number,
  mlPredictions: [{
    className: String,
    probability: Number
  }],
  raw: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  // Legacy fields for backward compatibility
  tipo: { type: String, enum: ["Madurez", "plagas"] },
  resultado: String,
  imagenUrl: String,
  fecha: { type: Date, default: Date.now }
});

export default mongoose.models.AnalisisIA || mongoose.model("AnalisisIA", analisisIASchema);
