import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { showNotification } from './NotificationSystem';
import { getCropSteps } from './data/cropSteps';

const CropTracker = ({ isOpen, onClose }) => {
  const [activeCrops, setActiveCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showNewCrop, setShowNewCrop] = useState(false);

  useEffect(() => {
    loadActiveCrops();
  }, []);

  const loadActiveCrops = () => {
    const saved = localStorage.getItem('agrosens_active_crops');
    if (saved) {
      setActiveCrops(JSON.parse(saved));
    }
  };

  const saveActiveCrops = (crops) => {
    localStorage.setItem('agrosens_active_crops', JSON.stringify(crops));
    setActiveCrops(crops);
  };

  const startNewCrop = (cropName) => {
    const newCrop = {
      id: Date.now(),
      name: cropName,
      startDate: new Date().toISOString(),
      currentStep: 0,
      steps: getCropSteps(cropName),
      completedSteps: [],
      notes: []
    };

    const updated = [...activeCrops, newCrop];
    saveActiveCrops(updated);
    setSelectedCrop(newCrop);
    setShowNewCrop(false);
    showNotification('success', 'Cultivo iniciado', `Seguimiento de ${cropName} comenzado`);
  };

  const updateCropStep = (cropId, stepIndex, completed) => {
    const updated = activeCrops.map(crop => {
      if (crop.id === cropId) {
        const newCompletedSteps = completed 
          ? [...crop.completedSteps, stepIndex]
          : crop.completedSteps.filter(s => s !== stepIndex);
        
        return {
          ...crop,
          completedSteps: newCompletedSteps,
          currentStep: Math.max(...newCompletedSteps, -1) + 1
        };
      }
      return crop;
    });

    saveActiveCrops(updated);
    setSelectedCrop(updated.find(c => c.id === cropId));
  };

  const addNote = (cropId, note) => {
    const updated = activeCrops.map(crop => {
      if (crop.id === cropId) {
        return {
          ...crop,
          notes: [...crop.notes, {
            id: Date.now(),
            text: note,
            date: new Date().toISOString()
          }]
        };
      }
      return crop;
    });

    saveActiveCrops(updated);
    setSelectedCrop(updated.find(c => c.id === cropId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            📋 Seguimiento de Cultivos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {!selectedCrop ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Cultivos Activos ({activeCrops.length})
              </h3>
              <button
                onClick={() => setShowNewCrop(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Nuevo Cultivo
              </button>
            </div>

            {activeCrops.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-gray-600 dark:text-gray-300">
                  No tienes cultivos en seguimiento. ¡Inicia uno nuevo!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCrops.map(crop => (
                  <CropCard 
                    key={crop.id} 
                    crop={crop} 
                    onClick={() => setSelectedCrop(crop)} 
                  />
                ))}
              </div>
            )}

            {showNewCrop && (
              <NewCropModal 
                onClose={() => setShowNewCrop(false)}
                onStart={startNewCrop}
              />
            )}
          </div>
        ) : (
          <CropDetail 
            crop={selectedCrop}
            onBack={() => setSelectedCrop(null)}
            onUpdateStep={updateCropStep}
            onAddNote={addNote}
          />
        )}
      </div>
    </div>
  );
};

const CropCard = ({ crop, onClick }) => {
  const progress = (crop.completedSteps.length / crop.steps.length) * 100;
  const daysSinceStart = Math.floor((new Date() - new Date(crop.startDate)) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer border-2 border-transparent hover:border-green-400"
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-800 dark:text-white">{crop.name}</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {daysSinceStart} días
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">Progreso</span>
          <span className="text-gray-600 dark:text-gray-300">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Paso {crop.currentStep + 1} de {crop.steps.length}
      </div>
    </motion.div>
  );
};

const CropDetail = ({ crop, onBack, onUpdateStep, onAddNote }) => {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(crop.id, newNote.trim());
      setNewNote('');
      showNotification('success', 'Nota agregada', 'Nota guardada correctamente');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Volver
        </button>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{crop.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Iniciado el {new Date(crop.startDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
            Pasos del Cultivo
          </h4>
          <div className="space-y-3">
            {crop.steps.map((step, index) => (
              <StepItem
                key={index}
                step={step}
                index={index}
                completed={crop.completedSteps.includes(index)}
                onToggle={(completed) => onUpdateStep(crop.id, index, completed)}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
            Notas ({crop.notes.length})
          </h4>
          
          <div className="mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Agregar nota..."
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
            />
            <button
              onClick={handleAddNote}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Agregar Nota
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {crop.notes.map(note => (
              <div key={note.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-white">{note.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(note.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ step, index, completed, onToggle }) => {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
      completed 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
    }`}>
      <button
        onClick={() => onToggle(!completed)}
        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          completed 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-300 dark:border-gray-500'
        }`}
      >
        {completed && '✓'}
      </button>
      
      <div className="flex-1">
        <h5 className={`font-medium ${
          completed 
            ? 'text-green-800 dark:text-green-200 line-through' 
            : 'text-gray-800 dark:text-white'
        }`}>
          {step.title}
        </h5>
        <p className={`text-sm mt-1 ${
          completed 
            ? 'text-green-600 dark:text-green-300' 
            : 'text-gray-600 dark:text-gray-300'
        }`}>
          {step.description}
        </p>
        {step.duration && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Duración: {step.duration}
          </span>
        )}
      </div>
    </div>
  );
};

const NewCropModal = ({ onClose, onStart }) => {
  const [selectedCrop, setSelectedCrop] = useState('');
  
  const availableCrops = [
    'Lechuga', 'Tomate', 'Zanahoria', 'Papa', 'Cebolla'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Iniciar Nuevo Cultivo
        </h3>
        
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
        >
          <option value="">Selecciona un cultivo</option>
          {availableCrops.map(crop => (
            <option key={crop} value={crop}>{crop}</option>
          ))}
        </select>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => selectedCrop && onStart(selectedCrop)}
            disabled={!selectedCrop}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Iniciar
          </button>
        </div>
      </div>
    </div>
  );
};



export default CropTracker;