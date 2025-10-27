import React, { useState, useEffect } from 'react';

const CaptureGallery = ({ isOpen, onClose }) => {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadCaptures();
      
      // Listen for analysis updates
      const handleAnalysisUpdate = () => {
        loadCaptures();
      };
      
      window.addEventListener('analysisUpdated', handleAnalysisUpdate);
      
      return () => {
        window.removeEventListener('analysisUpdated', handleAnalysisUpdate);
      };
    }
  }, [isOpen]);

  const loadCaptures = async () => {
    setLoading(true);
    try {
      // Load from localStorage gallery
      const localGallery = JSON.parse(localStorage.getItem('agrosens_gallery') || '[]');
      
      // Load from API
      const response = await fetch('/api/ia', {
        headers: { 'X-CSRF-Token': localStorage.getItem('csrfToken') || '' }
      });
      const apiData = await response.json();
      
      // Transform API data
      const apiCaptures = apiData
        .filter(item => item.image)
        .map(item => ({
          ...item,
          id: item._id || item.id,
          category: getCategoryFromVerdict(item.verdict, item.analysisMode),
          saved: false
        }));
      
      // Combine and sort by timestamp
      const allCaptures = [...localGallery, ...apiCaptures]
        .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      
      setCaptures(allCaptures);
    } catch (error) {
      console.error('Error loading captures:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCategoryFromVerdict = (verdict, mode) => {
    if (mode === 'pest') {
      return verdict?.includes('plaga') ? 'plagas' : 'sanas';
    }
    if (verdict === 'maduro') return 'maduras';
    if (verdict === 'verde' || verdict === 'inmaduro') return 'verdes';
    return 'desarrollo';
  };

  const deleteCapture = async (captureId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta captura?')) return;
    
    try {
      const response = await fetch(`/api/ia/${captureId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': localStorage.getItem('csrfToken') || '' }
      });
      
      if (response.ok) {
        setCaptures(captures.filter(c => c._id !== captureId));
        setSelectedCapture(null);
      }
    } catch (error) {
      console.error('Error deleting capture:', error);
    }
  };

  const filteredCaptures = captures.filter(capture => {
    if (activeCategory === 'all') return true;
    return capture.category === activeCategory;
  });
  
  const getCategoryCount = (category) => {
    if (category === 'all') return captures.length;
    return captures.filter(c => c.category === category).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[95%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📸 Galería de Capturas</h2>
          <div className="flex gap-2">
            <button 
              onClick={loadCaptures}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              🔄 Actualizar
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            📋 Todas ({getCategoryCount('all')})
          </button>
          <button
            onClick={() => setActiveCategory('maduras')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'maduras' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🍅 Maduras ({getCategoryCount('maduras')})
          </button>
          <button
            onClick={() => setActiveCategory('verdes')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'verdes' ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🌱 Verdes ({getCategoryCount('verdes')})
          </button>
          <button
            onClick={() => setActiveCategory('desarrollo')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'desarrollo' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🌿 Desarrollo ({getCategoryCount('desarrollo')})
          </button>
          <button
            onClick={() => setActiveCategory('plagas')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'plagas' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🐛 Plagas ({getCategoryCount('plagas')})
          </button>
          <button
            onClick={() => setActiveCategory('sanas')}
            className={`px-3 py-1 rounded text-sm ${
              activeCategory === 'sanas' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            ✅ Sanas ({getCategoryCount('sanas')})
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4">Cargando capturas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Gallery Grid */}
              <div className="lg:col-span-2 overflow-y-auto">
                {filteredCaptures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay capturas que coincidan con el filtro seleccionado
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredCaptures.map((capture) => (
                      <div 
                        key={capture._id}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          selectedCapture?._id === capture._id 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedCapture(capture)}
                      >
                        <div className="relative">
                          <img 
                            src={capture.image?.startsWith('data:') ? capture.image : `data:image/jpeg;base64,${capture.image}`}
                            alt="Captura"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              console.error('Error loading image:', capture.image?.substring(0, 50));
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K';
                            }}
                          />
                          {capture.saved && (
                            <div className="absolute top-1 right-1 bg-purple-600 text-white px-1 py-0.5 rounded text-xs">
                              💾
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-700">
                          <p className="text-xs font-medium truncate">
                            {capture.cultivo || capture.result?.type || 'Desconocido'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(capture.createdAt || capture.timestamp)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {capture.verdict === 'maduro' && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Maduro</span>
                            )}
                            {capture.heatmapEnabled && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">🔥</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto">
                {selectedCapture ? (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Detalles de la Captura</h3>
                    
                    <img 
                      src={selectedCapture.image?.startsWith('data:') ? selectedCapture.image : `data:image/jpeg;base64,${selectedCapture.image}`}
                      alt="Captura seleccionada"
                      className="w-full rounded-lg"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPHN2Zz4K';
                      }}
                    />

                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Cultivo:</strong> {selectedCapture.cultivo || 'No identificado'}
                      </div>
                      <div>
                        <strong>Estado:</strong> {selectedCapture.verdict || 'Sin análisis'}
                      </div>
                      {selectedCapture.confidence && (
                        <div>
                          <strong>Confianza:</strong> {(selectedCapture.confidence * 100).toFixed(1)}%
                        </div>
                      )}
                      {selectedCapture.daysToMaturity && (
                        <div>
                          <strong>Días para madurez:</strong> {selectedCapture.daysToMaturity}
                        </div>
                      )}
                      <div>
                        <strong>Fecha:</strong> {formatDate(selectedCapture.createdAt || selectedCapture.timestamp)}
                      </div>
                      <div>
                        <strong>Detección de plagas:</strong> {selectedCapture.heatmapEnabled ? 'Activada' : 'Desactivada'}
                      </div>
                    </div>

                    {selectedCapture.avgColor && (
                      <div className="space-y-2">
                        <strong className="text-sm">Color promedio:</strong>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{
                              backgroundColor: `rgb(${selectedCapture.avgColor.r}, ${selectedCapture.avgColor.g}, ${selectedCapture.avgColor.b})`
                            }}
                          ></div>
                          <span className="text-xs">
                            RGB({selectedCapture.avgColor.r}, {selectedCapture.avgColor.g}, {selectedCapture.avgColor.b})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <button 
                        onClick={() => deleteCapture(selectedCapture._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        🗑️ Eliminar
                      </button>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedCapture.image?.startsWith('data:') ? selectedCapture.image : `data:image/jpeg;base64,${selectedCapture.image}`;
                          link.download = `captura-${selectedCapture._id || selectedCapture.id}.jpg`;
                          link.click();
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        💾 Descargar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Selecciona una captura para ver los detalles
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaptureGallery;