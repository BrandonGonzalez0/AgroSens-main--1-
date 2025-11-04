import { useState, useEffect } from 'react';

const STORAGE_KEY = 'agrosens_active_crops';

export const useCropStorage = () => {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedCrops = JSON.parse(saved);
        setCrops(parsedCrops);
      }
    } catch (error) {
      console.error('Error loading crops:', error);
      setCrops([]);
    }
  };

  const saveCrops = (newCrops) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCrops));
      setCrops(newCrops);
    } catch (error) {
      console.error('Error saving crops:', error);
    }
  };

  const addCrop = (crop) => {
    const newCrops = [...crops, crop];
    saveCrops(newCrops);
    return crop;
  };

  const updateCrop = (cropId, updates) => {
    const newCrops = crops.map(crop => 
      crop.id === cropId ? { ...crop, ...updates } : crop
    );
    saveCrops(newCrops);
    return newCrops.find(c => c.id === cropId);
  };

  const deleteCrop = (cropId) => {
    const newCrops = crops.filter(crop => crop.id !== cropId);
    saveCrops(newCrops);
  };

  const getCrop = (cropId) => {
    return crops.find(crop => crop.id === cropId);
  };

  return {
    crops,
    addCrop,
    updateCrop,
    deleteCrop,
    getCrop,
    loadCrops
  };
};