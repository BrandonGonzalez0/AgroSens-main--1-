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
      const response = await fetch('/api/sensores/latest', {
        headers: { 'X-CSRF-Token': localStorage.getItem('csrfToken') || '' }
      });
      
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
        
        if (autoMode) {
          showNotification('success', 'Sensores actualizados', 'Datos recibidos del Arduino', 2000);
        }
      } else {
        throw new Error('Sensor no disponible');
      }
    } catch (error) {
      setSensorData(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false
      }));
      
      if (autoMode) {
        showNotification('warning', 'Sensor desconectado', 'No se pueden obtener datos automáticos');
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