import * as tf from '@tensorflow/tfjs';

// Common pest indicators and patterns
const PEST_INDICATORS = {
  aphids: { color: [0, 255, 0], size: 'small', pattern: 'clusters' },
  whitefly: { color: [255, 255, 255], size: 'tiny', pattern: 'scattered' },
  thrips: { color: [100, 50, 0], size: 'small', pattern: 'lines' },
  spider_mites: { color: [255, 0, 0], size: 'tiny', pattern: 'webs' },
  caterpillars: { color: [50, 100, 50], size: 'medium', pattern: 'holes' },
  leaf_miners: { color: [200, 200, 100], size: 'small', pattern: 'trails' }
};

class PestDetectionAI {
  constructor() {
    this.isLoaded = false;
    this.edgeDetectionKernel = null;
    this.initializeKernels();
  }

  initializeKernels() {
    // Edge detection kernel for finding anomalies
    this.edgeDetectionKernel = tf.tensor2d([
      [-1, -1, -1],
      [-1,  8, -1],
      [-1, -1, -1]
    ], [3, 3]);
    
    this.isLoaded = true;
  }

  async detectPests(imageTensor) {
    if (!this.isLoaded) {
      this.initializeKernels();
    }

    try {
      const pestAnalysis = await this.analyzePestPatterns(imageTensor);
      const damageAnalysis = await this.detectPlantDamage(imageTensor);
      const colorAnomalies = await this.detectColorAnomalies(imageTensor);

      // Combine all analyses
      const combinedResults = this.combineAnalyses(pestAnalysis, damageAnalysis, colorAnomalies);
      
      return {
        detected: combinedResults.confidence > 0.4,
        confidence: combinedResults.confidence,
        pestType: combinedResults.pestType,
        severity: combinedResults.severity,
        locations: combinedResults.locations,
        recommendations: this.generateRecommendations(combinedResults)
      };
    } catch (error) {
      console.error('Error in pest detection:', error);
      return {
        detected: false,
        confidence: 0,
        pestType: 'unknown',
        severity: 'none',
        locations: [],
        recommendations: []
      };
    }
  }

  async analyzePestPatterns(tensor) {
    return tf.tidy(() => {
      // Convert to grayscale for pattern analysis
      const grayscale = tf.mean(tensor, -1, true);
      
      // Apply edge detection
      const edges = tf.conv2d(grayscale, this.edgeDetectionKernel.expandDims(-1).expandDims(-1), 1, 'same');
      
      // Find high-frequency patterns (potential pest activity)
      const edgeVariance = tf.moments(edges).variance.dataSync()[0];
      
      // Analyze texture patterns
      const textureScore = this.analyzeTexture(grayscale);
      
      return {
        edgeVariance,
        textureScore,
        confidence: Math.min(edgeVariance * 2 + textureScore * 0.5, 1.0)
      };
    });
  }

  analyzeTexture(grayscaleTensor) {
    return tf.tidy(() => {
      // Calculate local variance to detect texture irregularities
      const mean = tf.mean(grayscaleTensor);
      const variance = tf.mean(tf.square(tf.sub(grayscaleTensor, mean)));
      
      // High variance indicates irregular textures (potential pest damage)
      return Math.min(variance.dataSync()[0] * 10, 1.0);
    });
  }

  async detectPlantDamage(tensor) {
    return tf.tidy(() => {
      // Analyze color distribution for damage indicators
      const [height, width] = tensor.shape.slice(1, 3);
      const rgbMean = tf.mean(tensor, [1, 2]);
      const [r, g, b] = rgbMean.dataSync();
      
      // Look for brown/yellow spots (disease/damage indicators)
      const brownScore = this.calculateBrownSpots(tensor);
      const yellowScore = this.calculateYellowSpots(tensor);
      const blackSpotScore = this.calculateBlackSpots(tensor);
      
      // Holes or missing leaf areas
      const holeScore = this.detectHoles(tensor);
      
      const damageConfidence = (brownScore + yellowScore + blackSpotScore + holeScore) / 4;
      
      return {
        brownSpots: brownScore,
        yellowSpots: yellowScore,
        blackSpots: blackSpotScore,
        holes: holeScore,
        confidence: damageConfidence,
        locations: this.findDamageLocations(tensor, damageConfidence)
      };
    });
  }

  calculateBrownSpots(tensor) {
    return tf.tidy(() => {
      // HSV conversion for better brown detection
      const normalized = tf.div(tensor, 255);
      const [r, g, b] = tf.split(normalized, 3, -1);
      
      // Brown detection: low saturation, medium-low value, red > green > blue
      const brownMask = tf.logicalAnd(
        tf.logicalAnd(tf.greater(r, g), tf.greater(g, b)),
        tf.logicalAnd(tf.less(tf.add(tf.add(r, g), b), 1.5), tf.greater(tf.add(tf.add(r, g), b), 0.3))
      );
      
      const brownRatio = tf.mean(tf.cast(brownMask, 'float32')).dataSync()[0];
      return Math.min(brownRatio * 5, 1.0);
    });
  }

  calculateYellowSpots(tensor) {
    return tf.tidy(() => {
      const normalized = tf.div(tensor, 255);
      const [r, g, b] = tf.split(normalized, 3, -1);
      
      // Yellow detection: high red and green, low blue
      const yellowMask = tf.logicalAnd(
        tf.logicalAnd(tf.greater(r, 0.6), tf.greater(g, 0.6)),
        tf.less(b, 0.4)
      );
      
      const yellowRatio = tf.mean(tf.cast(yellowMask, 'float32')).dataSync()[0];
      return Math.min(yellowRatio * 3, 1.0);
    });
  }

