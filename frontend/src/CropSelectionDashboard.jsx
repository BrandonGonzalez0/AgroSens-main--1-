import React, { useState } from 'react';
import { motion } from 'framer-motion';
import cultivosDB from './data/cultivos.json';

const CropSelectionDashboard = ({ suggestions, onClose }) => {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const toggleStepComplete = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(i => i !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const getPlantingSteps = (cropName) => {
    const cropData = cultivosDB[cropName.toLowerCase()];
    return cropData?.siembra || [
      'Preparar el suelo con buen drenaje',
      'Sembrar las semillas a la profundidad adecuada',
      'Regar regularmente sin encharcar',
      'Mantener temperatura y humedad óptimas',
      'Fertilizar según las necesidades del cultivo'
    ];
  };

  const getCropCompatibility = (crop) => {
    const ph = parseFloat(crop.ph?.split('-')[0]) || 6;
    const temp = parseFloat(crop.temperatura?.split('-')[0]) || 20;
    const hum = parseFloat(crop.humedad?.split('-')[0]) || 60;
    
    let score = 0;
    if (ph >= 6 && ph <= 7.5) score += 33;
    if (temp >= 18 && temp <= 25) score += 33;
    if (hum >= 50 && hum <= 80) score += 34;
    
    return Math.round(score);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[95%] max-w-7xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🌱 Selecciona tu Cultivo Ideal</h2>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded">
            Cerrar
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Crop Selection Grid */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Cultivos Recomendados para tus Condiciones</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selecciona un cultivo para ver los pasos de plantación
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {suggestions.map((crop, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleCropSelect(crop)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedCrop?.nombre === crop.nombre
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={crop.imagen}
                      alt={crop.nombre}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{crop.nombre}</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div>pH: {crop.ph}</div>
                        <div>Temp: {crop.temperatura}</div>
                        <div>Humedad: {crop.humedad}</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${getCropCompatibility(crop)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{getCropCompatibility(crop)}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Compatibilidad</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Planting Guide Panel */}
          <div className="lg:col-span-1">
            {selectedCrop ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={selectedCrop.imagen}
                    alt={selectedCrop.nombre}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{selectedCrop.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Guía de plantación paso a paso
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progreso</span>
                    <span>{Math.round((completedSteps.length / getPlantingSteps(selectedCrop.nombre).length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(completedSteps.length / getPlantingSteps(selectedCrop.nombre).length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {getPlantingSteps(selectedCrop.nombre).map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                        completedSteps.includes(index)
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-white dark:bg-gray-600'
                      }`}
                    >
                      <button
                        onClick={() => toggleStepComplete(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          completedSteps.includes(index)
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                        }`}
                      >
                        {completedSteps.includes(index) && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          completedSteps.includes(index)
                            ? 'line-through text-gray-500'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          <span className="font-medium">Paso {index + 1}:</span> {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Crop Details */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold mb-2">Condiciones Ideales:</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>pH:</span>
                      <span className="font-medium">{selectedCrop.ph}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperatura:</span>
                      <span className="font-medium">{selectedCrop.temperatura}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humedad:</span>
                      <span className="font-medium">{selectedCrop.humedad}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setCompletedSteps([])}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-sm rounded"
                  >
                    Reiniciar
                  </button>
                  <button
                    onClick={() => setCompletedSteps(getPlantingSteps(selectedCrop.nombre).map((_, i) => i))}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded"
                  >
                    Completar Todo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="font-semibold mb-2">Selecciona un Cultivo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Elige uno de los cultivos recomendados para ver la guía completa de plantación
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropSelectionDashboard;