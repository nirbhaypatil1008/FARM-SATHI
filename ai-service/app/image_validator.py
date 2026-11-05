from dataclasses import dataclass
from io import BytesIO
import os

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError


MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))
MAX_IMAGE_PIXELS = 20_000_000
MIN_IMAGE_SIDE = 96
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

if MAX_IMAGE_BYTES <= 0:
    raise ValueError("MAX_IMAGE_BYTES must be a positive integer.")


class ImageValidationError(ValueError):
    pass


@dataclass(frozen=True)
class ValidatedImage:
    pixels: np.ndarray
    is_unclear: bool


def validate_and_preprocess_image(raw: bytes) -> ValidatedImage:
    if not raw:
        raise ImageValidationError("Upload an image to analyze.")
    if len(raw) > MAX_IMAGE_BYTES:
        raise ImageValidationError("Choose an image smaller than 5 MB.")
    try:
        with Image.open(BytesIO(raw)) as image:
            if image.format not in ALLOWED_FORMATS:
                raise ImageValidationError("Choose a JPG, PNG, or WEBP image.")
            if image.width < MIN_IMAGE_SIDE or image.height < MIN_IMAGE_SIDE:
                raise ImageValidationError("This image is too small. Upload a clearer photo of the plant.")
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise ImageValidationError("This image has too many pixels. Resize it and try again.")
            image.verify()
        with Image.open(BytesIO(raw)) as image:
            image = ImageOps.exif_transpose(image)
            rgb_image = image.convert("RGB")
            grayscale = np.asarray(rgb_image.convert("L").resize((112, 112)), dtype=np.float32)
            laplacian = (
                -4 * grayscale
                + np.roll(grayscale, 1, axis=0)
                + np.roll(grayscale, -1, axis=0)
                + np.roll(grayscale, 1, axis=1)
                + np.roll(grayscale, -1, axis=1)
            )
            is_unclear = float(np.var(laplacian[1:-1, 1:-1])) < 8.0
            pixels = np.asarray(
                rgb_image.resize((224, 224), Image.Resampling.BILINEAR),
                dtype=np.float32,
            )
    except ImageValidationError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as error:
        raise ImageValidationError("The uploaded file is not a readable image. Try another photo.") from error
    return ValidatedImage(pixels=pixels, is_unclear=is_unclear)
