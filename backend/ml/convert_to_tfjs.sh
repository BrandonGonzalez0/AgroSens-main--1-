#!/usr/bin/env bash
# Convierte un SavedModel (TensorFlow) a TF.js (web_model)
# Uso: ./convert_to_tfjs.sh /ruta/al/saved_model /ruta/de/salida/web_model

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <saved_model_dir> <out_dir>"
  exit 1
fi
SAVED=$1
OUT=$2
mkdir -p "$OUT"
# Requiere tensorflowjs instalado (pip install tensorflowjs)
tensorflowjs_converter --input_format=tf_saved_model "$SAVED" "$OUT"
echo "Modelo convertido en $OUT - sube esos archivos (model.json + shards) a un host público con CORS habilitado"
