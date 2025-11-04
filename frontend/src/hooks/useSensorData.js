import { useState, useEffect } from 'react';
import { showNotification } from '../NotificationSystem';

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState({
    ph: '',
    humidity: '',
    temperature: '',
    lastUpdate: null,
    isConnected: false,
    isLoading: false
  });

  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    let interval;
    
    if (autoMode) {
      interval = setInterval(fetchSensorData, 5000);
      fetchSensorData();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoMode]);

  const fetchSensorData = async () => {
    setSensorData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/sensores/latest');
      
      if (response.ok) {
        const data = await response.json();
        setSensorData({
          ph: data.ph?.toFixed(1) || '',
          humidity: data.soilMoisture?.toFixed(1) || '',
          temperature: data.temperature?.toFixed(1) || '',
          lastUpdate: new Date(data.timestamp),
          isConnected: true,
          isLoading: false
        });
      } else {
        throw new Error('Backend no disponible');
      }
    } catch (error) {
      // Usar datos simulados cuando el backend no está disponible
      const mockData = {
        ph: (6.5 + (Math.random() - 0.5) * 2).toFixed(1),
        humidity: (65 + (Math.random() - 0.5) * 20).toFixed(1),
        temperature: (22 + (Math.random() - 0.5) * 10).toFixed(1),
        lastUpdate: new Date(),
        isConnected: false,
        isLoading: false
      };
      
      setSensorData(mockData);
      
      if (autoMode) {
        showNotification('warning', 'Backend desconectado', 'Usando datos simulados');
      }
    }
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode) {
      showNotification('info', 'Modo automático activado', 'Los sensores se actualizarán cada 5 segundos');
    } else {
      showNotification('info', 'Modo manual activado', 'Ingresa los datos manualmente');
    }
  };

  return {
    sensorData,
    autoMode,
    toggleAutoMode,
    fetchSensorData
  };
};