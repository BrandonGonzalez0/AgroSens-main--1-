import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import cultivosDB from './data/cultivos.json';
import { cultivos } from './ServiciosCultivos';

const CropValidationResult = ({ resultado, cultivo, ph, humedad, temperatura, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
  }, [resultado, cultivo]);

  if (!resultado) return null;

  const normalizeKey = (name) => {
    if (!name) return "";
    return name
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const getModificationSteps = () => {
    const steps = [];
    const cropData = cultivosDB[normalizeKey(cultivo)];
    
    if (!cropData) return [];

    const phVal = parseFloat(ph);
    const humVal = parseFloat(humedad);
    const tempVal = parseFloat(temperatura);

    // pH modifications
    if (!isNaN(phVal) && cropData.ph) {
      if (phVal < cropData.ph[0]) {
        steps.push({
          id: 'ph_increase',
          title: 'Aumentar pH del suelo',
          description: `Tu pH actual (${phVal}) está por debajo del rango ideal (${cropData.ph[0]}-${cropData.ph[1]})`,
          actions: [
            'Aplicar cal agrícola (2-4 kg por 100m²)',
            'Mezclar ceniza de madera (1-2 kg por 100m²)',
            'Añadir compost maduro rico en calcio',
            'Monitorear pH semanalmente durante 4-6 semanas'
          ],
          timeframe: '4-6 semanas',
          cost: 'Bajo ($10-30)',
          difficulty: 'Fácil'
        });
      } else if (phVal > cropData.ph[1]) {
        steps.push({
          id: 'ph_decrease',
          title: 'Reducir pH del suelo',
          description: `Tu pH actual (${phVal}) está por encima del rango ideal (${cropData.ph[0]}-${cropData.ph[1]})`,
          actions: [
            'Aplicar azufre elemental (1-2 kg por 100m²)',
            'Añadir turba ácida o compost de hojas',
            'Usar fertilizantes acidificantes (sulfato de amonio)',
            'Verificar pH cada 2 semanas'
          ],
          timeframe: '6-8 semanas',
          cost: 'Bajo ($15-40)',
          difficulty: 'Fácil'
        });
      }
    }

    // Humidity modifications
    if (!isNaN(humVal) && cropData.humedad) {
      if (humVal < cropData.humedad[0]) {
        steps.push({
          id: 'humidity_increase',
          title: 'Aumentar retención de humedad',
          description: `Tu humedad actual (${humVal}%) está por debajo del rango ideal (${cropData.humedad[0]}-${cropData.humedad[1]}%)`,
          actions: [
            'Instalar sistema de riego por goteo',
            'Aplicar mulch orgánico (5-10cm de espesor)',
            'Añadir compost para mejorar retención',
            'Regar en horas tempranas (6-8 AM)'
          ],
          timeframe: '1-2 semanas',
          cost: 'Medio ($50-150)',
          difficulty: 'Medio'
        });
      } else if (humVal > cropData.humedad[1]) {
        steps.push({
          id: 'humidity_decrease',
          title: 'Mejorar drenaje del suelo',
          description: `Tu humedad actual (${humVal}%) está por encima del rango ideal (${cropData.humedad[0]}-${cropData.humedad[1]}%)`,
          actions: [
            'Crear canales de drenaje',
            'Añadir arena gruesa y perlita',
            'Elevar camas de cultivo 15-20cm',
            'Reducir frecuencia de riego'
          ],
          timeframe: '2-3 semanas',
          cost: 'Medio ($40-120)',
          difficulty: 'Medio'
        });
      }
    }

    // Temperature modifications
    if (!isNaN(tempVal) && cropData.temperatura) {
      if (tempVal < cropData.temperatura[0]) {
        steps.push({
          id: 'temp_increase',
          title: 'Aumentar temperatura del cultivo',
          description: `Tu temperatura actual (${tempVal}°C) está por debajo del rango ideal (${cropData.temperatura[0]}-${cropData.temperatura[1]}°C)`,
          actions: [
            'Instalar túneles de plástico o invernadero',
            'Usar coberturas flotantes durante la noche',
            'Aplicar mulch oscuro para absorber calor',
            'Considerar calefacción para invernadero'
          ],
          timeframe: '1-2 semanas',
          cost: 'Alto ($100-500)',
          difficulty: 'Difícil'
        });
      } else if (tempVal > cropData.temperatura[1]) {
        steps.push({
          id: 'temp_decrease',
          title: 'Reducir temperatura del cultivo',
          description: `Tu temperatura actual (${tempVal}°C) está por encima del rango ideal (${cropData.temperatura[0]}-${cropData.temperatura[1]}°C)`,
          actions: [
            'Instalar mallas de sombreo (30-50%)',
            'Mejorar ventilación del área',
            'Regar en horas más frescas',
            'Plantar cultivos de cobertura para sombra'
          ],
          timeframe: '1-2 semanas',
          cost: 'Medio ($60-200)',
          difficulty: 'Medio'
        });
      }
    }

    return steps;
  };

  const getPlantingSteps = () => {
    const cropData = cultivosDB[normalizeKey(cultivo)];
    if (!cropData || !cropData.siembra) return [];

    return cropData.siembra.map((step, index) => ({
      id: `planting_${index}`,
      title: `Paso ${index + 1}`,
      description: step,
      completed: completedSteps.includes(index)
    }));
  };

  const toggleStepCompletion = (stepIndex) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const getChartData = () => {
    const cropData = cultivosDB[normalizeKey(cultivo)];
    if (!cropData) return [];

    return [
      {
        parametro: 'pH',
        Actual: parseFloat(ph) || 0,
        'Mínimo Ideal': cropData.ph?.[0] || 0,
        'Máximo Ideal': cropData.ph?.[1] || 0,
      },
      {
        parametro: 'Humedad (%)',
        Actual: parseFloat(humedad) || 0,
        'Mínimo Ideal': cropData.humedad?.[0] || 0,
        'Máximo Ideal': cropData.humedad?.[1] || 0,
      },
      {
        parametro: 'Temperatura (°C)',
        Actual: parseFloat(temperatura) || 0,
        'Mínimo Ideal': cropData.temperatura?.[0] || 0,
        'Máximo Ideal': cropData.temperatura?.[1] || 0,
      },
    ];
  };

  const isViable = resultado.viable;
  const modificationSteps = getModificationSteps();
  const plantingSteps = getPlantingSteps();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {(() => {
                const cropData = cultivos.find(c => c.nombre.toLowerCase() === cultivo.toLowerCase());
                return cropData?.imagen ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-green-300 flex-shrink-0">
                    <img 
                      src={cropData.imagen} 
                      alt={cultivo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-2xl" style={{display: 'none'}}>
                      {isViable ? '🌱' : '⚠️'}
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-2xl border-4 border-green-300">
                    {isViable ? '🌱' : '⚠️'}
                  </div>
                );
              })()}
              <div>
                <h2 className="text-2xl font-bold">
                  {isViable ? `¡${cultivo} es viable!` : `${cultivo} requiere ajustes`}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {isViable ? 'Sigue estos pasos para plantar' : 'Modifica estas condiciones primero'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Panel - Steps or Modifications */}
            <div className="space-y-4">
              {isViable ? (
                // Planting Steps
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">
                      Guía de Siembra
                    </h3>
                    <div className="text-sm text-gray-600">
                      {completedSteps.length}/{plantingSteps.length} completados
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-4">
                    <div 
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(completedSteps.length / plantingSteps.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-3">
                    {plantingSteps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          completedSteps.includes(index)
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                        onClick={() => toggleStepCompletion(index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            completedSteps.includes(index)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {completedSteps.includes(index) ? '✓' : index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{step.title}</h4>
                            <p className={`text-sm ${
                              completedSteps.includes(index)
                                ? 'line-through text-gray-500'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                // Modification Steps
                <div>
                  <h3 className="text-xl font-semibold text-orange-700 dark:text-orange-300 mb-4">
                    Modificaciones Necesarias
                  </h3>
                  
                  <div className="space-y-4">
                    {modificationSteps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4"
                      >
                        <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                          {step.title}
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          {step.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-semibold">Tiempo</div>
                            <div>{step.timeframe}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-semibold">Costo</div>
                            <div>{step.cost}</div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="font-semibold">Dificultad</div>
                            <div>{step.difficulty}</div>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-sm mb-2">Acciones requeridas:</div>
                          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            {step.actions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Chart and Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Comparación de Valores</h3>
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    {showChart ? 'Ocultar' : 'Ver'} Gráfico
                  </button>
                </div>

                <AnimatePresence>
                  {showChart && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getChartData()}>
                          <XAxis dataKey="parametro" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Actual" fill="#f87171" />
                          <Bar dataKey="Mínimo Ideal" fill="#34d399" />
                          <Bar dataKey="Máximo Ideal" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Crop Info Card */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información del Cultivo</h3>
                
                {(() => {
                  const cropData = cultivos.find(c => c.nombre.toLowerCase() === cultivo.toLowerCase());
                  return cropData?.imagen ? (
                    <div className="mb-4">
                      <div className="w-full h-32 rounded-lg overflow-hidden">
                        <img 
                          src={cropData.imagen} 
                          alt={cultivo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(cropData.imagen, '_blank')}
                        />
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">pH ideal:</span>
                    <span>{cultivosDB[normalizeKey(cultivo)]?.ph?.join(' - ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Humedad ideal:</span>
                    <span>{cultivosDB[normalizeKey(cultivo)]?.humedad?.join(' - ') || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Temperatura ideal:</span>
                    <span>{cultivosDB[normalizeKey(cultivo)]?.temperatura?.join(' - ') || 'N/A'}°C</span>
                  </div>
                </div>
              </div>

              {/* Success Message for Viable Crops */}
              {isViable && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center"
                >
                  <div className="text-2xl mb-2">🎉</div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ¡Condiciones Perfectas!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tus condiciones actuales son ideales para cultivar {cultivo}. 
                    Sigue la guía de siembra para obtener los mejores resultados.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CropValidationResult;