import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const TelemetryDashboard = ({ isOpen, onClose }) => {
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
    }
  }, [isOpen]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load analysis data
      const analysisResponse = await fetch('/api/ia', {
        headers: { 'X-CSRF-Token': localStorage.getItem('csrfToken') || '' }
      });
      const analysisData = await analysisResponse.json();

      // Load crops data
      const cropsResponse = await fetch('/api/cultivos', {
        headers: { 'X-CSRF-Token': localStorage.getItem('csrfToken') || '' }
      });
      const cropsData = await cropsResponse.json();

      // Process statistics
      const totalAnalysis = analysisData.length;
      const totalCrops = cropsData.length;
      const pestDetections = analysisData.filter(a => a.heatmapEnabled && a.verdict?.includes('plag')).length;
      
      // Calculate crop distribution
      const cropCounts = {};
      analysisData.forEach(analysis => {
        if (analysis.cultivo) {
          cropCounts[analysis.cultivo] = (cropCounts[analysis.cultivo] || 0) + 1;
        }
      });

      const distribution = Object.entries(cropCounts).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / totalAnalysis) * 100).toFixed(1)
      }));

      // Recent analysis for timeline
      const recent = analysisData
        .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
        .slice(0, 10)
        .map(analysis => ({
          date: new Date(analysis.createdAt || analysis.timestamp).toLocaleDateString(),
          cultivo: analysis.cultivo || 'Desconocido',
          verdict: analysis.verdict || 'Sin resultado',
          confidence: analysis.confidence ? (analysis.confidence * 100).toFixed(1) : 'N/A'
        }));

      setStats({
        totalAnalysis,
        totalCrops,
        avgMaturity: ((analysisData.filter(a => a.verdict === 'maduro').length / totalAnalysis) * 100).toFixed(1),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[95%] max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📊 Dashboard AgroSens</h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
          >
            Cerrar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4">Cargando datos del dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Total Análisis</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.totalAnalysis}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">Cultivos Registrados</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">{stats.totalCrops}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">% Madurez Promedio</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.avgMaturity}%</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Detecciones de Plagas</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-300">{stats.pestDetections}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Crop Distribution */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Distribución de Cultivos</h3>
                {cropDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
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
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentAnalysis.length > 0 ? (
                    recentAnalysis.map((analysis, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-600 rounded">
                        <div>
                          <p className="font-medium">{analysis.cultivo}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{analysis.verdict}</p>
                          <p className="text-xs text-gray-500">Conf: {analysis.confidence}%</p>
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
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Base de datos: Conectada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>IA: Funcionando</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Cámara: Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Sincronización: Pendiente</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryDashboard;