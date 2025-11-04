// Utilidades para mapas de calor
export function float32ToBase64(float32Array) {
  if (!float32Array || !float32Array.length) return '';
  
  try {
    // Convertir Float32Array a Uint8Array
    const uint8Array = new Uint8Array(float32Array.length * 4);
    const dataView = new DataView(uint8Array.buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      dataView.setFloat32(i * 4, float32Array[i], true);
    }
    
    // Convertir a base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    return btoa(binary);
  } catch (error) {
    console.error('Error converting float32 to base64:', error);
    return '';
  }
}

export function base64ToFloat32(base64String) {
  if (!base64String) return new Float32Array(0);
  
  try {
    const binary = atob(base64String);
    const uint8Array = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    
    const dataView = new DataView(uint8Array.buffer);
    const float32Array = new Float32Array(uint8Array.length / 4);
    
    for (let i = 0; i < float32Array.length; i++) {
      float32Array[i] = dataView.getFloat32(i * 4, true);
    }
    
    return float32Array;
  } catch (error) {
    console.error('Error converting base64 to float32:', error);
    return new Float32Array(0);
  }
}