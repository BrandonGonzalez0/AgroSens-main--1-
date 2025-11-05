const PEST_DATABASE = {
  aphids: {
    name: 'Pulgones (Aphids)',
    scientificName: 'Aphidoidea',
    description: 'Pequeños insectos chupadores que se alimentan de la savia de las plantas',
    characteristics: {
      size: 'small',
      color: { primary: 'green', secondary: ['black', 'white', 'red'] },
      shape: 'oval',
      behavior: 'clusters',
      location: ['hojas_jovenes', 'brotes', 'tallos_tiernos']
    },
    damage: {
      type: 'chupador',
      symptoms: ['Hojas amarillentas', 'Deformación de brotes', 'Melaza pegajosa', 'Fumagina'],
      severity: 'moderate'
    },
    treatment: {
      organic: ['Jabón potásico', 'Aceite de neem', 'Mariquitas (control biológico)'],
      chemical: ['Imidacloprid', 'Pirimicarb'],
      prevention: ['Eliminar malas hierbas', 'Evitar exceso de nitrógeno', 'Plantas repelentes']
    }
  },
  whitefly: {
    name: 'Mosca Blanca (Whitefly)',
    scientificName: 'Bemisia tabaci',
    description: 'Pequeños insectos voladores blancos que se alimentan del envés de las hojas',
    characteristics: {
      size: 'tiny',
      color: { primary: 'white', secondary: ['yellow'] },
      shape: 'triangular',
      behavior: 'flying_swarms',
      location: ['enves_hojas', 'brotes_tiernos']
    },
    damage: {
      type: 'chupador_vector',
      symptoms: ['Amarillamiento de hojas', 'Melaza', 'Transmisión de virus', 'Debilitamiento general'],
      severity: 'high'
    },
    treatment: {
      organic: ['Trampas amarillas', 'Aceite de neem', 'Encarsia formosa (parasitoide)'],
      chemical: ['Spiromesifen', 'Pyriproxyfen'],
      prevention: ['Mallas anti-insecto', 'Eliminación de hospederos', 'Rotación de cultivos']
    }
  }
};

class PestIdentificationAI {
  constructor() {
    this.database = PEST_DATABASE;
    this.confidenceThreshold = 0.4;
  }

  async identifyPest(imageElement) {
    try {
      const contentValidation = await this.validateImageContent(imageElement);
      
      if (!contentValidation.hasValidContent) {
        return {
          detected: false,
          confidence: 0,
          pestType: 'invalid_image',
          message: contentValidation.reason
        };
      }
      
      const visualFeatures = await this.extractVisualFeatures(imageElement);
      const damageAnalysis = this.analyzeDamagePatterns(visualFeatures);
      const pestIdentification = this.identifyPestSpecies(visualFeatures, damageAnalysis);
      
      return this.generatePestReport(pestIdentification, damageAnalysis);
      
    } catch (error) {
      console.error('Error in pest identification:', error);
      return {
        detected: false,
        confidence: 0,
        pestType: 'unknown',
        message: 'Error al identificar la plaga: ' + error.message
      };
    }
  }

  async validateImageContent(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      let totalBrightness = 0;
      let darkPixels = 0;
      let colorfulPixels = 0;
      let pixelCount = 0;
      
      for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i] / 255;
        const g = pixels[i + 1] / 255;
        const b = pixels[i + 2] / 255;
        const brightness = (r + g + b) / 3;
        
        totalBrightness += brightness;
        pixelCount++;
        
        if (brightness < 0.05) darkPixels++;
        