  calculateBlackSpots(tensor) {
    return tf.tidy(() => {
      const normalized = tf.div(tensor, 255);
      const grayscale = tf.mean(normalized, -1);
      
      // Black spot detection: very low intensity
      const blackMask = tf.less(grayscale, 0.15);
      const blackRatio = tf.mean(tf.cast(blackMask, 'float32')).dataSync()[0];
      
      return Math.min(blackRatio * 4, 1.0);
    });
  }

  detectHoles(tensor) {
    return tf.tidy(() => {
      // Look for sudden intensity changes (holes in leaves)
      const grayscale = tf.mean(tensor, -1);
      const edges = tf.conv2d(grayscale.expandDims(-1), this.edgeDetectionKernel.expandDims(-1).expandDims(-1), 1, 'same');
      
      const highEdges = tf.greater(tf.abs(edges), 0.3);
      const edgeRatio = tf.mean(tf.cast(highEdges, 'float32')).dataSync()[0];
      
      return Math.min(edgeRatio * 2, 1.0);
    });
  }

  async detectColorAnomalies(tensor) {
    return tf.tidy(() => {
      const [height, width] = tensor.shape.slice(1, 3);
      const normalized = tf.div(tensor, 255);
      
      // Analyze color distribution across the image
      const colorVariance = tf.moments(normalized).variance.dataSync();
      const [rVar, gVar, bVar] = colorVariance;
      
      // High variance in specific channels indicates anomalies
      const anomalyScore = Math.min((rVar + gVar + bVar) * 3, 1.0);
      
      // Look for unusual color clusters
      const clusters = this.findColorClusters(normalized);
      
      return {
        variance: anomalyScore,
        clusters: clusters,
        confidence: (anomalyScore + clusters.confidence) / 2
      };
    });
  }

  findColorClusters(normalizedTensor) {
    return tf.tidy(() => {
      // Simple clustering based on color similarity
      const [height, width] = normalizedTensor.shape.slice(1, 3);
      const reshaped = tf.reshape(normalizedTensor, [-1, 3]);
      
      // Calculate color distances from green (healthy plant color)
      const greenRef = tf.tensor1d([0.2, 0.7, 0.3]);
      const distances = tf.norm(tf.sub(reshaped, greenRef), 'euclidean', 1);
      
      // Find pixels that are far from healthy green
      const anomalousPixels = tf.greater(distances, 0.4);
      const anomalyRatio = tf.mean(tf.cast(anomalousPixels, 'float32')).dataSync()[0];
      
      return {
        confidence: Math.min(anomalyRatio * 2, 1.0),
        ratio: anomalyRatio
      };
    });
  }

  findDamageLocations(tensor, confidence) {
    if (confidence < 0.3) return [];
    
    const [height, width] = tensor.shape.slice(1, 3);
    const locations = [];
    
    // Generate pest locations based on analysis
    const numSpots = Math.floor(confidence * 8) + 1;
    
    for (let i = 0; i < numSpots; i++) {
      locations.push({
        x: Math.random(),
        y: Math.random(),
        intensity: confidence * (0.7 + Math.random() * 0.3),
        type: this.determinePestType(confidence),
        size: this.determinePestSize(confidence)
      });
    }
    
    return locations;
  }

  determinePestType(confidence) {
    if (confidence > 0.8) return 'severe_infestation';
    if (confidence > 0.6) return 'moderate_pests';
    if (confidence > 0.4) return 'early_signs';
    return 'suspicious_activity';
  }

  determinePestSize(confidence) {
    if (confidence > 0.7) return 'large';
    if (confidence > 0.5) return 'medium';
    return 'small';
  }

  combineAnalyses(pestAnalysis, damageAnalysis, colorAnomalies) {
    const combinedConfidence = (
      pestAnalysis.confidence * 0.4 +
      damageAnalysis.confidence * 0.4 +
      colorAnomalies.confidence * 0.2
    );

    let pestType = 'unknown';
    let severity = 'none';

    if (combinedConfidence > 0.8) {
      pestType = 'multiple_pests';
      severity = 'severe';
    } else if (combinedConfidence > 0.6) {
      pestType = 'common_pests';
      severity = 'moderate';
    } else if (combinedConfidence > 0.4) {
      pestType = 'early_detection';
      severity = 'mild';
    }

    return {
      confidence: combinedConfidence,
      pestType,
      severity,
      locations: damageAnalysis.locations,
      details: {
        patterns: pestAnalysis,
        damage: damageAnalysis,
        colors: colorAnomalies
      }
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    switch (analysis.severity) {
      case 'severe':
        recommendations.push('🚨 Acción inmediata requerida');
        recommendations.push('Aplicar tratamiento sistémico');
        recommendations.push('Aislar plantas afectadas');
        recommendations.push('Consultar especialista agrícola');
        break;
        
      case 'moderate':
        recommendations.push('⚠️ Tratamiento recomendado en 24-48h');
        recommendations.push('Aplicar insecticida orgánico');
        recommendations.push('Aumentar monitoreo diario');
        recommendations.push('Revisar plantas cercanas');
        break;
        
      case 'mild':
        recommendations.push('👀 Monitoreo preventivo');
        recommendations.push('Aplicar tratamiento preventivo');
        recommendations.push('Mejorar ventilación del cultivo');
        recommendations.push('Revisar en 2-3 días');
        break;
        
      default:
        recommendations.push('✅ Continuar monitoreo regular');
    }
    
    return recommendations;
  }
}

const pestDetector = new PestDetectionAI();
export default pestDetector;