# preprocessing.py
"""
Aionos Diagnostic - Production Preprocessing Module
---------------------------------------------------
Liver Ultrasound Preprocessing Pipeline

Features:
- Read JPG/JPEG/PNG images
- Convert to RGB
- Resize to model input size
- Speckle noise reduction
- CLAHE enhancement
- Normalization
- TensorFlow integration support
"""

import cv2
import numpy as np
import tensorflow as tf

IMG_SIZE = 224


class UltrasoundPreprocessor:
    def __init__(self, img_size=224):
        self.img_size = img_size

    # ---------------------------------------------------------
    # Speckle Noise Reduction
    # ---------------------------------------------------------
    def reduce_speckle_noise(self, image):
        """
        Uses Non-Local Means Denoising
        """
        denoised = cv2.fastNlMeansDenoisingColored(
            image,
            None,
            h=10,
            hColor=10,
            templateWindowSize=7,
            searchWindowSize=21,
        )
        return denoised

    # ---------------------------------------------------------
    # CLAHE Enhancement
    # ---------------------------------------------------------
    def apply_clahe(self, image):
        """
        Contrast Limited Adaptive Histogram Equalization
        """

        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)

        l, a, b = cv2.split(lab)

        clahe = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8)
        )

        l = clahe.apply(l)

        merged = cv2.merge((l, a, b))

        enhanced = cv2.cvtColor(
            merged,
            cv2.COLOR_LAB2RGB
        )

        return enhanced

    # ---------------------------------------------------------
    # Resize
    # ---------------------------------------------------------
    def resize_image(self, image):
        return cv2.resize(
            image,
            (self.img_size, self.img_size),
            interpolation=cv2.INTER_AREA
        )

    # ---------------------------------------------------------
    # Normalize
    # ---------------------------------------------------------
    def normalize(self, image):
        return image.astype(np.float32) / 255.0

    # ---------------------------------------------------------
    # Complete Pipeline
    # ---------------------------------------------------------
    def process(self, image):
        """
        image: RGB numpy image
        """

        image = self.reduce_speckle_noise(image)

        image = self.apply_clahe(image)

        image = self.resize_image(image)

        image = self.normalize(image)

        return image


# ============================================================
# Utility Functions
# ============================================================

preprocessor = UltrasoundPreprocessor(
    img_size=IMG_SIZE
)


def preprocess_image_path(image_path):
    """
    Reads image from disk and preprocesses.

    Returns:
        np.ndarray (224,224,3)
    """

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Unable to read image: {image_path}"
        )

    image = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    image = preprocessor.process(image)

    return image


def preprocess_numpy_image(image):
    """
    image: RGB numpy image
    """

    return preprocessor.process(image)


# ============================================================
# TensorFlow Integration
# ============================================================

def tf_preprocess(image, label):
    """
    TensorFlow preprocessing function.

    image : Tensor uint8
    label : Tensor
    """

    image = tf.cast(image, tf.uint8)

    image = tf.numpy_function(
        func=preprocess_numpy_image,
        inp=[image],
        Tout=tf.float32,
    )

    image.set_shape((IMG_SIZE, IMG_SIZE, 3))

    return image, label


# ============================================================
# Inference Preprocessing
# ============================================================

def preprocess_for_inference(image_path):
    """
    Used during prediction.

    Returns:
        (1,224,224,3)
    """

    image = preprocess_image_path(image_path)

    image = np.expand_dims(
        image,
        axis=0
    )

    return image


# ============================================================
# Batch Preprocessing
# ============================================================

def preprocess_batch(image_paths):
    """
    Parameters
    ----------
    image_paths : list

    Returns
    -------
    np.ndarray
    """

    images = []

    for path in image_paths:
        images.append(
            preprocess_image_path(path)
        )

    return np.array(
        images,
        dtype=np.float32
    )


# ============================================================
# Standalone Test
# ============================================================

if __name__ == "__main__":

    TEST_IMAGE = "sample.jpg"

    try:
        processed = preprocess_image_path(
            TEST_IMAGE
        )

        print("Preprocessing Successful")
        print("Shape :", processed.shape)
        print("Range :", processed.min(),
              processed.max())

    except Exception as e:
        print("Error :", e)