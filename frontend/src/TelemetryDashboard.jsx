import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const TelemetryDashboard = ({ isOpen, onClose, backendConnected, recentActivity }) => {
  const [stats, setStats] = useState({
    totalAnalysis: 0,
    totalCrops: 0,
    avgMaturity: 0,
    pestDetections: 0
  });
  const [recentAnalysis, setRecentAnalysis] = useState([]);
  const [cropDistribution, setCropDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
      
      // Listen for analysis updates
      const handleAnalysisUpdate = () => {
        loadDashboardData();
      };
      
      window.addEventListener('analysisUpdated', handleAnalysisUpdate);
      
      return () => {
        window.removeEventListener('analysisUpdated', handleAnalysisUpdate);
      };
    }
  }, [isOpen]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Use local data from localStorage for offline mode
      const savedAnalysis = JSON.parse(localStorage.getItem('agrosens_analysis') || '[]');
      const savedGallery = JSON.parse(localStorage.getItem('agrosens_gallery') || '[]');
      
      // Calculate statistics from local data and activity
      const totalAnalysis = savedAnalysis.length + savedGallery.length;
      const totalCrops = savedAnalysis.filter(a => a.type === 'crop').length;
      const pestDetections = savedAnalysis.filter(a => a.type === 'pest').length;
      
      // Process activity distribution
      const activityCounts = {};
      recentActivity.forEach(activity => {
        const type = activity.type || 'general';
        activityCounts[type] = (activityCounts[type] || 0) + 1;
      });
      
      const distribution = Object.entries(activityCounts).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: recentActivity.length > 0 ? ((count / recentActivity.length) * 100).toFixed(1) : 0
      }));

      // Use recent activity from app
      const recent = recentActivity.slice(0, 10).map(activity => ({
        date: activity.timestamp.toLocaleDateString(),
        cultivo: activity.description,
        verdict: activity.type,
        confidence: '95'
      }));

      setStats({
        totalAnalysis,
        totalCrops,
        avgMaturity: savedAnalysis.filter(a => a.maturity === 'maduro').length > 0 ? 
          ((savedAnalysis.filter(a => a.maturity === 'maduro').length / savedAnalysis.length) * 100).toFixed(1) : '0',
        pestDetections
      });

      setCropDistribution(distribution);
      setRecentAnalysis(recent);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 overflow-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl" style={{ maxHeight: '90vh', padding: window.innerWidth < 768 ? '16px' : '24px' }}>
        <div className="h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">📊 Dashboard AgroSens</h2>
          <button 
            onClick={onClose}
            className="px-3 py-2 md:px-4 md:py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded text-sm md:text-base hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300">Cargando datos del dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 md:p-4 rounded-lg">
                <h3 className="text-xs md:text-sm font-semibold text-blue-800 dark:text-blue-200">Análisis IA</h3>
                <p className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.totalAnalysis}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Realizados</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 md:p-4 rounded-lg">
                <h3 className="text-xs md:text-sm font-semibold text-green-800 dark:text-green-200">Cultivos</h3>
                <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-300">{stats.totalCrops}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Identificados</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 md:p-4 rounded-lg">
                <h3 className="text-xs md:text-sm font-semibold text-yellow-800 dark:text-yellow-200">Plagas</h3>
                <p className="text-lg md:text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.pestDetections}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Detectadas</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 md:p-4 rounded-lg">
                <h3 className="text-xs md:text-sm font-semibold text-purple-800 dark:text-purple-200">Actividad</h3>
                <p className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-300">{recentActivity.length}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Eventos</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Crop Distribution */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800 dark:text-white">Distribución de Cultivos</h3>
                {cropDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={cropDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hay datos de cultivos disponibles</p>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800 dark:text-white">Actividad Reciente</h3>
                <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                  {recentAnalysis.length > 0 ? (
                    recentAnalysis.map((analysis, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-600 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-medium text-gray-800 dark:text-white truncate">{analysis.cultivo}</p>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">{analysis.date}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-xs md:text-sm font-medium text-gray-800 dark:text-white">{analysis.verdict}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Conf: {analysis.confidence}%</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay análisis recientes</p>
                  )}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800 dark:text-white">Estado del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded">
                  <div className={`w-3 h-3 rounded-full ${
                    backendConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-800 dark:text-white">Servidor: {backendConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-800 dark:text-white">Cámara: Disponible</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-800 dark:text-white">IA: Funcionando</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded">
                  <div className={`w-3 h-3 rounded-full ${
                    navigator.onLine ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-800 dark:text-white">Internet: {navigator.onLine ? 'Conectado' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TelemetryDashboard;