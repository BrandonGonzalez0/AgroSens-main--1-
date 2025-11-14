import React, { useState, useRef, useEffect } from 'react';
import cropMaturityAnalyzer from './lib/cropMaturityLibrary';
import pestIdentificationAI from './lib/pestIdentificationLibrary';
import PestAlert from './PestAlert';
import { showNotification } from './NotificationSystem';

const CameraAnalysis = ({ isOpen, onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('maturity'); // 'maturity' or 'pest'
  const [dangerAlert, setDangerAlert] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [pestAlert, setPestAlert] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const heatmapCanvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Reset states when switching modes
  useEffect(() => {
    setAnalysisResult(null);
    setCapturedImage(null);
    setDangerAlert(null);
    setPestAlert(null);
    // Clear heatmap canvas
    if (heatmapCanvasRef.current) {
      const canvas = heatmapCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [analysisMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Cámara no disponible. Asegúrate de que la cámara esté funcionando.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Validate video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Error: La cámara no está transmitiendo correctamente. Intenta recargar la página.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Validate that we actually captured something
      if (imageData.length < 1000) {
        alert('Error al capturar la imagen. Intenta de nuevo.');
        return;
      }
      
      setCapturedImage(imageData);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Error al capturar la foto. Verifica que la cámara funcione correctamente.');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) {
      alert('Primero debes capturar una imagen.');
      return;
    }
    
    setAnalyzing(true);
    setAnalysisResult(null);
    setDangerAlert(null);
    setPestAlert(null);

    try {
      // Create image element for AI analysis
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedImage;
      });

      if (analysisMode === 'maturity') {
        // Crop maturity analysis using comprehensive library
        try {
          const maturityResult = await cropMaturityAnalyzer.analyzeCropMaturity(img);
          const result = {
            ...maturityResult,
            confidence: maturityResult.confidence || 0.5
          };
          setAnalysisResult(result);
        } catch (error) {
          console.error('Maturity analysis error:', error);
          setAnalysisResult({
            valid: false,
            confidence: 0,
            type: 'Error',
            maturity: 'No determinado',
            message: 'Error al analizar la madurez del cultivo. Asegúrate de que la imagen contenga una planta o fruto visible con buena iluminación.',
            characteristics: ['Error en el análisis - Intenta con una imagen más clara'],
            recommendations: ['Mejora la iluminación', 'Acerca la cámara al cultivo', 'Asegúrate de que la planta sea claramente visible']
          });
        }
        
      } else if (analysisMode === 'pest') {
        // Pest identification using comprehensive library
        try {
          const pestAnalysis = await pestIdentificationAI.identifyPest(img);
          
          if (pestAnalysis.detected) {
            setAnalysisResult({
              valid: true,
              type: 'pest_detection',
              message: `${pestAnalysis.pestName} detectado - Severidad: ${pestAnalysis.severity}`,
              pestData: pestAnalysis
            });
            setDangerAlert(`⚠️ ${pestAnalysis.pestName} detectado (${(pestAnalysis.confidence * 100).toFixed(1)}% confianza)`);
            setPestAlert(pestAnalysis);
            drawPestHeatmap(pestAnalysis.locations);
          } else {
            setAnalysisResult({
              valid: true,
              type: 'pest_detection',
              message: '✅ No se detectaron plagas específicas en la imagen',
              pestData: null
            });
          }
        } catch (error) {
          console.error('Pest analysis error:', error);
          setAnalysisResult({
            valid: false,
            type: 'pest_detection',
            message: 'Error al analizar plagas. Asegúrate de que la imagen muestre claramente las hojas o partes de la planta.',
            pestData: null
          });
        }
      }

      // Auto-save analysis result
      if (analysisResult && analysisResult.valid) {
        await saveAnalysis({
          image: capturedImage,
          result: analysisResult,
          timestamp: new Date().toISOString(),
          analysisMode
        });
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        valid: false,
        message: 'Error al analizar la imagen con IA'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const drawPestHeatmap = (locations) => {
    if (!heatmapCanvasRef.current || !videoRef.current) return;
    
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pest detection spots with severity-based colors
    locations.forEach(location => {
      const x = location.x * canvas.width;
      const y = location.y * canvas.height;
      const baseRadius = location.size === 'large' ? 35 : location.size === 'medium' ? 25 : 15;
      const radius = baseRadius + (location.intensity * 15);
      
      // Color based on pest type and intensity
      let color = [255, 0, 0]; // Default red
      if (location.type === 'early_signs') color = [255, 255, 0]; // Yellow
      if (location.type === 'severe_infestation') color = [139, 0, 0]; // Dark red
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${location.intensity * 0.9})`);
      gradient.addColorStop(0.3, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${location.intensity * 0.6})`);
      gradient.addColorStop(0.7, `rgba(255, 255, 0, ${location.intensity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add pulsing effect for severe cases
      if (location.type === 'severe_infestation') {
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.8 * Math.sin(Date.now() / 200) + 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  const saveAnalysis = async (data) => {
    try {
      // Save to localStorage instead of backend when backend is not available
      const analysisData = {
        id: Date.now().toString(),
        deviceId: 'camera-analysis',
        cultivo: data.result?.type || data.result?.pestData?.pestName || 'desconocido',
        verdict: data.result?.maturity || (data.result?.pestData?.detected ? 'plaga_detectada' : 'analizado'),
        confidence: data.result?.confidence || data.result?.pestData?.confidence || 0,
        daysToMaturity: data.result?.daysToMaturity || null,
        image: data.image.replace(/^data:image\/[a-z]+;base64,/, ''),
        analysisMode: data.analysisMode,
        pestData: data.result?.pestData || null,
        heatmapEnabled: data.analysisMode === 'pest' && data.result?.pestData?.detected,
        timestamp: data.timestamp,
        size: data.result?.size || null
      };
      
      // Try to save to backend first, fallback to localStorage
      try {
        const response = await fetch('/api/ia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': localStorage.getItem('csrfToken') || ''
          },
          body: JSON.stringify(analysisData)
        });
        
        if (response.ok) {
          console.log('Analysis saved to backend successfully');
          showNotification('success', 'Análisis guardado', 'Resultado guardado correctamente');
        } else {
          throw new Error('Backend not available');
        }
      } catch (backendError) {
        // Save to localStorage as fallback
        const existingAnalyses = JSON.parse(localStorage.getItem('agrosens_analyses') || '[]');
        existingAnalyses.unshift(analysisData);
        // Keep only last 50 analyses
        if (existingAnalyses.length > 50) {
          existingAnalyses.splice(50);
        }
        localStorage.setItem('agrosens_analyses', JSON.stringify(existingAnalyses));
        console.log('Analysis saved to localStorage (backend unavailable)');
        showNotification('info', 'Análisis guardado localmente', 'Servidor no disponible - guardado en dispositivo');
      }
      
      // Trigger dashboard refresh if it's open
      window.dispatchEvent(new CustomEvent('analysisUpdated'));
      
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Even if saving fails, the analysis still worked
    }
  };
  
  const saveToGallery = async (type) => {
    if (!capturedImage || !analysisResult) return;
    
    try {
      let category = 'general';
      let cultivo = 'desconocido';
      let verdict = 'analizado';
      
      if (type === 'maturity') {
        cultivo = analysisResult.type || 'cultivo';
        verdict = analysisResult.maturity || 'analizado';
        if (analysisResult.maturity === 'maduro') {
          category = 'maduras';
        } else if (analysisResult.maturity === 'verde' || analysisResult.maturity === 'inmaduro') {
          category = 'verdes';
        } else {
          category = 'desarrollo';
        }
      } else if (type === 'pest') {
        cultivo = analysisResult.pestData?.pestName || 'planta';
        verdict = analysisResult.pestData?.detected ? 'plaga_detectada' : 'sana';
        if (analysisResult.pestData?.detected) {
          category = 'plagas';
        } else {
          category = 'sanas';
        }
      }
      
      const galleryItem = {
        _id: Date.now().toString(),
        id: Date.now().toString(),
        image: capturedImage.replace(/^data:image\/[a-z]+;base64,/, ''),
        category: category,
        type: type,
        result: analysisResult,
        cultivo: cultivo,
        verdict: verdict,
        confidence: analysisResult.confidence || analysisResult.pestData?.confidence || 0,
        heatmapEnabled: type === 'pest' && analysisResult.pestData?.detected,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        saved: true
      };
      
      // Save to localStorage gallery
      const existingGallery = JSON.parse(localStorage.getItem('agrosens_gallery') || '[]');
      existingGallery.unshift(galleryItem);
      localStorage.setItem('agrosens_gallery', JSON.stringify(existingGallery));
      
      alert(`✅ Imagen guardada en la galería: ${category.toUpperCase()}`);
      
      // Trigger gallery refresh
      window.dispatchEvent(new CustomEvent('analysisUpdated'));
      
    } catch (error) {
      console.error('Error saving to gallery:', error);
      alert('❌ Error al guardar en la galería');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 p-2 md:p-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl" style={{ maxHeight: '95vh', overflow: 'auto', padding: window.innerWidth < 768 ? '12px' : '16px' }}>
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">🔍 Análisis IA</h3>
          <button 
            onClick={onClose}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex flex-col md:flex-row gap-2 mb-3 md:mb-4">
          <button
            onClick={() => {
              setAnalysisMode('maturity');
              setTimeout(() => startCamera(), 100);
            }}
            className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-colors text-sm md:text-base ${
              analysisMode === 'maturity'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🌱 <span className="hidden sm:inline">Análisis de</span> Madurez
          </button>
          <button
            onClick={() => {
              setAnalysisMode('pest');
              setTimeout(() => startCamera(), 100);
            }}
            className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-colors text-sm md:text-base ${
              analysisMode === 'pest'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🐛 <span className="hidden sm:inline">Detección de</span> Plagas
          </button>
        </div>

        {/* Maturity Analysis Interface */}
        {analysisMode === 'maturity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-3">
                <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">🌱 Modo: Análisis de Madurez</h4>
                <p className="text-xs text-green-700 dark:text-green-300">Detecta el tipo de cultivo y su estado de madurez</p>
              </div>
              
              <div className="relative">
                <video ref={videoRef} className="w-full rounded" playsInline muted />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              {capturedImage && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">Imagen Capturada:</h4>
                  <img src={capturedImage} alt="Captura" className="w-full rounded mt-1 max-h-48 object-cover" />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={capturePhoto} className="px-3 py-1 bg-blue-600 text-white rounded">
                  📸 Capturar
                </button>
                <button 
                  onClick={analyzeImage}
                  disabled={!capturedImage || analyzing || modelLoading}
                  className={`px-3 py-1 rounded ${
                    capturedImage && !analyzing && !modelLoading
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {modelLoading ? 'Cargando IA...' : analyzing ? 'Analizando...' : '🌱 Analizar Madurez'}
                </button>
                {analysisResult && (
                  <button 
                    onClick={() => saveToGallery('maturity')}
                    className="px-3 py-1 bg-purple-600 text-white rounded"
                  >
                    💾 Guardar
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resultados del Análisis</h4>
              
              {(analyzing || modelLoading) && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm">
                    {modelLoading ? 'Cargando modelo de IA...' : 'Analizando madurez del cultivo...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {modelLoading ? 'Descargando TensorFlow.js y MobileNet' : 'Detectando vegetación y analizando madurez'}
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <h5 className="font-semibold mb-2">Resultado Análisis de Madurez:</h5>
                  {analysisResult.valid ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Cultivo:</strong> {analysisResult.type}</p>
                      <p><strong>Estado:</strong> {analysisResult.maturity}</p>
                      <p><strong>Confianza:</strong> {(analysisResult.confidence * 100).toFixed(1)}%</p>
                      {analysisResult.size && (
                        <p><strong>Tamaño estimado:</strong> {analysisResult.size.estimatedDiameter} ({analysisResult.size.category})</p>
                      )}
                      {analysisResult.daysToMaturity !== undefined && (
                        <p><strong>Días para madurez:</strong> {analysisResult.daysToMaturity}</p>
                      )}
                      <p><strong>Análisis:</strong> {analysisResult.message}</p>
                      {analysisResult.characteristics && (
                        <div className="mt-2">
                          <p><strong>Características:</strong></p>
                          <ul className="text-xs list-disc list-inside ml-2">
                            {analysisResult.characteristics.map((char, i) => (
                              <li key={i}>{char}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className={`mt-2 p-2 rounded text-xs ${
                        analysisResult.confidence > 0.7 
                          ? 'bg-green-100 text-green-800' 
                          : analysisResult.confidence > 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div>Confianza: {analysisResult.confidence > 0.7 ? 'Alta' : analysisResult.confidence > 0.5 ? 'Media' : 'Baja'}</div>
                        {analysisResult.size && analysisResult.size.confidence > 0.3 && (
                          <div>Medición de tamaño: {(analysisResult.size.confidence * 100).toFixed(0)}% precisa</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-600 mb-2">{analysisResult.message}</p>
                      <div className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 p-2 rounded">
                        💡 <strong>Consejos para mejorar el análisis:</strong><br/>
                        • Asegúrate de que haya suficiente luz natural<br/>
                        • Enfoca directamente la planta o fruto<br/>
                        • Evita fondos completamente negros o blancos<br/>
                        • Mantén la cámara estable al capturar
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pest Detection Interface */}
        {analysisMode === 'pest' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-3">
                <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">🐛 Modo: Detección de Plagas</h4>
                <p className="text-xs text-red-700 dark:text-red-300">Identifica plagas y genera mapa de calor con ubicaciones</p>
              </div>
              
              <div className="relative">
                <video ref={videoRef} className="w-full rounded" playsInline muted />
                <canvas 
                  ref={heatmapCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              {capturedImage && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">Imagen Capturada:</h4>
                  <img src={capturedImage} alt="Captura" className="w-full rounded mt-1 max-h-48 object-cover" />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={capturePhoto} className="px-3 py-1 bg-blue-600 text-white rounded">
                  📸 Capturar
                </button>
                <button 
                  onClick={analyzeImage}
                  disabled={!capturedImage || analyzing}
                  className={`px-3 py-1 rounded ${
                    capturedImage && !analyzing
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {analyzing ? 'Detectando...' : '🐛 Detectar Plagas'}
                </button>
                {analysisResult && (
                  <button 
                    onClick={() => saveToGallery('pest')}
                    className="px-3 py-1 bg-purple-600 text-white rounded"
                  >
                    💾 Guardar
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Detección de Plagas</h4>
              
              {analyzing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-sm">Detectando plagas...</p>
                  <p className="text-xs text-gray-500 mt-1">Analizando patrones y generando mapa de calor</p>
                </div>
              )}

              {dangerAlert && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {dangerAlert}
                </div>
              )}

              {analysisResult && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <h5 className="font-semibold mb-2">Resultado Detección de Plagas:</h5>
                  {analysisResult.valid ? (
                    <div className="space-y-2 text-sm">
                      {analysisResult.pestData ? (
                        <>
                          <p><strong>Plaga:</strong> {analysisResult.pestData.pestName}</p>
                          <p><strong>Nombre científico:</strong> <em>{analysisResult.pestData.scientificName}</em></p>
                          <p><strong>Severidad:</strong> {analysisResult.pestData.severity}</p>
                          <p><strong>Confianza:</strong> {(analysisResult.pestData.confidence * 100).toFixed(1)}%</p>
                          <p><strong>Áreas afectadas:</strong> {analysisResult.pestData.locations?.length || 0}</p>
                          {analysisResult.pestData.symptoms && (
                            <div className="mt-2">
                              <p><strong>Síntomas:</strong></p>
                              <ul className="text-xs list-disc list-inside ml-2">
                                {analysisResult.pestData.symptoms.slice(0, 3).map((symptom, i) => (
                                  <li key={i}>{symptom}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : null}
                      <p><strong>Resultado:</strong> {analysisResult.message}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-600 mb-2">{analysisResult.message}</p>
                      <div className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 p-2 rounded">
                        💡 <strong>Consejos para detección de plagas:</strong><br/>
                        • Enfoca las hojas donde suelen aparecer plagas<br/>
                        • Busca áreas con daños visibles o decoloración<br/>
                        • Asegúrate de que la imagen tenga buena iluminación<br/>
                        • Evita imágenes borrosas o muy oscuras
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Pest Alert Modal */}
        {pestAlert && (
          <PestAlert
            pestData={pestAlert}
            onClose={() => setPestAlert(null)}
            onTreatmentAction={(action) => {
              console.log('Treatment action:', action);
              setPestAlert(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CameraAnalysis;