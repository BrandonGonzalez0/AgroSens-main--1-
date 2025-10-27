import React from 'react';
import { motion } from 'framer-motion';

const Navigation = ({ 
  currentMode, 
  onModeChange, 
  darkMode, 
  onToggleDarkMode, 
  isOnline,
  onInstallClick,
  onShowCamera,
  onShowDashboard,
  onShowGallery 
}) => {
  const navItems = [
    {
      id: 'definido',
      icon: '🌱',
      title: 'Cultivo Definido',
      description: 'Validar cultivo específico',
      color: 'green'
    },
    {
      id: 'sugerido',
      icon: '🤝',
      title: 'Sugerencias IA',
      description: 'Recomendaciones inteligentes',
      color: 'blue'
    },
    {
      id: 'camera',
      icon: '🔍',
      title: 'Análisis Visual',
      description: 'Cámara + IA',
      color: 'purple'
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard',
      description: 'Métricas y estadísticas',
      color: 'indigo'
    }
  ];

  const handleNavClick = (itemId) => {
    switch (itemId) {
      case 'definido':
      case 'sugerido':
        onModeChange(itemId);
        break;
      case 'camera':
        onShowCamera();
        break;
      case 'dashboard':
        onShowDashboard();
        break;
      default:
        break;
    }
  };

  const getColorClasses = (color, isActive = false) => {
    const colors = {
      green: isActive 
        ? 'bg-green-600 text-white border-green-600' 
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      blue: isActive 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      purple: isActive 
        ? 'bg-purple-600 text-white border-purple-600' 
        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      indigo: isActive 
        ? 'bg-indigo-600 text-white border-indigo-600' 
        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">AgroSens</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema Inteligente</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                  getColorClasses(item.color, currentMode === item.id)
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} pulse`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Gallery Quick Access */}
            <button
              onClick={onShowGallery}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Ver galería"
            >
              📸
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Cambiar tema"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Install Button */}
            <button
              onClick={onInstallClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors"
            >
              📱 Instalar
            </button>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 grid grid-cols-2 gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                getColorClasses(item.color, currentMode === item.id)
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation;