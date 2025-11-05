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
      maduro: {
        color: { h: [85, 125], s: [0.6, 1.0], v: [0.5, 0.9] },
        days: 0,
        description: 'Listo para cosecha',
        characteristics: ['Cabeza firme y compacta', 'Hojas crujientes', 'Tamaño completo']
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
      if (!imageElement || !imageElement.width || !imageElement.height) {
        throw new Error('Imagen inválida o no cargada correctamente');
      }
      
      const colorFeatures = await this.extractColorFeatures(imageElement);
      
      if (!colorFeatures || !colorFeatures.hsv) {
        throw new Error('No se pudieron extraer características de color de la imagen');
      }
      
      const cropIdentification = this.identifyCropType(colorFeatures);
      const maturityAnalysis = this.analyzeMaturityStage(cropIdentification.crop, colorFeatures);
      const combinedConfidence = Math.min(cropIdentification.confidence, maturityAnalysis.confidence);
      
      return {
        valid: combinedConfidence > 0.3,
        type: this.database[cropIdentification.crop]?.name || this.formatCropName(cropIdentification.crop),
        maturity: maturityAnalysis.description || maturityAnalysis.stage,
        confidence: combinedConfidence,
        daysToMaturity: maturityAnalysis.daysToMaturity,
        message: this.generateMaturityMessage(cropIdentification.crop, maturityAnalysis),
        characteristics: maturityAnalysis.characteristics || ['Análisis basado en características de color'],
        recommendations: this.getHarvestRecommendations(cropIdentification.crop, maturityAnalysis.stage),
        cropType: cropIdentification.crop,
        stage: maturityAnalysis.stage,
        size: colorFeatures.estimatedSize,
        contentValidation: {
          hasPlantContent: colorFeatures.contentAnalysis.hasPlantContent,
          brightness: colorFeatures.contentAnalysis.averageBrightness,
          textureComplexity: colorFeatures.contentAnalysis.textureComplexity
        }
      };
    } catch (error) {
      console.error('Error in crop maturity analysis:', error);
      return {
        valid: false,
        confidence: 0,
        type: 'Error',
        maturity: 'No determinado',
        message: `Error al analizar la imagen: ${error.message}. Asegúrate de capturar una imagen clara de la planta o fruto.`,
        characteristics: ['Error en el análisis'],
        recommendations: ['Intenta con mejor iluminación', 'Acerca más la cámara al cultivo', 'Asegúrate de que la planta sea visible']
      };
    }
  }

  async extractColorFeatures(imageElement) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxSize = 224;
        const aspectRatio = imageElement.width / imageElement.height;
        
        if (aspectRatio > 1) {
          canvas.width = maxSize;
          canvas.height = maxSize / aspectRatio;
        } else {
          canvas.width = maxSize * aspectRatio;
          canvas.height = maxSize;
        }
        
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        if (pixels.length === 0) {
          throw new Error('No se pudieron obtener datos de la imagen');
        }
        
        const contentAnalysis = this.analyzeImageContent(pixels, canvas.width, canvas.height);
        
        if (!contentAnalysis.hasPlantContent) {
          throw new Error('No se detectó contenido vegetal en la imagen. Asegúrate de enfocar una planta o cultivo.');
        }
        
        let totalR = 0, totalG = 0, totalB = 0;
        let validPixels = 0;
        let greenPixels = 0;
        
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const alpha = pixels[i + 3];
          
          if (alpha > 128 && (r + g + b) > 45) {
            totalR += r;
            totalG += g;
            totalB += b;
            validPixels++;
            
            if (g > r && g > b && g > 80) {
              greenPixels++;
            }
          }
        }
        
        if (validPixels === 0) {
          throw new Error('No se encontraron píxeles válidos en la imagen');
        }
        
        const greenRatio = greenPixels / validPixels;
        if (greenRatio < 0.1 && contentAnalysis.averageBrightness < 0.2) {
          throw new Error('La imagen parece ser muy oscura o no contiene suficiente vegetación visible.');
        }
        
        const avgR = totalR / validPixels / 255;
        const avgG = totalG / validPixels / 255;
        const avgB = totalB / validPixels / 255;
        
        const hsv = this.rgbToHsv(avgR, avgG, avgB);
        
        resolve({
          rgb: [avgR, avgG, avgB],
          hsv: hsv,
          dominantColor: this.getDominantColor(avgR, avgG, avgB),
          colorVariance: this.calculateColorVariance(pixels),
          validPixelRatio: validPixels / (pixels.length / 4),
          greenRatio: greenRatio,
          contentAnalysis: contentAnalysis,
          estimatedSize: this.estimateObjectSize(contentAnalysis, canvas.width, canvas.height)
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  analyzeImageContent(pixels, width, height) {
    let totalBrightness = 0;
    let darkPixels = 0;
    let colorfulPixels = 0;
    let edgePixels = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      const brightness = (r + g + b) / 3;
      
      totalBrightness += brightness;
      pixelCount++;
      
      if (brightness < 0.1) darkPixels++;
      
      const colorVariation = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      if (colorVariation > 0.1) colorfulPixels++;
    }
    
    for (let y = 1; y < height - 1; y += 4) {
      for (let x = 1; x < width - 1; x += 4) {
        const idx = (y * width + x) * 4;
        const current = pixels[idx];
        const right = pixels[idx + 4];
        const down = pixels[idx + width * 4];
        
        if (Math.abs(current - right) > 30 || Math.abs(current - down) > 30) {
          edgePixels++;
        }
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    const darkRatio = darkPixels / pixelCount;
    const colorfulRatio = colorfulPixels / pixelCount;
    const edgeRatio = edgePixels / ((width / 4) * (height / 4));
    
    const hasPlantContent = (
      avgBrightness > 0.15 &&
      darkRatio < 0.8 &&
      colorfulRatio > 0.2 &&
      edgeRatio > 0.1
    );
    
    return {
      hasPlantContent,
      averageBrightness: avgBrightness,
      darkRatio,
      colorfulRatio,
      edgeRatio,
      textureComplexity: edgeRatio
    };
  }

  estimateObjectSize(contentAnalysis, width, height) {
    const edgeDensity = contentAnalysis.edgeRatio;
    const colorComplexity = contentAnalysis.colorfulRatio;
    
    let sizeCategory = 'medium';
    let estimatedDiameter = 'No determinado';
    
    if (edgeDensity > 0.3 && colorComplexity > 0.4) {
      sizeCategory = 'large';
      estimatedDiameter = '> 8 cm';
    } else if (edgeDensity > 0.15 && colorComplexity > 0.25) {
      sizeCategory = 'medium';
      estimatedDiameter = '4-8 cm';
    } else if (edgeDensity > 0.05) {
      sizeCategory = 'small';
      estimatedDiameter = '< 4 cm';
    }
    
    return {
      category: sizeCategory,
      estimatedDiameter,
      confidence: Math.min(edgeDensity * 2 + colorComplexity, 1.0)
    };
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
    let bestMatch = { crop: 'cultivo_general', confidence: 0.4 };
    const [h, s, v] = colorFeatures.hsv;
    const dominantColor = colorFeatures.dominantColor;
    
    if ((h >= 0 && h <= 30) || (h >= 340 && h <= 360)) {
      if (s > 0.4 && v > 0.3) {
        let confidence = 0.7;
        if (s > 0.6 && v > 0.4) confidence += 0.15;
        bestMatch = { crop: 'tomate', confidence: Math.min(confidence, 0.9) };
      }
    }
    
    if (h >= 80 && h <= 140 && s > 0.3 && v > 0.2) {
      let confidence = 0.6;
      if (colorFeatures.colorVariance > 0.02) confidence += 0.15;
      if (dominantColor === 'green') confidence += 0.15;
      if (s > 0.5) confidence += 0.1;
      bestMatch = { crop: 'lechuga', confidence: Math.min(confidence, 0.9) };
    }
    
    if (bestMatch.confidence < 0.6) {
      if (dominantColor === 'green' && s > 0.3 && v > 0.2) {
        let confidence = 0.55;
        if (s > 0.5) confidence += 0.1;
        bestMatch = { crop: 'cultivo_general', confidence };
      } else {
        bestMatch = { crop: 'cultivo_general', confidence: 0.45 };
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
      
      const hRange = stageData.color.h;
      if (h >= hRange[0] && h <= hRange[1]) {
        confidence += 0.4;
      }
      
      const sRange = stageData.color.s;
      if (s >= sRange[0] && s <= sRange[1]) {
        confidence += 0.3;
      }
      
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
    const confidence = maturityAnalysis.confidence;
    
    let baseMessage = '';
    if (maturityAnalysis.daysToMaturity === 0) {
      baseMessage = `${cropName} está maduro y listo para cosechar`;
    } else if (maturityAnalysis.daysToMaturity <= 7) {
      baseMessage = `${cropName} estará listo en ${maturityAnalysis.daysToMaturity} días aproximadamente`;
    } else {
      baseMessage = `${cropName} necesita ${maturityAnalysis.daysToMaturity} días más para madurar`;
    }
    
    if (confidence > 0.7) {
      baseMessage += ' (Análisis confiable)';
    } else if (confidence > 0.5) {
      baseMessage += ' (Análisis moderado - verificar visualmente)';
    } else {
      baseMessage += ' (Análisis preliminar - requiere confirmación)';
    }
    
    return baseMessage;
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
        maduro: ['Cosechar inmediatamente', 'Consumir en 3-5 días', 'Almacenar a temperatura ambiente']
      },
      lechuga: {
        joven: ['Continuar cuidados básicos', 'Mantener humedad del suelo', 'Proteger de plagas'],
        maduro: ['Cosechar en horas frescas', 'Cortar desde la base', 'Consumir rápidamente']
      }
    };
    
    return recommendations[cropType]?.[stage] || ['Seguir prácticas de cultivo estándar'];
  }
}

export default new CropMaturityAnalyzer();