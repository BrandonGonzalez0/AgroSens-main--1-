# IA Training & Deployment Guide for AgroSens

Este documento resume cómo usar datasets públicos, entrenar modelos (clasificación y detección), exportarlos y desplegarlos para integrarlos en AgroSens.

Resumen de flujos

1) Clasificación (TF/Keras -> TF.js)
   - Uso: reconocer madurez o estado (p.ej. maduro/no maduro, sano/enfermo).
   - Modelo recomendado: MobileNetV2/EfficientNetB0 (transfer learning).
   - Salida: modelo TF SavedModel convertido a TF.js (model.json + shards) para inferencia cliente.

2) Detección (YOLOv8)
   - Uso: localizar frutas/plagas dentro de la imagen (bounding boxes).
   - Modelo recomendado: YOLOv8n/YOLOv8s para prototipo.
   - Salida: .pt (PyTorch) para servidor o export ONNX para producción.

Datasets públicos sugeridos
- PlantVillage: enfermedad/plagas en hojas. Buscar mirror en Kaggle o PlantVillage datasets.
- Fruit Ripeness datasets: buscar en Kaggle por "fruit ripeness dataset".
- Roboflow public datasets: https://public.roboflow.com

A. Entrenamiento - Clasificación (TensorFlow/Keras)

Requisitos:
- Python 3.8+
- tensorflow
- tensorflowjs (para convertir a TF.js)

Pasos básicos (ejemplo resumido):

```bash
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install tensorflow tensorflow-datasets tensorflow-hub tensorflowjs
```

Ejemplo de script (simplificado):
```python
# train_classification.py
import tensorflow as tf
from tensorflow.keras import layers
import os

IMG_SIZE = 224
BATCH = 16

train_ds = tf.keras.preprocessing.image_dataset_from_directory('data/train', image_size=(IMG_SIZE,IMG_SIZE), batch_size=BATCH)
val_ds = tf.keras.preprocessing.image_dataset_from_directory('data/val', image_size=(IMG_SIZE,IMG_SIZE), batch_size=BATCH)
num_classes = len(train_ds.class_names)

base = tf.keras.applications.MobileNetV2(input_shape=(IMG_SIZE,IMG_SIZE,3), include_top=False, weights='imagenet')
base.trainable = False
model = tf.keras.Sequential([
  base,
  layers.GlobalAveragePooling2D(),
  layers.Dropout(0.3),
  layers.Dense(128, activation='relu'),
  layers.Dense(num_classes, activation='softmax')
])
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=8)
model.save('models/madurez_savedmodel')
```

Convertir a TF.js:
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=tf_saved_model models/madurez_savedmodel web_model/
# subir el contenido de web_model/ a un bucket público o GitHub Pages (asegurar CORS)
```

B. Entrenamiento - Detección (YOLOv8)

Requisitos:
- Python 3.8+
- pip install ultralytics

Ejemplo básico usando Ultralytics (YOLOv8):
```bash
pip install ultralytics
# dataset en formato YOLO (images + labels txt)
# dataset.yaml apuntando a train/val dirs
yolo task=detect mode=train model=yolov8n.pt data=dataset.yaml epochs=30 imgsz=640
# luego exportar
yolo export model=runs/detect/train/weights/best.pt format=onnx
```

C. Hospedaje y CORS
- Si usas TF.js en cliente, sube `model.json` + shards a un bucket S3/GCS público o GitHub Pages.
- Asegura `Access-Control-Allow-Origin: *` para CORS en el host donde subas el modelo.

D. Integración en AgroSens
- Cliente: en la UI de cámara pega la URL pública a `model.json` y opcionalmente las etiquetas. El worker cargará y hará inferencias.
- Servidor: para modelos YOLO o modelos pesados, crea un microservicio (FastAPI/Flask) que exponga `/api/ia/predict` y use el modelo para inferir imágenes enviadas por POST.

E. Pruebas y validación
- Usar un conjunto de test separado y medir precision/recall o accuracy según el problema.
- Ajustar umbrales de alerta en el frontend (ej. probabilidad mínima para marcar plaga).


Si quieres, preparo scripts específicos (notebook) para descargar PlantVillage o Roboflow y generar un dataset listo para entrenar. También puedo crear un ejemplo end-to-end con un modelo TF.js público de prueba.
