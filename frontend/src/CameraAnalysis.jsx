import React, { useState, useRef, useEffect } from 'react';

const CameraAnalysis = ({ isOpen, onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [dangerAlert, setDangerAlert] = useState(null);
  
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
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
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setAnalyzing(true);
    setAnalysisResult(null);
    setDangerAlert(null);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis results
      const mockResults = [
        { type: 'tomate', maturity: 'maduro', confidence: 0.85, daysToMaturity: 0 },
        { type: 'tomate', maturity: 'verde', confidence: 0.78, daysToMaturity: 7 },
        { type: 'invalid', maturity: 'no_vegetal', confidence: 0.92, daysToMaturity: null }
      ];
      
      const result = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      if (result.type === 'invalid') {
        setAnalysisResult({
          valid: false,
          message: 'La imagen no contiene una fruta o verdura válida'
        });
      } else {
        setAnalysisResult({
          valid: true,
          type: result.type,
          maturity: result.maturity,
          confidence: result.confidence,
          daysToMaturity: result.daysToMaturity,
          message: result.maturity === 'maduro' 
            ? 'La fruta/verdura está lista para cosechar' 
            : `Faltan aproximadamente ${result.daysToMaturity} días para la madurez`
        });
      }

      // Simulate pest detection if heatmap enabled
      if (heatmapEnabled) {
        const hasPests = Math.random() > 0.7;
        if (hasPests) {
          setDangerAlert('⚠️ Posible presencia de plagas detectada en la imagen');
          drawMockHeatmap();
        }
      }

      // Save to database
      await saveAnalysis({
        image: capturedImage,
        result: result,
        timestamp: new Date().toISOString(),
        heatmapEnabled
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        valid: false,
        message: 'Error al analizar la imagen'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const drawMockHeatmap = () => {
    if (!heatmapCanvasRef.current || !videoRef.current) return;
    
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw mock heat spots
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0.2)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const saveAnalysis = async (data) => {
    try {
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('csrfToken') || ''
        },
        body: JSON.stringify({
          deviceId: 'camera-analysis',
          cultivo: data.result.type,
          verdict: data.result.maturity,
          confidence: data.result.confidence,
          daysToMaturity: data.result.daysToMaturity,
          image: data.image.replace(/^data:image\/[a-z]+;base64,/, ''),
          heatmapEnabled: data.heatmapEnabled,
          timestamp: data.timestamp
        })
      });
      
      if (response.ok) {
        console.log('Analysis saved successfully');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-[90%] max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">🔍 Análisis con Cámara (IA)</h3>
          <button 
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded"
          >
            Cerrar
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <video 
                ref={videoRef} 
                className="w-full rounded" 
                playsInline 
                muted 
              />
              {heatmapEnabled && (
                <canvas 
                  ref={heatmapCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            
            {capturedImage && (
              <div className="mt-2">
                <h4 className="font-semibold text-sm">Imagen Capturada:</h4>
                <img 
                  src={capturedImage} 
                  alt="Captura" 
                  className="w-full rounded mt-1 max-h-48 object-cover" 
                />
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button 
                onClick={capturePhoto}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                📸 Capturar
              </button>
              <button 
                onClick={analyzeImage}
                disabled={!capturedImage || analyzing}
                className={`px-3 py-1 rounded ${
                  capturedImage && !analyzing 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {analyzing ? 'Analizando...' : '🤖 Analizar'}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Configuración y Resultados</h4>
            
            <label className="flex items-center gap-2 text-sm mb-4">
              <input 
                type="checkbox" 
                checked={heatmapEnabled} 
                onChange={(e) => setHeatmapEnabled(e.target.checked)} 
              />
              <span>Activar detección de plagas (mapa de calor)</span>
            </label>

            {dangerAlert && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {dangerAlert}
              </div>
            )}

            {analyzing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm">Analizando imagen con IA...</p>
              </div>
            )}

            {analysisResult && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <h5 className="font-semibold mb-2">Resultado del Análisis:</h5>
                {analysisResult.valid ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Tipo:</strong> {analysisResult.type}</p>
                    <p><strong>Estado:</strong> {analysisResult.maturity}</p>
                    <p><strong>Confianza:</strong> {(analysisResult.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Mensaje:</strong> {analysisResult.message}</p>
                  </div>
                ) : (
                  <p className="text-red-600">{analysisResult.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraAnalysis;