import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { showNotification } from './NotificationSystem';
import { sugerirCultivos } from './ServiciosCultivos';

const GeoTerrainSimulator = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('form');
  const [terrain, setTerrain] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [sensors, setSensors] = useState({});
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customCorners, setCustomCorners] = useState([]);
  const [isSelectingCorners, setIsSelectingCorners] = useState(false);
  const [originalTerrain, setOriginalTerrain] = useState(null);
  const [savedTerrains, setSavedTerrains] = useState([]);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  useEffect(() => {
    if (isOpen && !mapLoaded) {
      loadLeafletMap();
    }
    
    // Load saved terrains from localStorage
    if (isOpen) {
      const saved = localStorage.getItem('agrosens_saved_terrains');
      if (saved) {
        try {
          setSavedTerrains(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading saved terrains:', e);
        }
      }
    }
  }, [isOpen, mapLoaded]);

  const loadLeafletMap = () => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setMapLoaded(true);
    }
  };

  const createGeoreferencedTerrain = (formData) => {
    const { name, centerLat, centerLng, width, length, gridSize } = formData;
    
    const latDelta = (length / 111320);
    const lngDelta = (width / (111320 * Math.cos(centerLat * Math.PI / 180)));
    
    const bounds = {
      north: parseFloat(centerLat) + latDelta / 2,
      south: parseFloat(centerLat) - latDelta / 2,
      east: parseFloat(centerLng) + lngDelta / 2,
      west: parseFloat(centerLng) - lngDelta / 2
    };

    const gridsX = Math.ceil(width / gridSize);
    const gridsY = Math.ceil(length / gridSize);

    const newTerrain = {
      id: Date.now(),
      name,
      centerLat: parseFloat(centerLat),
      centerLng: parseFloat(centerLng),
      width: parseFloat(width),
      length: parseFloat(length),
      gridSize: parseFloat(gridSize),
      gridsX,
      gridsY,
      bounds,
      isGeoreferenced: true,
      createdAt: new Date().toISOString()
    };

    setTerrain(newTerrain);
    setStep('map');
    showNotification('success', 'Terreno GPS creado', `${name} georreferenciado con ${gridsX}x${gridsY} cuadrículas`);
  };

  const gridToGeo = (gridId) => {
    if (!terrain?.bounds) return null;
    
    const [x, y] = gridId.split('-').map(Number);
    const { north, south, east, west } = terrain.bounds;
    
    const lng = west + ((x + 0.5) / terrain.gridsX) * (east - west);
    const lat = north - ((y + 0.5) / terrain.gridsY) * (north - south);
    
    return { lat, lng };
  };

  const addSensor = (gridId, sensorData) => {
    const geoCoords = gridToGeo(gridId);
    setSensors(prev => ({
      ...prev,
      [gridId]: {
        ...sensorData,
        id: Date.now(),
        gridId,
        lat: geoCoords?.lat,
        lng: geoCoords?.lng,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Refresh map to show new sensor
    setTimeout(() => {
      if (leafletMapRef.current && terrain) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        setTimeout(() => initializeMap(), 100);
      }
    }, 100);
    
    showNotification('success', 'Sensor GPS agregado', `Coordenadas: ${geoCoords?.lat.toFixed(6)}, ${geoCoords?.lng.toFixed(6)}`);
  };

  const getGridRecommendation = (gridId) => {
    const sensor = sensors[gridId];
    if (!sensor) return null;
    
    const recommendations = sugerirCultivos(sensor.ph, sensor.humidity, sensor.temperature);
    return recommendations.length > 0 ? recommendations[0] : null;
  };

  const exportToGeoJSON = () => {
    const features = Object.entries(sensors).map(([gridId, sensor]) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [sensor.lng, sensor.lat]
      },
      properties: {
        gridId,
        ph: sensor.ph,
        humidity: sensor.humidity,
        temperature: sensor.temperature,
        timestamp: sensor.timestamp,
        recommendation: getGridRecommendation(gridId)?.nombre || null
      }
    }));

    const geoJSON = {
      type: 'FeatureCollection',
      features,
      properties: {
        terrain: terrain.name,
        bounds: terrain.bounds,
        createdAt: terrain.createdAt
      }
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${terrain.name.replace(/\s+/g, '_')}_sensores.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('success', 'GeoJSON exportado', 'Archivo descargado correctamente');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-7xl w-full mx-4 max-h-[95vh]">
          <div className="h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              🌍 Terreno Georreferenciado
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {step === 'form' ? (
            <GeoTerrainForm 
              onSubmit={createGeoreferencedTerrain} 
              onCustomMode={() => {
                setCustomMode(true);
                setStep('custom');
                setCustomCorners([]);
              }}
            />
          ) : step === 'custom' ? (
            <CustomTerrainMap 
              mapLoaded={mapLoaded}
              mapRef={mapRef}
              leafletMapRef={leafletMapRef}
              customCorners={customCorners}
              setCustomCorners={setCustomCorners}
              originalTerrain={originalTerrain}
              onCreateTerrain={(terrainData) => {
                console.log('Creando terreno personalizado', terrainData);
                if (leafletMapRef.current) {
                  leafletMapRef.current.remove();
                  leafletMapRef.current = null;
                }
                setTerrain(terrainData);
                setStep('map');
                setCustomMode(false);
                setSensors({});
                setSelectedGrid(null);
              }}
              onBack={() => {
                console.log('Volviendo desde custom mode');
                if (leafletMapRef.current) {
                  leafletMapRef.current.remove();
                  leafletMapRef.current = null;
                }
                if (originalTerrain) {
                  setTerrain(originalTerrain);
                  setStep('map');
                } else {
                  setStep('form');
                }
                setCustomMode(false);
                setCustomCorners([]);
                setOriginalTerrain(null);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <GeoTerrainMap 
                  terrain={terrain}
                  sensors={sensors}
                  selectedGrid={selectedGrid}
                  onGridClick={setSelectedGrid}
                  getGridRecommendation={getGridRecommendation}
                  mapLoaded={mapLoaded}
                  mapRef={mapRef}
                  leafletMapRef={leafletMapRef}
                  isSelectingCorners={isSelectingCorners}
                  customCorners={customCorners}
                  setCustomCorners={setCustomCorners}
                  onFinishCustomSelection={(newTerrain) => {
                    if (leafletMapRef.current) {
                      leafletMapRef.current.remove();
                      leafletMapRef.current = null;
                    }
                    setTerrain(newTerrain);
                    setIsSelectingCorners(false);
                    setCustomCorners([]);
                    setSensors({});
                    setSelectedGrid(null);
                    setOriginalTerrain(null);
                  }}
                  onCancelCustomSelection={() => {
                    if (leafletMapRef.current) {
                      leafletMapRef.current.remove();
                      leafletMapRef.current = null;
                    }
                    setIsSelectingCorners(false);
                    setCustomCorners([]);
                    if (originalTerrain) {
                      setTerrain(originalTerrain);
                      setOriginalTerrain(null);
                    }
                  }}
                />
              </div>
              <div className="lg:col-span-1">
                <GeoTerrainPanel 
                  terrain={terrain}
                  selectedGrid={selectedGrid}
                  sensors={sensors}
                  onAddSensor={() => setShowSensorModal(true)}
                  onBack={() => setStep('form')}
                  onExport={exportToGeoJSON}
                  getGridRecommendation={getGridRecommendation}
                  gridToGeo={gridToGeo}
                  onCustomMode={() => {
                    console.log('Activando modo selección de esquinas');
                    setOriginalTerrain(terrain);
                    setIsSelectingCorners(true);
                    setCustomCorners([]);
                    setSelectedGrid(null);
                  }}
                  onSaveTerrain={(terrainData) => {
                    const savedTerrain = {
                      ...terrainData,
                      savedAt: new Date().toISOString(),
                      sensors: { ...sensors }
                    };
                    setSavedTerrains(prev => [...prev, savedTerrain]);
                    localStorage.setItem('agrosens_saved_terrains', JSON.stringify([...savedTerrains, savedTerrain]));
                    showNotification('success', 'Terreno guardado', 'Progreso guardado para continuar después');
                  }}
                  savedTerrains={savedTerrains}
                  onLoadTerrain={(savedTerrain) => {
                    setTerrain(savedTerrain);
                    setSensors(savedTerrain.sensors || {});
                    setSelectedGrid(null);
                    showNotification('success', 'Terreno cargado', 'Progreso restaurado correctamente');
                  }}
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {showSensorModal && selectedGrid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <SensorModal
            gridId={selectedGrid}
            existingSensor={sensors[selectedGrid]}
            geoCoords={gridToGeo(selectedGrid)}
            onClose={() => setShowSensorModal(false)}
            onSave={(data) => {
              addSensor(selectedGrid, data);
              setShowSensorModal(false);
            }}
          />
        </div>
      )}
    </>
  );
};

const GeoTerrainForm = ({ onSubmit, onCustomMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    centerLat: '',
    centerLng: '',
    width: '100',
    length: '100',
    gridSize: '10'
  });

  const [gpsLoading, setGpsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('error', 'GPS no disponible', 'Tu dispositivo no soporta geolocalización');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          centerLat: position.coords.latitude.toFixed(6),
          centerLng: position.coords.longitude.toFixed(6)
        }));
        setGpsLoading(false);
        showNotification('success', 'Ubicación obtenida', 'Coordenadas GPS actualizadas');
      },
      (error) => {
        setGpsLoading(false);
        let errorMessage = 'No se pudo obtener la ubicación';
        if (error.code === 1) errorMessage = 'Permiso de ubicación denegado';
        else if (error.code === 2) errorMessage = 'Ubicación no disponible';
        else if (error.code === 3) errorMessage = 'Tiempo de espera agotado';
        showNotification('error', 'Error GPS', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.centerLat || !formData.centerLng) {
      showNotification('error', 'Error', 'Completa todos los campos obligatorios');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🌍</div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Crear Terreno Georreferenciado
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Define tu terreno con coordenadas GPS reales para mapeo preciso
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📝 Nombre del terreno *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: Finca San José - Lote A"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📍 Latitud Central *
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.centerLat}
              onChange={(e) => setFormData(prev => ({ ...prev, centerLat: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="-12.046374"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📍 Longitud Central *
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.centerLng}
              onChange={(e) => setFormData(prev => ({ ...prev, centerLng: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="-77.042793"
              required
            />
          </div>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gpsLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-2xl transition-all"
        >
          {gpsLoading ? '📡 Obteniendo ubicación...' : '📱 Usar Ubicación Actual'}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📏 Ancho (m)
            </label>
            <input
              type="number"
              min="10"
              max="5000"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📐 Largo (m)
            </label>
            <input
              type="number"
              min="10"
              max="5000"
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              🔲 Grid (m)
            </label>
            <select
              value={formData.gridSize}
              onChange={(e) => setFormData(prev => ({ ...prev, gridSize: e.target.value }))}
              className="w-full p-4 border rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="5">5x5m</option>
              <option value="10">10x10m</option>
              <option value="20">20x20m</option>
              <option value="25">25x25m</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🗺️ Vista previa GPS:</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>• Área: {formData.width}m × {formData.length}m = {(formData.width * formData.length / 10000).toFixed(2)} hectáreas</div>
            <div>• Cuadrículas: {Math.ceil(formData.width / formData.gridSize)} × {Math.ceil(formData.length / formData.gridSize)}</div>
            {formData.centerLat && formData.centerLng && (
              <div>• Centro: {parseFloat(formData.centerLat).toFixed(6)}, {parseFloat(formData.centerLng).toFixed(6)}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            🌍 Crear Terreno GPS
          </motion.button>
          

        </div>
      </form>
    </div>
  );
};

const GeoTerrainMap = ({ terrain, sensors, selectedGrid, onGridClick, getGridRecommendation, mapLoaded, mapRef, leafletMapRef, isSelectingCorners, customCorners, setCustomCorners, onFinishCustomSelection, onCancelCustomSelection }) => {
  useEffect(() => {
    if (mapLoaded && terrain && mapRef.current && !leafletMapRef.current) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [mapLoaded, terrain]);

  useEffect(() => {
    if (leafletMapRef.current && terrain) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      setTimeout(() => initializeMap(), 100);
    }
  }, [sensors]);

  useEffect(() => {
    if (leafletMapRef.current && isSelectingCorners) {
      updateCustomMarkers();
    }
  }, [customCorners]);

  useEffect(() => {
    if (leafletMapRef.current && isSelectingCorners) {
      const map = leafletMapRef.current;
      
      // Limpiar el mapa de elementos anteriores
      map.eachLayer((layer) => {
        if (layer instanceof window.L.Rectangle || layer instanceof window.L.Marker) {
          map.removeLayer(layer);
        }
      });
      
      const handleMapClick = (e) => {
        if (customCorners.length < 4) {
          const newCorner = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            index: customCorners.length
          };
          setCustomCorners(prev => [...prev, newCorner]);
        }
      };
      
      map.off('click'); // Remover handlers anteriores
      map.on('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [isSelectingCorners, customCorners.length]);

  const updateCustomMarkers = () => {
    if (!leafletMapRef.current || !window.L) return;

    const map = leafletMapRef.current;
    
    // Remover marcadores anteriores y elementos del terreno original
    map.eachLayer((layer) => {
      if (layer.options && (layer.options.isCustomMarker || layer instanceof window.L.Rectangle)) {
        map.removeLayer(layer);
      }
    });

    // Agregar marcadores para cada esquina
    customCorners.forEach((corner, index) => {
      window.L.marker([corner.lat, corner.lng], {
        icon: window.L.divIcon({
          html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${index + 1}</div>`,
          className: 'custom-corner-marker',
          iconSize: [24, 24]
        }),
        isCustomMarker: true
      }).addTo(map);
    });

    // Si tenemos 4 esquinas, dibujar el polígono
    if (customCorners.length === 4) {
      const polygonCoords = customCorners.map(corner => [corner.lat, corner.lng]);
      window.L.polygon(polygonCoords, {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.2,
        isCustomMarker: true
      }).addTo(map);
    }
  };



  const initializeMap = () => {
    if (!window.L || !terrain || !mapRef.current) return;

    try {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = window.L.map(mapRef.current, {
        center: [terrain.centerLat, terrain.centerLng],
        zoom: 16,
        zoomControl: true
      });
      
      // Base layers
      const osmLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });
      
      const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      });
      
      const hybridLayer = window.L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '© Google',
        maxZoom: 19
      });

      // Add default layer
      satelliteLayer.addTo(map);
      
      // Layer control
      const baseLayers = {
        '🛰️ Satélite': satelliteLayer,
        '🗺️ Mapa': osmLayer,
        '🌍 Híbrido': hybridLayer
      };
      
      window.L.control.layers(baseLayers).addTo(map);

      if (!isSelectingCorners && !terrain.isCustom) {
        const bounds = [
          [terrain.bounds.south, terrain.bounds.west],
          [terrain.bounds.north, terrain.bounds.east]
        ];
        
        window.L.rectangle(bounds, {
          color: '#3B82F6',
          weight: 2,
          fillOpacity: 0.1
        }).addTo(map);
      }

      if (!isSelectingCorners) {
        drawGrid(map, terrain);
      }
      
      leafletMapRef.current = map;
      map.invalidateSize();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };



  const drawGrid = (map, terrain) => {
    const { bounds, gridsX, gridsY } = terrain;
    const latStep = (bounds.north - bounds.south) / gridsY;
    const lngStep = (bounds.east - bounds.west) / gridsX;

    // Si es un terreno personalizado, dibujar el polígono primero
    if (terrain.isCustom && terrain.corners) {
      const polygonCoords = terrain.corners.map(corner => [corner.lat, corner.lng]);
      window.L.polygon(polygonCoords, {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.1
      }).addTo(map);
    }

    for (let x = 0; x < gridsX; x++) {
      for (let y = 0; y < gridsY; y++) {
        const gridId = `${x}-${y}`;
        const south = bounds.south + y * latStep;
        const north = bounds.south + (y + 1) * latStep;
        const west = bounds.west + x * lngStep;
        const east = bounds.west + (x + 1) * lngStep;

        const gridBounds = [[south, west], [north, east]];
        const hasSensor = sensors[gridId];
        const recommendation = getGridRecommendation(gridId);

        // Para terrenos personalizados, verificar si la cuadrícula está dentro del polígono
        let isInsidePolygon = true;
        if (terrain.isCustom && terrain.corners) {
          const centerLat = (south + north) / 2;
          const centerLng = (west + east) / 2;
          isInsidePolygon = pointInPolygon([centerLat, centerLng], terrain.corners.map(c => [c.lat, c.lng]));
        }

        if (isInsidePolygon) {
          const rectangle = window.L.rectangle(gridBounds, {
            color: selectedGrid === gridId ? '#3B82F6' : '#ccc',
            weight: selectedGrid === gridId ? 2 : 1,
            fillColor: hasSensor ? (recommendation ? '#10B981' : '#F59E0B') : 'transparent',
            fillOpacity: hasSensor ? 0.3 : 0
          }).addTo(map);

          if (hasSensor) {
            const centerLat = (south + north) / 2;
            const centerLng = (west + east) / 2;
            
            window.L.marker([centerLat, centerLng], {
              icon: window.L.divIcon({
                html: '📡',
                className: 'sensor-marker',
                iconSize: [20, 20]
              })
            }).addTo(map);
          }

          rectangle.on('click', () => onGridClick(gridId));
        }
      }
    }
  };

  // Función para verificar si un punto está dentro de un polígono
  const pointInPolygon = (point, polygon) => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  if (!terrain) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          🌍 {terrain.name}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {terrain.isCustom ? 'Personalizado' : `GPS: ${terrain.centerLat.toFixed(6)}, ${terrain.centerLng.toFixed(6)}`}
        </div>
      </div>

      <div 
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
        style={{ minHeight: '400px', width: '100%' }}
      >
        {(!mapLoaded || !terrain) && (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600 dark:text-gray-300">
                {!mapLoaded ? 'Cargando mapa...' : 'Inicializando terreno GPS...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {isSelectingCorners ? (
        <CustomSelectionOverlay 
          customCorners={customCorners}
          terrain={terrain}
          onFinish={onFinishCustomSelection}
          onCancel={onCancelCustomSelection}
        />
      ) : (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 bg-opacity-30 border border-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Seleccionada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 bg-opacity-30 border border-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Con cultivo recomendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 bg-opacity-30 border border-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Con sensor (sin cultivo)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <span className="text-gray-600 dark:text-gray-300">Sensor GPS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-gray-300 rounded bg-transparent"></div>
            <span className="text-gray-600 dark:text-gray-300">Vacía</span>
          </div>
        </div>
      )}
    </div>
  );
};

const GeoTerrainPanel = ({ terrain, selectedGrid, sensors, onAddSensor, onBack, onExport, getGridRecommendation, gridToGeo, onCustomMode, onSaveTerrain, savedTerrains, onLoadTerrain }) => {
  const sensor = selectedGrid ? sensors[selectedGrid] : null;
  const recommendation = selectedGrid ? getGridRecommendation(selectedGrid) : null;
  const geoCoords = selectedGrid ? gridToGeo(selectedGrid) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            🌍 Info GPS
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
            <span className="text-gray-600 dark:text-gray-300">Centro GPS:</span>
            <span className="font-medium text-gray-800 dark:text-white text-xs">
              {terrain.centerLat.toFixed(6)}, {terrain.centerLng.toFixed(6)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Área:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {(terrain.width * terrain.length / 10000).toFixed(2)} ha
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Sensores GPS:</span>
            <span className="font-medium text-gray-800 dark:text-white">{Object.keys(sensors).length}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => onSaveTerrain(terrain)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
          >
            💾 Guardar Progreso
          </button>
          
          <button
            onClick={onExport}
            disabled={Object.keys(sensors).length === 0}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-all"
          >
            📄 Exportar GeoJSON
          </button>
          
          <button
            onClick={() => {
              console.log('Botón mapa personalizado clickeado');
              onCustomMode();
            }}
            className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all"
          >
            📍 Mapa Personalizado
          </button>
        </div>
        
        {savedTerrains.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              💾 Terrenos Guardados
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {savedTerrains.map((saved, index) => (
                <button
                  key={index}
                  onClick={() => onLoadTerrain(saved)}
                  className="w-full text-left px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                >
                  <div className="font-medium">{saved.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {new Date(saved.savedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedGrid ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            📍 Grid {selectedGrid}
          </h3>

          {geoCoords && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Coordenadas GPS:</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                {geoCoords.lat.toFixed(6)}, {geoCoords.lng.toFixed(6)}
              </div>
            </div>
          )}

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
                ✏️ Editar Sensor GPS
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                No hay sensor GPS en esta cuadrícula
              </p>
              <button
                onClick={onAddSensor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Agregar Sensor GPS
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-gray-600 dark:text-gray-300">
              Selecciona una cuadrícula en el mapa GPS para ver su información
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomTerrainMap = ({ mapLoaded, mapRef, leafletMapRef, customCorners, setCustomCorners, onCreateTerrain, onBack }) => {
  const [terrainName, setTerrainName] = useState('');
  const [gridSize, setGridSize] = useState('10');

  useEffect(() => {
    if (mapLoaded && mapRef.current && !leafletMapRef.current) {
      setTimeout(() => initializeCustomMap(), 100);
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      setTimeout(() => initializeCustomMap(), 100);
    }
  }, []);

  useEffect(() => {
    if (leafletMapRef.current && customCorners.length > 0) {
      updateCustomMap();
    }
  }, [customCorners]);

  const initializeCustomMap = () => {
    if (!window.L || !mapRef.current) return;

    try {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = window.L.map(mapRef.current, {
        center: [-12.046374, -77.042793], // Lima, Peru por defecto
        zoom: 16,
        zoomControl: true
      });
      
      const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      });
      
      satelliteLayer.addTo(map);
      
      // Click handler para el mapa
      const handleMapClick = (e) => {
        if (isSelectingCorners && customCorners.length < 4) {
          const newCorner = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            index: customCorners.length
          };
          setCustomCorners(prev => [...prev, newCorner]);
        }
      };
      
      map.on('click', handleMapClick);
      
      leafletMapRef.current = map;
      map.invalidateSize();
    } catch (error) {
      console.error('Error initializing custom map:', error);
    }
  };

  const updateCustomMap = () => {
    if (!leafletMapRef.current || !window.L) return;

    const map = leafletMapRef.current;
    
    // Limpiar marcadores anteriores
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Agregar marcadores para cada esquina
    customCorners.forEach((corner, index) => {
      window.L.marker([corner.lat, corner.lng], {
        icon: window.L.divIcon({
          html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${index + 1}</div>`,
          className: 'custom-corner-marker',
          iconSize: [24, 24]
        })
      }).addTo(map);
    });

    // Si tenemos 4 esquinas, dibujar el polígono
    if (customCorners.length === 4) {
      const polygonCoords = customCorners.map(corner => [corner.lat, corner.lng]);
      window.L.polygon(polygonCoords, {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.2
      }).addTo(map);
    }
  };

  const resetCorners = () => {
    setCustomCorners([]);
    if (leafletMapRef.current) {
      leafletMapRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker || layer instanceof window.L.Polygon) {
          leafletMapRef.current.removeLayer(layer);
        }
      });
    }
  };

  const createCustomTerrain = () => {
    if (customCorners.length !== 4 || !terrainName.trim()) {
      showNotification('error', 'Error', 'Necesitas 4 esquinas y un nombre para el terreno');
      return;
    }

    // Calcular bounds del polígono
    const lats = customCorners.map(c => c.lat);
    const lngs = customCorners.map(c => c.lng);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    // Calcular centro
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;

    // Calcular dimensiones aproximadas
    const width = Math.abs(bounds.east - bounds.west) * 111320 * Math.cos(centerLat * Math.PI / 180);
    const length = Math.abs(bounds.north - bounds.south) * 111320;

    const gridsX = Math.ceil(width / parseFloat(gridSize));
    const gridsY = Math.ceil(length / parseFloat(gridSize));

    const customTerrain = {
      id: Date.now(),
      name: terrainName,
      centerLat,
      centerLng,
      width,
      length,
      gridSize: parseFloat(gridSize),
      gridsX,
      gridsY,
      bounds,
      corners: customCorners,
      isCustom: true,
      isGeoreferenced: true,
      createdAt: new Date().toISOString()
    };

    onCreateTerrain(customTerrain);
    showNotification('success', 'Terreno personalizado creado', `${terrainName} con ${gridsX}x${gridsY} cuadrículas`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">📍</div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Crear Mapa Personalizado
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Haz click en las 4 esquinas de tu terreno en el mapa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                🗺️ Selecciona las 4 esquinas
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Esquinas: {customCorners.length}/4
              </div>
            </div>

            <div 
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600 cursor-crosshair"
              style={{ minHeight: '400px', width: '100%' }}
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-gray-600 dark:text-gray-300">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-gray-600 dark:text-gray-300">Esquina 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-gray-600 dark:text-gray-300">Esquina 2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-gray-600 dark:text-gray-300">Esquina 3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-gray-600 dark:text-gray-300">Esquina 4</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              ⚙️ Configuración
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del terreno
                </label>
                <input
                  type="text"
                  value={terrainName}
                  onChange={(e) => setTerrainName(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Mi terreno personalizado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño de cuadrícula
                </label>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="5">5x5m</option>
                  <option value="10">10x10m</option>
                  <option value="20">20x20m</option>
                  <option value="25">25x25m</option>
                </select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Esquinas seleccionadas:</h4>
                {customCorners.map((corner, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {index + 1}: {corner.lat.toFixed(6)}, {corner.lng.toFixed(6)}
                  </div>
                ))}
                {customCorners.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Haz click en el mapa para agregar esquinas
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={resetCorners}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🗑️ Limpiar esquinas
                </button>
                
                <button
                  onClick={createCustomTerrain}
                  disabled={customCorners.length !== 4 || !terrainName.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  ✅ Crear terreno
                </button>
                
                <button
                  onClick={onBack}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  ← Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomSelectionOverlay = ({ customCorners, terrain, onFinish, onCancel }) => {
  const [terrainName, setTerrainName] = useState(terrain.name + ' - Personalizado');
  const [gridSize, setGridSize] = useState(terrain.gridSize.toString());

  const createCustomTerrain = () => {
    if (customCorners.length !== 4) {
      showNotification('error', 'Error', 'Necesitas seleccionar 4 esquinas');
      return;
    }

    const lats = customCorners.map(c => c.lat);
    const lngs = customCorners.map(c => c.lng);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const width = Math.abs(bounds.east - bounds.west) * 111320 * Math.cos(centerLat * Math.PI / 180);
    const length = Math.abs(bounds.north - bounds.south) * 111320;
    const gridsX = Math.ceil(width / parseFloat(gridSize));
    const gridsY = Math.ceil(length / parseFloat(gridSize));

    const customTerrain = {
      ...terrain,
      id: Date.now(),
      name: terrainName,
      centerLat,
      centerLng,
      width,
      length,
      gridSize: parseFloat(gridSize),
      gridsX,
      gridsY,
      bounds,
      corners: customCorners,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    onFinish(customTerrain);
    showNotification('success', 'Área personalizada creada', `${terrainName} con ${gridsX}x${gridsY} cuadrículas`);
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200">
          📍 Seleccionar Área Personalizada ({customCorners.length}/4)
        </h4>
        <button
          onClick={onCancel}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          ✕ Cancelar
        </button>
      </div>
      
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        Haz click en las 4 esquinas del área que quieres cultivar
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={terrainName}
            onChange={(e) => setTerrainName(e.target.value)}
            className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
            Grid
          </label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(e.target.value)}
            className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="5">5x5m</option>
            <option value="10">10x10m</option>
            <option value="20">20x20m</option>
            <option value="25">25x25m</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={createCustomTerrain}
          disabled={customCorners.length !== 4}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          ✅ Crear Área
        </button>
        <button
          onClick={() => setCustomCorners && setCustomCorners([])}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          🗑️ Limpiar
        </button>
      </div>
    </div>
  );
};

const SensorModal = ({ gridId, existingSensor, geoCoords, onClose, onSave }) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        📡 {existingSensor ? 'Editar' : 'Agregar'} Sensor GPS - Grid {gridId}
      </h3>

      {geoCoords && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Coordenadas GPS:</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
            {geoCoords.lat.toFixed(6)}, {geoCoords.lng.toFixed(6)}
          </div>
        </div>
      )}

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
            Guardar GPS
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeoTerrainSimulator;

// Agregar import de useState al inicio del archivo si no está
// import React, { useState, useEffect, useRef } from 'react';