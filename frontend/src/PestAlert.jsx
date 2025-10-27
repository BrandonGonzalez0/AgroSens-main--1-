import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PestAlert = ({ pestData, onClose, onTreatmentAction }) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (pestData?.detected && pestData.severity === 'severe') {
      // Play alert sound for severe infestations
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (error) {
        console.log('Audio not supported');
      }
    }
  }, [pestData]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return 'bg-red-500';
      case 'moderate': return 'bg-orange-500';
      case 'mild': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'severe': return '🚨';
      case 'moderate': return '⚠️';
      case 'mild': return '👀';
      default: return 'ℹ️';
    }
  };

  if (!pestData?.detected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
      >
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <div className={`${getSeverityColor(pestData.severity)} text-white p-4 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-pulse">
                  {getSeverityIcon(pestData.severity)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Alerta de Plagas</h2>
                  <p className="text-sm opacity-90">
                    Confianza: {(pestData.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                📋 Recomendaciones de Tratamiento
              </h3>
              <ul className="space-y-2">
                {pestData.recommendations?.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span className="text-blue-700 dark:text-blue-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {pestData.locations?.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  📍 Áreas Afectadas: {pestData.locations.length}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Revisa el mapa de calor para ubicación exacta de las plagas detectadas.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => onTreatmentAction?.('immediate')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white ${getSeverityColor(pestData.severity)} hover:opacity-90`}
              >
                🚀 Iniciar Tratamiento
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700"
              >
                📅 Entendido
              </button>
            </div>

            {pestData.severity === 'severe' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-center">
                <p className="text-red-800 dark:text-red-200 font-semibold text-sm">
                  🆘 Infestación severa detectada - Se recomienda acción inmediata
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PestAlert;