// Comprehensive crop maturity analysis library with pre-trained data
const CROP_MATURITY_DATABASE = {
  tomate: {
    name: 'Tomate',
    stages: {
      verde: {
        color: { h: [100, 140], s: [0.3, 0.8], v: [0.2, 0.6] },
        days: 14,
        description: 'Verde inmaduro',
        characteristics: ['Color verde uniforme', 'Textura firme', 'Tamaño en desarrollo']
      },
      pintón: {
        color: { h: [40, 80], s: [0.4, 0.9], v: [0.3, 0.7] },
        days: 7,
        description: 'Iniciando maduración',
        characteristics: ['Cambio de color verde a amarillo', 'Ligero ablandamiento', 'Desarrollo de azúcares']
      },
      maduro: {
        color: { h: [0, 30], s: [0.6, 1.0], v: [0.4, 0.9] },
        days: 0,
        description: 'Listo para cosecha',
        characteristics: ['Color rojo intenso', 'Textura suave', 'Máximo contenido de azúcares']
      }
    }
  },
  lechuga: {
    name: 'Lechuga',
    stages: {
      joven: {
        color: { h: [80, 120], s: [0.4, 0.8], v: [0.3, 0.7] },
        days: 21,
        description: 'Plántula en crecimiento',
        characteristics: ['Hojas pequeñas', 'Color verde claro', 'Centro compacto']
      },
      desarrollo: {
        color: { h: [90, 130], s: [0.5, 0.9], v: [0.4, 0.8] },
        days: 10,
        description: 'Formación de cabeza',
        characteristics: ['Hojas expandiéndose', 'Verde más intenso', 'Estructura definida']
      },
      maduro: {
        color: { h: [85, 125], s: [0.6, 1.0], v: [0.5, 0.9] },
        days: 0,
        description: 'Listo para cosecha',
        characteristics: ['Cabeza firme y compacta', 'Hojas crujientes', 'Tamaño completo']
      }
    }
  },
  zanahoria: {
    name: 'Zanahoria',
    stages: {
      inmadura: {
        color: { h: [20, 40], s: [0.3, 0.7], v: [0.3, 0.6] },
        days: 30,
        description: 'Raíz en desarrollo',
        characteristics: ['Color naranja pálido', 'Diámetro pequeño', 'Textura dura']
      },
      desarrollo: {
        color: { h: [15, 35], s: [0.5, 0.8], v: [0.4, 0.7] },
        days: 14,
        description: 'Crecimiento activo',
        characteristics: ['Naranja más intenso', 'Engrosamiento', 'Longitud aumentando']
      },
      maduro: {
        color: { h: [10, 30], s: [0.7, 1.0], v: [0.5, 0.9] },
        days: 0,
        description: 'Listo para cosecha',
        characteristics: ['Naranja brillante', 'Diámetro óptimo', 'Textura firme pero tierna']
      }
    }
  },
  pimiento: {
    name: 'Pimiento',
    stages: {
      verde: {
        color: { h: [90, 140], s: [0.4, 0.8], v: [0.3, 0.7] },
        days: 21,
        description: 'Verde inmaduro',
        characteristics: ['Verde intenso', 'Textura firme', 'Sabor ligeramente amargo']
      },
      amarillo: {
        color: { h: [45, 65], s: [0.6, 0.9], v: [0.5, 0.8] },
        days: 7,
        description: 'Transición a madurez',
        characteristics: ['Amarillo dorado', 'Dulzor desarrollándose', 'Textura manteniéndose']
      },
      rojo: {
        color: { h: [0, 20], s: [0.7, 1.0], v: [0.5, 0.9] },
        days: 0,
        description: 'Completamente maduro',
        characteristics: ['Rojo brillante', 'Máxima dulzura', 'Textura óptima']
      }
    }
  },
  fresa: {
    name: 'Fresa',
    stages: {
      verde: {
        color: { h: [100, 140], s: [0.3, 0.7], v: [0.2, 0.5] },
        days: 10,
        description: 'Fruto inmaduro',
        characteristics: ['Verde uniforme', 'Semillas hundidas', 'Textura dura']
      },
      blanca: {
        color: { h: [0, 360], s: [0.1, 0.3], v: [0.7, 0.9] },
        days: 5,
        description: 'Pre-maduración',
        characteristics: ['Color blanquecino', 'Inicio de dulzor', 'Ablandamiento leve']
      },
      madura: {
        color: { h: [340, 20], s: [0.7, 1.0], v: [0.4, 0.8] },
        days: 0,
        description: 'Lista para consumo',
        characteristics: ['Rojo intenso', 'Aroma característico', 'Textura jugosa']
      }
    }
  },
  
  vegetal_verde: {
    name: 'Vegetal Verde',
    stages: {
      joven: {
        color: { h: [80, 120], s: [0.3, 0.6], v: [0.3, 0.6] },
        days: 14,
        description: 'Vegetal verde joven',
        characteristics: ['Color verde claro', 'En crecimiento']
      },
      maduro: {
        color: { h: [85, 125], s: [0.5, 1.0], v: [0.4, 0.8] },
        days: 0,
        description: 'Vegetal verde maduro',
        characteristics: ['Color verde intenso', 'Listo para cosecha']
      }
    }
  },
  
  fruto_rojo: {
    name: 'Fruto Rojo',
    stages: {
      verde: {
        color: { h: [80, 140], s: [0.3, 0.7], v: [0.2, 0.6] },
        days: 10,
        description: 'Fruto inmaduro',
        characteristics: ['Color verde', 'Sin madurar']
      },
      maduro: {
        color: { h: [0, 30], s: [0.6, 1.0], v: [0.4, 0.9] },
        days: 0,
        description: 'Fruto rojo maduro',
        characteristics: ['Color rojo intenso', 'Listo para consumo']
      }
    }
  },
  
  cultivo_general: {
    name: 'Cultivo General',
    stages: {
      desarrollo: {
        color: { h: [0, 360], s: [0.2, 0.8], v: [0.2, 0.8] },
        days: 7,
        description: 'Cultivo en desarrollo',
        characteristics: ['Análisis general', 'Estado intermedio']
      },
      maduro: {
        color: { h: [0, 360], s: [0.4, 1.0], v: [0.4, 1.0] },
        days: 0,
        description: 'Cultivo aparentemente maduro',
        characteristics: ['Colores desarrollados', 'Posiblemente listo']
      }
    }
  }
};

class CropMaturityAnalyzer {
  constructor() {
    this.database = CROP_MATURITY_DATABASE;
  }

  async analyzeCropMaturity(imageElement) {
    try {
      // Extract color features from image
      const colorFeatures = await this.extractColorFeatures(imageElement);
      
      // Identify crop type
      const cropIdentification = this.identifyCropType(colorFeatures);
      
      // Determine maturity stage
      const maturityAnalysis = this.analyzeMaturityStage(cropIdentification.crop, colorFeatures);
      
      return {
        valid: cropIdentification.confidence > 0.4,
        type: cropIdentification.crop,
        maturity: maturityAnalysis.stage,
        confidence: Math.min(cropIdentification.confidence, maturityAnalysis.confidence),
        daysToMaturity: maturityAnalysis.daysToMaturity,
        message: this.generateMaturityMessage(cropIdentification.crop, maturityAnalysis),
        characteristics: maturityAnalysis.characteristics,
        recommendations: this.getHarvestRecommendations(cropIdentification.crop, maturityAnalysis.stage)
      };
    } catch (error) {
      console.error('Error in crop maturity analysis:', error);
      return {
        valid: false,
        confidence: 0,
        message: 'Error al analizar la madurez del cultivo'
      };
    }
  }

  async extractColorFeatures(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width || 224;
      canvas.height = imageElement.height || 224;
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      let totalR = 0, totalG = 0, totalB = 0;
      let pixelCount = 0;
      
      // Sample every 4th pixel for performance
      for (let i = 0; i < pixels.length; i += 16) {
        totalR += pixels[i];
        totalG += pixels[i + 1];
        totalB += pixels[i + 2];
        pixelCount++;
      }
      
      const avgR = totalR / pixelCount / 255;
      const avgG = totalG / pixelCount / 255;
      const avgB = totalB / pixelCount / 255;
      
      // Convert to HSV
      const hsv = this.rgbToHsv(avgR, avgG, avgB);
      
      resolve({
        rgb: [avgR, avgG, avgB],
        hsv: hsv,
        dominantColor: this.getDominantColor(avgR, avgG, avgB),
        colorVariance: this.calculateColorVariance(pixels)
      });
    });
  }

  rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    return [h, s, v];
  }

  getDominantColor(r, g, b) {
    const max = Math.max(r, g, b);
    const threshold = 0.1;
    
    if (r > g + threshold && r > b + threshold) return 'red';
    if (g > r + threshold && g > b + threshold) return 'green';
    if (b > r + threshold && b > g + threshold) return 'blue';
    if (r > 0.5 && g > 0.5 && b < 0.4) return 'yellow';
    if (r > 0.5 && g > 0.3 && g < 0.6 && b < 0.3) return 'orange';
    if (max < 0.3) return 'dark';
    if (r > 0.7 && g > 0.7 && b > 0.7) return 'white';
    return 'mixed';
  }

  calculateColorVariance(pixels) {
    let variance = 0;
    const sampleSize = Math.min(1000, pixels.length / 4);
    
    for (let i = 0; i < sampleSize * 4; i += 16) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      variance += Math.pow(r - g, 2) + Math.pow(g - b, 2) + Math.pow(b - r, 2);
    }
    
    return variance / sampleSize;
  }

  identifyCropType(colorFeatures) {
    let bestMatch = { crop: 'desconocido', confidence: 0.3 };
    const [h, s, v] = colorFeatures.hsv;
    const dominantColor = colorFeatures.dominantColor;
    
    // Tomato identification
    if ((h >= 0 && h <= 30) || (h >= 340 && h <= 360)) {
      if (s > 0.4 && v > 0.3) {
        bestMatch = { crop: 'tomate', confidence: 0.85 };
      }
    }
    
    // Lettuce identification
    if (h >= 80 && h <= 140 && s > 0.3 && v > 0.2) {
      let confidence = 0.6;
      if (colorFeatures.colorVariance > 0.02) confidence += 0.2;
      if (dominantColor === 'green') confidence += 0.1;
      bestMatch = { crop: 'lechuga', confidence: Math.min(confidence, 0.9) };
    }
    
    // Carrot identification
    if (h >= 10 && h <= 40 && s > 0.4 && v > 0.3) {
      let confidence = 0.65;
      if (dominantColor === 'orange') confidence += 0.2;
      bestMatch = { crop: 'zanahoria', confidence: Math.min(confidence, 0.85) };
    }
    
    // Pepper identification
    if ((h >= 90 && h <= 140) || (h >= 45 && h <= 65) || (h >= 0 && h <= 20)) {
      if (s > 0.4 && v > 0.3) {
        let confidence = 0.6;
        if (s > 0.6) confidence += 0.1;
        bestMatch = { crop: 'pimiento', confidence: Math.min(confidence, 0.8) };
      }
    }
    
    // Strawberry identification
    if ((h >= 340 && h <= 360) || (h >= 0 && h <= 20)) {
      if (s > 0.5 && v > 0.3) {
        bestMatch = { crop: 'fresa', confidence: 0.8 };
      }
    }
    
    // Generic vegetable fallback
    if (bestMatch.confidence < 0.5) {
      if (dominantColor === 'green' && s > 0.3) {
        bestMatch = { crop: 'vegetal_verde', confidence: 0.5 };
      } else if (dominantColor === 'red' && s > 0.4) {
        bestMatch = { crop: 'fruto_rojo', confidence: 0.5 };
      } else if (dominantColor === 'orange' && s > 0.4) {
        bestMatch = { crop: 'fruto_naranja', confidence: 0.5 };
      }
    }
    
    return bestMatch;
  }

  analyzeMaturityStage(cropType, colorFeatures) {
    if (!this.database[cropType]) {
      return {
        stage: 'desconocido',
        confidence: 0.3,
        daysToMaturity: 7,
        characteristics: ['Cultivo no identificado en la base de datos']
      };
    }
    
    const cropData = this.database[cropType];
    const [h, s, v] = colorFeatures.hsv;
    
    let bestStage = { stage: 'inmaduro', confidence: 0, daysToMaturity: 14 };
    
    for (const [stageName, stageData] of Object.entries(cropData.stages)) {
      let confidence = 0;
      
      // Check hue range
      const hRange = stageData.color.h;
      if (h >= hRange[0] && h <= hRange[1]) {
        confidence += 0.4;
      }
      
      // Check saturation range
      const sRange = stageData.color.s;
      if (s >= sRange[0] && s <= sRange[1]) {
        confidence += 0.3;
      }
      
      // Check value range
      const vRange = stageData.color.v;
      if (v >= vRange[0] && v <= vRange[1]) {
        confidence += 0.3;
      }
      
      if (confidence > bestStage.confidence) {
        bestStage = {
          stage: stageName,
          confidence: confidence,
          daysToMaturity: stageData.days,
          characteristics: stageData.characteristics,
          description: stageData.description
        };
      }
    }
    
    return bestStage;
  }

  generateMaturityMessage(cropType, maturityAnalysis) {
    const cropName = this.database[cropType]?.name || this.formatCropName(cropType);
    
    if (maturityAnalysis.daysToMaturity === 0) {
      return `${cropName} está maduro y listo para cosechar`;
    } else if (maturityAnalysis.daysToMaturity <= 7) {
      return `${cropName} estará listo en ${maturityAnalysis.daysToMaturity} días aproximadamente`;
    } else {
      return `${cropName} necesita ${maturityAnalysis.daysToMaturity} días más para madurar`;
    }
  }
  
  formatCropName(cropType) {
    const names = {
      'vegetal_verde': 'Vegetal Verde',
      'fruto_rojo': 'Fruto Rojo',
      'fruto_naranja': 'Fruto Naranja',
      'cultivo_general': 'Cultivo'
    };
    return names[cropType] || cropType.replace('_', ' ');
  }

  getHarvestRecommendations(cropType, stage) {
    const recommendations = {
      tomate: {
        verde: ['Esperar a que cambie de color', 'Mantener riego constante', 'Proteger de heladas'],
        pintón: ['Cosechar si hay riesgo de heladas', 'Puede madurar en interior', 'Revisar diariamente'],
        maduro: ['Cosechar inmediatamente', 'Consumir en 3-5 días', 'Almacenar a temperatura ambiente']
      },
      lechuga: {
        joven: ['Continuar cuidados básicos', 'Mantener humedad del suelo', 'Proteger de plagas'],
        desarrollo: ['Aumentar riego ligeramente', 'Monitorear crecimiento', 'Preparar para cosecha'],
        maduro: ['Cosechar en horas frescas', 'Cortar desde la base', 'Consumir rápidamente']
      },
      zanahoria: {
        inmadura: ['Mantener suelo suelto', 'Riego moderado y constante', 'Evitar fertilizantes nitrogenados'],
        desarrollo: ['Reducir frecuencia de riego', 'Revisar desarrollo de raíz', 'Proteger de plagas del suelo'],
        maduro: ['Cosechar antes de que se endurezcan', 'Aflojar suelo antes de extraer', 'Almacenar en lugar fresco']
      }
    };
    
    return recommendations[cropType]?.[stage] || ['Seguir prácticas de cultivo estándar'];
  }
}

export default new CropMaturityAnalyzer();