import * as tf from '@tensorflow/tfjs';

// Crop classification labels based on common agricultural crops
const CROP_LABELS = [
  'tomate', 'lechuga', 'zanahoria', 'papa', 'cebolla', 'ajo', 'pepino', 
  'maiz', 'trigo', 'fresa', 'manzana', 'platano', 'naranja', 'uva', 
  'sandia', 'melon', 'pimiento', 'espinaca', 'repollo'
];

// Maturity states
const MATURITY_STATES = ['verde', 'en_desarrollo', 'maduro', 'sobre_maduro'];

class AIImageAnalyzer {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  async loadModel() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadModel();
    return this.loadingPromise;
  }

  async _loadModel() {
    try {
      // Use MobileNet from @tensorflow-models for better compatibility
      const mobilenet = await import('@tensorflow-models/mobilenet');
      this.model = await mobilenet.load();
      
      this.isLoaded = true;
      console.log('AI model loaded successfully');
    } catch (error) {
      console.error('Error loading AI model:', error);
      // Use fallback color-based analysis
      this.isLoaded = false;
    }
  }

  async analyzeImage(imageElement) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      // Preprocess image
      const tensor = this.preprocessImage(imageElement);
      
      // Check if image contains vegetation
      const hasVegetation = await this.detectVegetation(tensor);
      
      if (!hasVegetation) {
        return {
          valid: false,
          confidence: 0.95,
          message: 'La imagen no contiene vegetación o cultivos detectables'
        };
      }

      // Analyze crop type and maturity
      const cropAnalysis = await this.analyzeCrop(tensor);
      
      tensor.dispose();
      
      return cropAnalysis;
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        valid: false,
        confidence: 0.0,
        message: 'Error al procesar la imagen'
      };
    }
  }

  preprocessImage(imageElement) {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);
      
      // Resize to 224x224 (standard input size)
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);
      
      // Normalize pixel values to [0, 1]
      tensor = tensor.div(255.0);
      
      // Add batch dimension
      tensor = tensor.expandDims(0);
      
      return tensor;
    });
  }

  async detectVegetation(tensor) {
    try {
      if (!this.model) {
        return this.analyzeColorDistribution(tensor);
      }

      // Convert tensor to image for MobileNet
      const predictions = await this.model.classify(tensor);
      
      // Check for plant/food related predictions
      const vegetationKeywords = [
        'broccoli', 'cauliflower', 'cucumber', 'bell_pepper', 'mushroom',
        'orange', 'lemon', 'banana', 'strawberry', 'pineapple', 'pomegranate',
        'artichoke', 'corn', 'acorn_squash', 'butternut_squash', 'zucchini',
        'cabbage', 'head_cabbage', 'green', 'plant', 'leaf', 'fruit', 'vegetable'
      ];
      
      const hasVegetation = predictions.some(pred => 
        vegetationKeywords.some(keyword => 
          pred.className.toLowerCase().includes(keyword)
        ) && pred.probability > 0.1
      );
      
      return hasVegetation || this.analyzeColorDistribution(tensor);
    } catch (error) {
      console.error('Error in vegetation detection:', error);
      return this.analyzeColorDistribution(tensor);
    }
  }

  analyzeColorDistribution(tensor) {
    return tf.tidy(() => {
      // Calculate mean RGB values
      const meanRGB = tf.mean(tensor, [1, 2]);
      const rgbValues = meanRGB.dataSync();
      
      // Check for green dominance (vegetation)
      const [r, g, b] = rgbValues;
      const total = r + g + b;
      const greenRatio = g / total;
      const redRatio = r / total;
      
      // Vegetation indicators
      const hasGreen = greenRatio > 0.35 && g > 0.2;
      const hasColorVariation = Math.abs(g - r) > 0.1 || Math.abs(g - b) > 0.1;
      const notGrayScale = total > 0.3 && (Math.max(r, g, b) - Math.min(r, g, b)) > 0.1;
      
      // Fruit indicators (red/orange/yellow)
      const hasFruitColors = (redRatio > 0.4 && g > 0.2) || (r > 0.3 && g > 0.3 && b < 0.3);
      
      return (hasGreen && hasColorVariation && notGrayScale) || hasFruitColors;
    });
  }

  async analyzeCrop(tensor) {
    try {
      // Extract color and texture features
      const features = await this.extractFeatures(tensor);
      
      // Classify crop type based on features
      const cropType = this.classifyCropType(features);
      
      // Determine maturity based on color analysis
      const maturityAnalysis = this.analyzeMaturity(features, cropType);
      
      return {
        valid: true,
        type: cropType.name,
        maturity: maturityAnalysis.state,
        confidence: Math.min(cropType.confidence, maturityAnalysis.confidence),
        daysToMaturity: maturityAnalysis.daysToMaturity,
        message: this.generateMessage(cropType.name, maturityAnalysis)
      };
    } catch (error) {
      console.error('Error in crop analysis:', error);
      return {
        valid: false,
        confidence: 0.0,
        message: 'Error al analizar el cultivo'
      };
    }
  }

  async extractFeatures(tensor) {
    return tf.tidy(() => {
      // Color analysis
      const meanColor = tf.mean(tensor, [1, 2]).dataSync();
      const [r, g, b] = meanColor;
      
      // HSV conversion for better color analysis
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let hue = 0;
      if (delta !== 0) {
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
      }
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
      
      const saturation = max === 0 ? 0 : delta / max;
      const value = max;
      
      // Texture analysis (simplified)
      const variance = tf.moments(tensor).variance.dataSync()[0];
      
      return {
        rgb: [r, g, b],
        hsv: [hue, saturation, value],
        variance,
        greenness: g / (r + g + b),
        redness: r / (r + g + b)
      };
    });
  }

  classifyCropType(features) {
    const { hsv, greenness, redness, variance } = features;
    const [hue, saturation, value] = hsv;
    
    // Simple heuristic-based classification
    let bestMatch = { name: 'desconocido', confidence: 0.3 };
    
    // Tomato detection (red hues)
    if (hue >= 0 && hue <= 30 && redness > 0.4 && saturation > 0.3) {
      bestMatch = { name: 'tomate', confidence: 0.8 };
    }
    // Lettuce/leafy greens (high green, low red)
    else if (hue >= 90 && hue <= 150 && greenness > 0.45 && variance > 0.01) {
      bestMatch = { name: 'lechuga', confidence: 0.75 };
    }
    // Carrot (orange hues)
    else if (hue >= 15 && hue <= 45 && redness > 0.35 && value > 0.4) {
      bestMatch = { name: 'zanahoria', confidence: 0.7 };
    }
    // Cucumber (light green)
    else if (hue >= 60 && hue <= 120 && greenness > 0.4 && saturation < 0.6) {
      bestMatch = { name: 'pepino', confidence: 0.65 };
    }
    // Pepper (various colors, high saturation)
    else if (saturation > 0.5 && variance > 0.015) {
      bestMatch = { name: 'pimiento', confidence: 0.6 };
    }
    // Generic green vegetable
    else if (greenness > 0.4) {
      bestMatch = { name: 'vegetal_verde', confidence: 0.5 };
    }
    
    return bestMatch;
  }

  analyzeMaturity(features, cropType) {
    const { hsv, redness, greenness, variance } = features;
    const [hue, saturation, value] = hsv;
    
    let maturityState = 'en_desarrollo';
    let confidence = 0.6;
    let daysToMaturity = 7;
    
    // Crop-specific maturity analysis
    switch (cropType.name) {
      case 'tomate':
        if (redness > 0.5 && saturation > 0.4) {
          maturityState = 'maduro';
          daysToMaturity = 0;
          confidence = 0.85;
        } else if (redness > 0.3) {
          maturityState = 'en_desarrollo';
          daysToMaturity = 3;
          confidence = 0.75;
        } else {
          maturityState = 'verde';
          daysToMaturity = 10;
          confidence = 0.7;
        }
        break;
        
      case 'lechuga':
        if (greenness > 0.5 && variance > 0.02) {
          maturityState = 'maduro';
          daysToMaturity = 0;
          confidence = 0.8;
        } else {
          maturityState = 'en_desarrollo';
          daysToMaturity = 5;
          confidence = 0.7;
        }
        break;
        
      default:
        // Generic analysis based on color intensity
        if (saturation > 0.6 && value > 0.5) {
          maturityState = 'maduro';
          daysToMaturity = 0;
          confidence = 0.6;
        } else if (saturation > 0.3) {
          maturityState = 'en_desarrollo';
          daysToMaturity = 5;
          confidence = 0.55;
        } else {
          maturityState = 'verde';
          daysToMaturity = 10;
          confidence = 0.5;
        }
    }
    
    return { state: maturityState, confidence, daysToMaturity };
  }

  generateMessage(cropType, maturityAnalysis) {
    const { state, daysToMaturity } = maturityAnalysis;
    
    switch (state) {
      case 'maduro':
        return `${cropType} está listo para cosechar`;
      case 'en_desarrollo':
        return `${cropType} en desarrollo, faltan aproximadamente ${daysToMaturity} días`;
      case 'verde':
        return `${cropType} aún verde, faltan aproximadamente ${daysToMaturity} días para madurar`;
      default:
        return `Estado de ${cropType} indeterminado`;
    }
  }

  // Pest detection using simple anomaly detection
  async detectPests(tensor) {
    return tf.tidy(() => {
      // Look for unusual color patterns that might indicate pests
      const colorVariance = tf.moments(tensor).variance;
      const variance = colorVariance.dataSync()[0];
      
      // High variance might indicate pest damage or disease
      const pestProbability = Math.min(variance * 10, 1.0);
      
      return {
        detected: pestProbability > 0.3,
        confidence: pestProbability,
        locations: this.generateMockPestLocations(pestProbability)
      };
    });
  }

  generateMockPestLocations(probability) {
    if (probability < 0.3) return [];
    
    const numSpots = Math.floor(probability * 5) + 1;
    const locations = [];
    
    for (let i = 0; i < numSpots; i++) {
      locations.push({
        x: Math.random(),
        y: Math.random(),
        intensity: probability
      });
    }
    
    return locations;
  }
}

// Singleton instance
const aiAnalyzer = new AIImageAnalyzer();

export default aiAnalyzer;