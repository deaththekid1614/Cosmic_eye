import io
import hashlib
import requests
import concurrent.futures
from astropy.io import fits
from astropy.visualization import ZScaleInterval, ImageNormalize
from PIL import Image
import numpy as np
from matplotlib import colormaps
from fastapi import HTTPException
from typing import List

from app.config import settings

def _download_and_normalize(url: str) -> np.ndarray:
    """Downloads a single FITS file and normalizes it."""
    resp = requests.get(url, timeout=90)
    resp.raise_for_status()
    
    with fits.open(io.BytesIO(resp.content)) as hdul:
        data = hdul[1].data
        if len(hdul) > 4 and hdul[4].name == "ZODI":
            data = data - hdul[4].data
        
        norm = ImageNormalize(data, interval=ZScaleInterval())
        return norm(data)

def generate_rgb_preview(urls: List[str]) -> bytes:
    """Downloads 3 URLs in PARALLEL, maps them to RGB, and returns a JPEG."""
    if len(urls) != 3:
        raise ValueError("RGB generation requires exactly 3 URLs.")

    settings.preview_cache_dir.mkdir(parents=True, exist_ok=True)
    combined_hash = hashlib.md5("".join(urls).encode("utf-8")).hexdigest()
    cache_path = settings.preview_cache_dir / f"rgb_{combined_hash}.jpg"

    if cache_path.exists():
        print(f"🚀 RGB Cache hit! Loading: {cache_path.name}")
        with open(cache_path, "rb") as f:
            return f.read()

    print("⬇️ RGB Cache miss. Downloading 3 files from NASA in parallel...")
    try:
        # 1. Download and normalize all 3 bands AT THE SAME TIME
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # executor.map preserves the order of the URLs
            results = list(executor.map(_download_and_normalize, urls))
            
        data_blue, data_green, data_red = results

        # Ensure they are all the same shape
        min_shape = (
            min(data_blue.shape[0], data_green.shape[0], data_red.shape[0]),
            min(data_blue.shape[1], data_green.shape[1], data_red.shape[1])
        )
        data_blue = data_blue[:min_shape[0], :min_shape[1]]
        data_green = data_green[:min_shape[0], :min_shape[1]]
        data_red = data_red[:min_shape[0], :min_shape[1]]

        # 2. Stack into RGB
        rgb_array = np.zeros((min_shape[0], min_shape[1], 3), dtype=np.float32)
        rgb_array[:, :, 0] = data_red
        rgb_array[:, :, 1] = data_green
        rgb_array[:, :, 2] = data_blue

        # 3. Convert to 8-bit image (clean NaNs first)
        rgb_array = np.nan_to_num(rgb_array, nan=0.0, posinf=1.0, neginf=0.0)
        image_data = (np.clip(rgb_array, 0, 1) * 255).astype(np.uint8)
        
        img = Image.fromarray(image_data)
        img = img.resize((800, 800), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        image_bytes = buf.getvalue()

        with open(cache_path, "wb") as f:
            f.write(image_bytes)
            
        print(f"💾 Saved new RGB image to cache: {cache_path.name}")
        return image_bytes

    except Exception as e:
        print(f"RGB Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to build RGB composite: {str(e)}")

def generate_preview(access_url: str, palette: str = "inferno") -> bytes:
    """Render a single infrared band with a selectable false-color palette."""
    palettes = {"magma", "inferno", "plasma", "viridis", "cividis"}
    if palette not in palettes:
        raise HTTPException(status_code=400, detail="Unsupported color palette.")

    settings.preview_cache_dir.mkdir(parents=True, exist_ok=True)
    url_hash = hashlib.md5(access_url.encode("utf-8")).hexdigest()
    cache_name = f"{url_hash}_{palette}.jpg"
    cache_path = settings.preview_cache_dir / cache_name
    normalized_cache_path = settings.preview_cache_dir / f"{url_hash}_normalized.npy"

    if cache_path.exists():
        with open(cache_path, "rb") as f:
            return f.read()

    try:
        if normalized_cache_path.exists():
            normalized_data = np.load(normalized_cache_path)
        else:
            resp = requests.get(access_url, timeout=60)
            resp.raise_for_status()
            with fits.open(io.BytesIO(resp.content)) as hdul:
                data = hdul[1].data
                if len(hdul) > 4 and hdul[4].name == "ZODI":
                    data = data - hdul[4].data
                norm = ImageNormalize(data, interval=ZScaleInterval())
                normalized_data = np.asarray(norm(data), dtype=np.float32)
            np.save(normalized_cache_path, normalized_data)

        colored_data = colormaps[palette](normalized_data)[:, :, :3]
        image_data = (colored_data * 255).astype(np.uint8)

        img = Image.fromarray(image_data)
        img = img.resize((400, 400), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        image_bytes = buf.getvalue()

        with open(cache_path, "wb") as f:
            f.write(image_bytes)
        return image_bytes

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="NASA archive timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
