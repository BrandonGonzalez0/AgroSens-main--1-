// Mobile compatibility utilities
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

// Mock sensor data for mobile/production
export const getMockSensorData = () => ({
  ph: (6.0 + Math.random() * 2).toFixed(1),
  humidity: (60 + Math.random() * 30).toFixed(0),
  temperature: (18 + Math.random() * 12).toFixed(1),
  timestamp: new Date().toISOString(),
  isConnected: true
});

// Enhanced useSensorData hook for mobile
export const useMobileSensorData = (originalHook) => {
  const { sensorData: rawSensorData, autoMode, toggleAutoMode, fetchSensorData } = originalHook();
  const [mockSensorData, setMockSensorData] = React.useState(null);
  
  // Use mock data on mobile or when Arduino not connected
  const sensorData = (isMobile() || !rawSensorData.isConnected) ? 
    { ...rawSensorData, ...mockSensorData, isConnected: isMobile() } : rawSensorData;
  
  // Generate mock data periodically on mobile
  React.useEffect(() => {
    if (isMobile() || !rawSensorData.isConnected) {
      const interval = setInterval(() => {
        setMockSensorData(getMockSensorData());
      }, 3000);
      
      // Initial mock data
      setMockSensorData(getMockSensorData());
      
      return () => clearInterval(interval);
    }
  }, [rawSensorData.isConnected]);

  return { sensorData, autoMode, toggleAutoMode, fetchSensorData };
};