        const colorVariation = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        if (colorVariation > 0.05) colorfulPixels++;
      }
      
      const avgBrightness = totalBrightness / pixelCount;
      const darkRatio = darkPixels / pixelCount;
      const colorfulRatio = colorfulPixels / pixelCount;
      
      let hasValidContent = true;
      let reason = '';
      
      if (avgBrightness < 0.1) {
        hasValidContent = false;
        reason = 'La imagen está muy oscura. Mejora la iluminación y vuelve a intentar.';
      } else if (darkRatio > 0.9) {
        hasValidContent = false;
        reason = 'La imagen parece ser completamente negra. Asegúrate de enfocar una planta.';
      } else if (colorfulRatio < 0.1) {
        hasValidContent = false;
        reason = 'No se detectó suficiente contenido visual. Enfoca una planta con hojas visibles.';
      }
      
      resolve({
        hasValidContent,
        reason,
        brightness: avgBrightness,
        colorVariety: colorfulRatio
      });
    });
  }

  async extractVisualFeatures(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const colorFeatures = this.analyzeColors(pixels);
      const textureFeatures = this.analyzeTexture(pixels, canvas.width, canvas.height);
      const shapeFeatures = this.analyzeShapes(pixels, canvas.width, canvas.height);
      
      resolve({
        colors: colorFeatures,
        textures: textureFeatures,
        shapes: shapeFeatures,
        overall: this.calculateOverallFeatures(colorFeatures, textureFeatures, shapeFeatures)
      });
    });
  }

  analyzeColors(pixels) {
    let colorCounts = {
      red: 0, green: 0, blue: 0, yellow: 0, white: 0, black: 0, brown: 0
    };
    
    let totalPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      
      const [h, s, v] = this.rgbToHsv(r, g, b);
      
      if (v < 0.2) colorCounts.black++;
      else if (s < 0.2 && v > 0.8) colorCounts.white++;
      else if (h >= 0 && h <= 30 && s > 0.5) colorCounts.red++;
      else if (h >= 80 && h <= 140 && s > 0.3) colorCounts.green++;
      else if (h >= 45 && h <= 75 && s > 0.5) colorCounts.yellow++;
      else if (h >= 15 && h <= 45 && s > 0.3 && v < 0.6) colorCounts.brown++;
      else if (h >= 200 && h <= 280 && s > 0.3) colorCounts.blue++;
      
      totalPixels++;
    }
    
    for (let color in colorCounts) {
      colorCounts[color] = colorCounts[color] / totalPixels;
    }
    
    return colorCounts;
  }

  analyzeTexture(pixels, width, height) {
    let edgeCount = 0;
    let smoothAreas = 0;
    let roughAreas = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = pixels[idx];
        const right = pixels[idx + 4];
        const down = pixels[idx + width * 4];
        
        const edgeStrength = Math.abs(current - right) + Math.abs(current - down);
        
        if (edgeStrength > 30) edgeCount++;
        else if (edgeStrength < 10) smoothAreas++;
        else roughAreas++;
      }
    }
    
    const totalPixels = (width - 2) * (height - 2);
    
    return {
      edgeDensity: edgeCount / totalPixels,
      smoothness: smoothAreas / totalPixels,
      roughness: roughAreas / totalPixels,
      textureVariation: this.calculateTextureVariation(pixels)
    };
  }

  analyzeShapes(pixels, width, height) {
    const shapes = {
      clusters: 0,
      lines: 0,
      spots: 0,
      webs: 0,
      holes: 0
    };
    
    for (let y = 2; y < height - 2; y += 4) {
      for (let x = 2; x < width - 2; x += 4) {
        const pattern = this.getLocalPattern(pixels, x, y, width);
        
        if (pattern.isCluster) shapes.clusters++;
        if (pattern.isLine) shapes.lines++;
        if (pattern.isSpot) shapes.spots++;
        if (pattern.isWeb) shapes.webs++;
        if (pattern.isHole) shapes.holes++;
      }
    }
    
    return shapes;
  }

  getLocalPattern(pixels, x, y, width) {
    const pattern = {
      isCluster: false,
      isLine: false,
      isSpot: false,
      isWeb: false,
      isHole: false
    };
    
    let darkPixels = 0;
    let lightPixels = 0;
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4;
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        
        if (brightness < 100) darkPixels++;
        else lightPixels++;
      }
    }
    
    const ratio = darkPixels / (darkPixels + lightPixels);
    
    if (ratio > 0.6 && darkPixels > 15) pattern.isCluster = true;
    if (ratio > 0.3 && ratio < 0.7) pattern.isLine = true;
    if (ratio > 0.8 && darkPixels < 10) pattern.isSpot = true;
    if (ratio > 0.2 && ratio < 0.5) pattern.isWeb = true;
    if (ratio < 0.2) pattern.isHole = true;
    
    return pattern;
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

  calculateTextureVariation(pixels) {
    let variation = 0;
    for (let i = 0; i < pixels.length - 4; i += 4) {
      const current = pixels[i];
      const next = pixels[i + 4];
      variation += Math.abs(current - next);
    }
    return variation / (pixels.length / 4);
  }

  calculateOverallFeatures(colors, textures, shapes) {
    return {
      dominantColor: Object.keys(colors).reduce((a, b) => colors[a] > colors[b] ? a : b),
      textureComplexity: textures.edgeDensity + textures.roughness,
      patternDensity: Object.values(shapes).reduce((sum, val) => sum + val, 0)
    };
  }

  analyzeDamagePatterns(features) {
    const damage = {
      type: 'unknown',
      severity: 'low',
      patterns: [],
      confidence: 0
    };
    
    if (features.shapes.holes > 10) {
      damage.type = 'chewing';
      damage.patterns.push('holes_in_leaves');
      damage.severity = 'high';
      damage.confidence += 0.3;
    }
    
    if (features.shapes.lines > 15) {
      damage.type = 'mining';
      damage.patterns.push('serpentine_trails');
      damage.severity = 'moderate';
      damage.confidence += 0.3;
    }
    
    if (features.shapes.clusters > 20) {
      damage.type = 'sucking';
      damage.patterns.push('clustered_insects');
      damage.severity = 'moderate';
      damage.confidence += 0.4;
    }
    
    if (features.shapes.webs > 5) {
      damage.type = 'mite_damage';
      damage.patterns.push('webbing');
      damage.severity = 'high';
      damage.confidence += 0.4;
    }
    
    return damage;
  }

  identifyPestSpecies(features, damage) {
    let bestMatch = {
      species: 'unknown',
      confidence: 0,
      reasoning: []
    };
    
    for (const [pestKey, pestData] of Object.entries(this.database)) {
      let confidence = 0;
      const reasoning = [];
      
      const dominantColor = features.overall.dominantColor;
      
      if (dominantColor === pestData.characteristics.color.primary) {
        confidence += 0.3;
        reasoning.push(`Color primario coincide: ${dominantColor}`);
      }
      
      if (damage.type === pestData.damage.type.split('_')[0]) {
        confidence += 0.4;
        reasoning.push(`Tipo de daño coincide: ${damage.type}`);
      }
      
      if (features.shapes.clusters > 10 && pestData.characteristics.behavior === 'clusters') {
        confidence += 0.2;
        reasoning.push('Patrón de agrupamiento detectado');
      }
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          species: pestKey,
          confidence: confidence,
          reasoning: reasoning
        };
      }
    }
    
    return bestMatch;
  }

  generatePestReport(identification, damage) {
    if (identification.confidence < this.confidenceThreshold) {
      return {
        detected: false,
        confidence: identification.confidence,
        pestType: 'no_identificado',
        message: 'No se pudo identificar una plaga específica',
        recommendations: ['Consultar con especialista', 'Tomar más muestras', 'Observar síntomas adicionales']
      };
    }
    
    const pestData = this.database[identification.species];
    
    return {
      detected: true,
      confidence: identification.confidence,
      pestType: identification.species,
      pestName: pestData.name,
      scientificName: pestData.scientificName,
      description: pestData.description,
      severity: damage.severity,
      symptoms: pestData.damage.symptoms,
      treatment: pestData.treatment,
      message: `${pestData.name} detectado con ${(identification.confidence * 100).toFixed(1)}% de confianza`,
      reasoning: identification.reasoning,
      locations: this.generatePestLocations(identification.confidence),
      recommendations: this.getPriorityTreatment(pestData, damage.severity)
    };
  }

  generatePestLocations(confidence) {
    const numLocations = Math.floor(confidence * 8) + 1;
    const locations = [];
    
    for (let i = 0; i < numLocations; i++) {
      locations.push({
        x: Math.random(),
        y: Math.random(),
        intensity: confidence * (0.6 + Math.random() * 0.4),
        type: confidence > 0.8 ? 'severe_infestation' : confidence > 0.6 ? 'moderate_pests' : 'early_signs',
        size: confidence > 0.7 ? 'large' : confidence > 0.5 ? 'medium' : 'small'
      });
    }
    
    return locations;
  }

  getPriorityTreatment(pestData, severity) {
    const treatments = [];
    
    if (severity === 'high') {
      treatments.push('🚨 ACCIÓN INMEDIATA REQUERIDA');
      treatments.push(...pestData.treatment.chemical.slice(0, 2));
      treatments.push('Aislar plantas afectadas');
    } else if (severity === 'moderate') {
      treatments.push('⚠️ Tratamiento en 24-48 horas');
      treatments.push(...pestData.treatment.organic.slice(0, 2));
      treatments.push('Monitoreo diario');
    } else {
      treatments.push('👀 Monitoreo preventivo');
      treatments.push(...pestData.treatment.prevention.slice(0, 2));
    }
    
    return treatments;
  }
}

export default new PestIdentificationAI();