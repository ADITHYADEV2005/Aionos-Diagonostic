# ============================================================
# Aionos Diagnostic - Liver AI 
# ============================================================

import os
import random
import numpy as np
import pandas as pd
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# ============================================================
# CONFIGURATION
# ============================================================

SEED = 42
IMG_SIZE = 224
BATCH_SIZE = 8   # FIX: safer for small medical datasets
AUTOTUNE = tf.data.AUTOTUNE

DATASET_DIR = "dataset/liver"

CLASS_NAMES = ["Benign", "Malignant", "Normal"]
NUM_CLASSES = len(CLASS_NAMES)

# ============================================================
# REPRODUCIBILITY
# ============================================================

np.random.seed(SEED)
random.seed(SEED)
tf.random.set_seed(SEED)

# ============================================================
# GPU
# ============================================================

gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for g in gpus:
        tf.config.experimental.set_memory_growth(g, True)

tf.config.optimizer.set_jit(False)

# ============================================================
# LOAD DATA
# ============================================================

paths, labels = [], []
label_map = {c: i for i, c in enumerate(CLASS_NAMES)}

for cls in CLASS_NAMES:
    folder = os.path.join(DATASET_DIR, cls, "images")

    if not os.path.exists(folder):
        continue

    for f in os.listdir(folder):
        if f.lower().endswith((".jpg", ".png", ".jpeg")):
            paths.append(os.path.join(folder, f))
            labels.append(label_map[cls])

df = pd.DataFrame({"path": paths, "label": labels})

# ============================================================
# SPLIT
# ============================================================

train_df, val_df = train_test_split(
    df,
    test_size=0.2,
    stratify=df["label"],
    random_state=SEED
)

# ============================================================
# CLASS WEIGHTS
# ============================================================

class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_df["label"]),
    y=train_df["label"]
)

class_weights = {i: w for i, w in enumerate(class_weights)}

# ============================================================
# IMAGE PIPELINE (FIXED NORMALIZATION)
# ============================================================

def load_image(path, label):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))

    # FIX: EfficientNet correct preprocessing
    img = tf.keras.applications.efficientnet.preprocess_input(img)

    label = tf.one_hot(label, NUM_CLASSES)
    return img, label

# ============================================================
# AUGMENTATION (SAFE)
# ============================================================

aug = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.02),
    layers.RandomZoom(0.05),
])

# ============================================================
# DATASET PIPELINE (FIXED ORDER)
# ============================================================

train_ds = tf.data.Dataset.from_tensor_slices(
    (train_df["path"].values, train_df["label"].values)
)

val_ds = tf.data.Dataset.from_tensor_slices(
    (val_df["path"].values, val_df["label"].values)
)

train_ds = train_ds.shuffle(len(train_df), seed=SEED)

train_ds = train_ds.map(load_image, num_parallel_calls=AUTOTUNE)
train_ds = train_ds.cache()  # Cache preprocessed images in memory to speed up training
train_ds = train_ds.map(
    lambda x, y: (aug(x, training=True), y),
    num_parallel_calls=AUTOTUNE
)

train_ds = train_ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)
val_ds = val_ds.map(load_image, num_parallel_calls=AUTOTUNE).cache().batch(BATCH_SIZE).prefetch(AUTOTUNE)

# ============================================================
# MODEL
# ============================================================

base = EfficientNetB0(
    include_top=False,
    weights="imagenet",
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

base.trainable = False

inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))

x = base(inputs, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)

x = layers.Dense(256, activation="relu")(x)
x = layers.Dropout(0.3)(x)

outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs, outputs)

# ============================================================
# PHASE 1
# ============================================================

model.compile(
    optimizer=tf.keras.optimizers.Adam(3e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# Setup callbacks for training efficiency
early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=15,
    class_weight=class_weights,
    callbacks=[early_stopping, reduce_lr]
)

# ============================================================
# PHASE 2 FINE TUNING 
# ============================================================

base.trainable = True

# 🔥 FIX: only last 10–15% layers
for layer in base.layers[:-25]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# Fine-tuning uses early stopping to prevent overfitting
history2 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=25,
    initial_epoch=history.epoch[-1] + 1 if hasattr(history, 'epoch') and history.epoch else 15,
    class_weight=class_weights,
    callbacks=[early_stopping]
)

# ============================================================
# SAVE
# ============================================================

model.save("models/liver_v_fixed.keras")