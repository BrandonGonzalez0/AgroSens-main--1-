import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { showNotification } from './NotificationSystem';
import { sugerirCultivos } from './ServiciosCultivos';

const TerrainSimulator = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('form'); // 'form', 'map'
  const [terrain, setTerrain] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [sensors, setSensors] = useState({});
  const [showSensorModal, setShowSensorModal] = useState(false);
  const mapRef = useRef(null);

  const createTerrain = (formData) => {
    const { name, width, length, gridSize } = formData;
    const gridsX = Math.ceil(width / gridSize);
    const gridsY = Math.ceil(length / gridSize);
    
    const newTerrain = {
      id: Date.now(),
      name,
      width: parseFloat(width),
      length: parseFloat(length),
      gridSize: parseFloat(gridSize),
      gridsX,
      gridsY,
      createdAt: new Date().toISOString()
    };

    setTerrain(newTerrain);
    setStep('map');
    showNotification('success', 'Terreno creado', `${name} generado con ${gridsX}x${gridsY} cuadrículas`);
  };

  const addSensor = (gridId, sensorData) => {
    setSensors(prev => ({
      ...prev,
      [gridId]: {
        ...sensorData,
        id: Date.now(),
        gridId,
        timestamp: new Date().toISOString()
      }
    }));
    
    showNotification('success', 'Sensor agregado', 'Datos del sensor guardados correctamente');
  };

  const getGridRecommendation = (gridId) => {
    const sensor = sensors[gridId];
    if (!sensor) return null;
    
    const recommendations = sugerirCultivos(sensor.ph, sensor.humidity, sensor.temperature);
    return recommendations.length > 0 ? recommendations[0] : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            🗺️ Simulador de Terreno GIS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {step === 'form' ? (
          <TerrainForm onSubmit={createTerrain} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <TerrainMap 
                terrain={terrain}
                sensors={sensors}
                selectedGrid={selectedGrid}
                onGridClick={setSelectedGrid}
                getGridRecommendation={getGridRecommendation}
              />
            </div>
            <div className="lg:col-span-1">
              <TerrainPanel 
                terrain={terrain}
                selectedGrid={selectedGrid}
                sensors={sensors}
                onAddSensor={() => setShowSensorModal(true)}
                onBack={() => setStep('form')}
                getGridRecommendation={getGridRecommendation}
              />
            </div>
          </div>
        )}

        {showSensorModal && selectedGrid && (
          <SensorModal
            gridId={selectedGrid}
            existingSensor={sensors[selectedGrid]}
            onClose={() => setShowSensorModal(false)}
            onSave={(data) => {
              addSensor(selectedGrid, data);
              setShowSensorModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

const TerrainForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    width: '100',
    length: '100',
    gridSize: '10'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('error', 'Error', 'El nombre del terreno es obligatorio');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Crear Nuevo Terreno
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Define las dimensiones de tu terreno para generar el mapa con cuadrículas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📝 Nombre del terreno
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: Campo Norte, Parcela A1"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📏 Ancho (metros)
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📐 Largo (metros)
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🔲 Tamaño de cuadrícula (metros)
          </label>
          <select
            value={formData.gridSize}
            onChange={(e) => setFormData(prev => ({ ...prev, gridSize: e.target.value }))}
            className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="5">5x5 metros</option>
            <option value="10">10x10 metros</option>
            <option value="20">20x20 metros</option>
            <option value="25">25x25 metros</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Cuadrículas más pequeñas = mayor precisión, más sensores necesarios
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Vista previa:</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            • Terreno: {formData.width}m × {formData.length}m
            • Cuadrículas: {Math.ceil(formData.width / formData.gridSize)} × {Math.ceil(formData.length / formData.gridSize)}
            • Total: {Math.ceil(formData.width / formData.gridSize) * Math.ceil(formData.length / formData.gridSize)} secciones
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          🗺️ Generar Terreno
        </motion.button>
      </form>
    </div>
  );
};

const TerrainMap = ({ terrain, sensors, selectedGrid, onGridClick, getGridRecommendation }) => {
  if (!terrain) return null;

  const gridWidth = 600 / terrain.gridsX;
  const gridHeight = 400 / terrain.gridsY;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {terrain.name}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {terrain.width}m × {terrain.length}m ({terrain.gridsX}×{terrain.gridsY} cuadrículas)
        </div>
      </div>

      <div className="relative bg-green-50 dark:bg-green-900/10 rounded-lg p-4 overflow-auto">
        <svg
          width="600"
          height="400"
          viewBox="0 0 600 400"
          className="border border-gray-300 dark:border-gray-600 rounded"
        >
          {/* Grid lines */}
          {Array.from({ length: terrain.gridsX + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * gridWidth}
              y1={0}
              x2={i * gridWidth}
              y2={400}
              stroke="#ccc"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: terrain.gridsY + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * gridHeight}
              x2={600}
              y2={i * gridHeight}
              stroke="#ccc"
              strokeWidth="1"
            />
          ))}

          {/* Grid cells */}
          {Array.from({ length: terrain.gridsX }).map((_, x) =>
            Array.from({ length: terrain.gridsY }).map((_, y) => {
              const gridId = `${x}-${y}`;
              const hasSensor = sensors[gridId];
              const recommendation = getGridRecommendation(gridId);
              const isSelected = selectedGrid === gridId;

              return (
                <rect
                  key={gridId}
                  x={x * gridWidth}
                  y={y * gridHeight}
                  width={gridWidth}
                  height={gridHeight}
                  fill={
                    isSelected ? '#3B82F6' :
                    hasSensor ? (recommendation ? '#10B981' : '#F59E0B') :
                    'transparent'
                  }
                  fillOpacity={isSelected ? 0.3 : hasSensor ? 0.2 : 0}
                  stroke={isSelected ? '#3B82F6' : '#ccc'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer hover:fill-blue-200 hover:fill-opacity-30"
                  onClick={() => onGridClick(gridId)}
                />
              );
            })
          )}

          {/* Sensor indicators */}
          {Object.entries(sensors).map(([gridId, sensor]) => {
            const [x, y] = gridId.split('-').map(Number);
            const centerX = x * gridWidth + gridWidth / 2;
            const centerY = y * gridHeight + gridHeight / 2;

            return (
              <g key={gridId}>
                <circle
                  cx={centerX}
                  cy={centerY}
                  r="8"
                  fill="#EF4444"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={centerX}
                  y={centerY + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  S
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 bg-opacity-30 border border-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Seleccionada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 bg-opacity-20 border border-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Con cultivo recomendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 bg-opacity-20 border border-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Con sensor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Sensor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TerrainPanel = ({ terrain, selectedGrid, sensors, onAddSensor, onBack, getGridRecommendation }) => {
  const sensor = selectedGrid ? sensors[selectedGrid] : null;
  const recommendation = selectedGrid ? getGridRecommendation(selectedGrid) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Información del Terreno
          </h3>
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Nuevo terreno
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Nombre:</span>
            <span className="font-medium text-gray-800 dark:text-white">{terrain.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Dimensiones:</span>
            <span className="font-medium text-gray-800 dark:text-white">{terrain.width}m × {terrain.length}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Cuadrículas:</span>
            <span className="font-medium text-gray-800 dark:text-white">{terrain.gridsX} × {terrain.gridsY}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Sensores:</span>
            <span className="font-medium text-gray-800 dark:text-white">{Object.keys(sensors).length}</span>
          </div>
        </div>
      </div>

      {selectedGrid ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Cuadrícula {selectedGrid}
          </h3>

          {sensor ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-semibold text-blue-800 dark:text-blue-200">pH</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{sensor.ph}</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-semibold text-green-800 dark:text-green-200">Humedad</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{sensor.humidity}%</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="font-semibold text-orange-800 dark:text-orange-200">Temp.</div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{sensor.temperature}°C</div>
                </div>
              </div>

              {recommendation && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    🌱 Cultivo Recomendado
                  </h4>
                  <div className="text-green-700 dark:text-green-300">
                    <div className="font-medium">{recommendation.nombre}</div>
                    <div className="text-sm mt-1">
                      pH: {recommendation.ph} | Humedad: {recommendation.humedad} | Temp: {recommendation.temperatura}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onAddSensor}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✏️ Editar Sensor
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                No hay sensor en esta cuadrícula
              </p>
              <button
                onClick={onAddSensor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Agregar Sensor
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👆</div>
            <p className="text-gray-600 dark:text-gray-300">
              Selecciona una cuadrícula en el mapa para ver su información
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SensorModal = ({ gridId, existingSensor, onClose, onSave }) => {
  const [sensorData, setSensorData] = useState({
    ph: existingSensor?.ph || '',
    humidity: existingSensor?.humidity || '',
    temperature: existingSensor?.temperature || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(sensorData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          📡 {existingSensor ? 'Editar' : 'Agregar'} Sensor - Cuadrícula {gridId}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              pH del suelo
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={sensorData.ph}
              onChange={(e) => setSensorData(prev => ({ ...prev, ph: e.target.value }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="6.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Humedad del suelo (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={sensorData.humidity}
              onChange={(e) => setSensorData(prev => ({ ...prev, humidity: e.target.value }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="70"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperatura (°C)
            </label>
            <input
              type="number"
              min="-10"
              max="50"
              value={sensorData.temperature}
              onChange={(e) => setSensorData(prev => ({ ...prev, temperature: e.target.value }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="22"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TerrainSimulator;