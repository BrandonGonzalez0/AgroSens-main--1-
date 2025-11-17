"""
Entrenamiento de prototipo con PlantVillage (clasificación)

Uso (recomendado con virtualenv):
  python -m venv venv
  # Windows PowerShell
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt

Ejecutar (intenta primero con TFDS, si no disponible indica descargar dataset manualmente):
  python train_plantvillage.py --output_dir=./models/madurez_savedmodel --epochs=6 --batch_size=32

Si no puedes usar TFDS, prepara un directorio con estructura:
  data/train/<class>/*.jpg
  data/val/<class>/*.jpg

Este script hace transfer learning con MobileNetV2 y guarda un SavedModel listo para convertir a TF.js.
"""

import os
import argparse
import tensorflow as tf
import numpy as np
import logging

# Set random seeds for reproducibility
tf.random.set_seed(42)
np.random.seed(42)

try:
    import tensorflow_datasets as tfds
    TFDS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"tensorflow_datasets not available: {e}")
    TFDS_AVAILABLE = False


def build_model(num_classes, img_size=224):
    # TensorFlow 2.15: usar 'imagenet' en weights
    base = tf.keras.applications.MobileNetV2(
        input_shape=(img_size, img_size, 3), 
        include_top=False, 
        weights='imagenet'
    )
    base.trainable = False
    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    model = tf.keras.Model(inputs, outputs)
    return model


def prepare_datasets_from_dir(data_dir, img_size=224, batch_size=32):
    # Resolve paths to prevent path traversal
    data_dir = os.path.abspath(data_dir)
    train_dir = os.path.join(data_dir, 'train')
    val_dir = os.path.join(data_dir, 'val')
    
    if not os.path.isdir(train_dir) or not os.path.isdir(val_dir):
        raise ValueError('Expected directory structure: data/train and data/val with class subdirectories')
    
    try:
        train_ds = tf.keras.preprocessing.image_dataset_from_directory(
            train_dir, image_size=(img_size, img_size), batch_size=batch_size
        )
        val_ds = tf.keras.preprocessing.image_dataset_from_directory(
            val_dir, image_size=(img_size, img_size), batch_size=batch_size
        )
        class_names = train_ds.class_names
        AUTOTUNE = tf.data.AUTOTUNE
        train_ds = train_ds.prefetch(AUTOTUNE)
        val_ds = val_ds.prefetch(AUTOTUNE)
        return train_ds, val_ds, class_names
    except Exception as e:
        logging.error(f"Error loading datasets from directory: {e}")
        raise


def prepare_datasets_from_tfds(name='plant_village', img_size=224, batch_size=32, split_train='train[:85%]', split_val='train[85%:]'):
    if not TFDS_AVAILABLE:
        raise RuntimeError('tensorflow_datasets no está disponible en este entorno. Instala tensorflow-datasets o usa el modo --data_dir con carpetas locales.')
    print('Cargando dataset %s desde TFDS...' % name)
    ds_train, ds_info = tfds.load(name, split=split_train, with_info=True, as_supervised=True)
    ds_val = tfds.load(name, split=split_val, as_supervised=True)

    def _preprocess(image, label):
        image = tf.image.convert_image_dtype(image, tf.float32)
        image = tf.image.resize(image, [img_size, img_size])
        return image, label

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = ds_train.map(_preprocess).shuffle(1024).batch(batch_size).prefetch(AUTOTUNE)
    val_ds = ds_val.map(_preprocess).batch(batch_size).prefetch(AUTOTUNE)
    class_names = ds_info.features['label'].names if 'label' in ds_info.features else None
    return train_ds, val_ds, class_names


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', type=str, default=None, help='Ruta a data/ con subcarpetas train/val (opcional).')
    parser.add_argument('--output_dir', type=str, default='./models/madurez_savedmodel', help='Dónde guardar el SavedModel')
    parser.add_argument('--img_size', type=int, default=224)
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--epochs', type=int, default=6)
    parser.add_argument('--learning_rate', type=float, default=1e-3)
    parser.add_argument('--tfds_name', type=str, default='plant_village', help='Nombre del dataset en TFDS si disponible. Por defecto plant_village')
    args = parser.parse_args()

    if args.data_dir:
        print('Preparando datasets desde directorio local:', args.data_dir)
        train_ds, val_ds, class_names = prepare_datasets_from_dir(args.data_dir, img_size=args.img_size, batch_size=args.batch_size)
    else:
        if TFDS_AVAILABLE:
            try:
                train_ds, val_ds, class_names = prepare_datasets_from_tfds(
                    name=args.tfds_name, img_size=args.img_size, batch_size=args.batch_size
                )
            except Exception as e:
                logging.error(f'Error loading TFDS: {e}')
                print('--data_dir required if TFDS is not available or dataset does not exist')
                return
        else:
            print('tensorflow_datasets no disponible. Descarga PlantVillage manualmente y usa --data_dir')
            return

    if not class_names:
        print('No se pudieron determinar nombres de clase automáticamente; continuar con entrenamiento pero considera pasar etiquetas manualmente.')
    else:
        print('Clases detectadas:', class_names)

    num_classes = len(class_names) if class_names else 2
    model = build_model(num_classes=num_classes, img_size=args.img_size)
    # Usar categorical_crossentropy si num_classes > 2, sino binary_crossentropy
    loss_fn = 'binary_crossentropy' if num_classes == 2 else 'sparse_categorical_crossentropy'
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=args.learning_rate), loss=loss_fn, metrics=['accuracy'])

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(os.path.join(args.output_dir, 'ckpt_{epoch}'), save_weights_only=False, save_best_only=False),
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True)
    ]

    print('Starting training...')
    # Resolve output directory to prevent path traversal
    output_dir = os.path.abspath(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        history = model.fit(
            train_ds, 
            validation_data=val_ds, 
            epochs=args.epochs, 
            callbacks=callbacks
        )
    except Exception as e:
        logging.error(f"Training failed: {e}")
        raise

    print('Guardando modelo en:', args.output_dir)
    model.save(args.output_dir, include_optimizer=False)
    print('Entrenamiento finalizado. Modelo guardado como SavedModel.')


if __name__ == '__main__':
    main()
