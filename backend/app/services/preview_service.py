import io
import hashlib
import requests
from astropy.io import fits
from astropy.visualization import ZScaleInterval, ImageNormalize, AsinhStretch
from PIL import Image
import numpy as np
from matplotlib import colormaps
from fastapi import HTTPException

from app.config import settings

def generate_preview(access_url: str) -> bytes:
    """Downloads FITS, applies stretch, and colors it using magma."""
    
    settings.preview_cache_dir.mkdir(parents=True, exist_ok=True)
    url_hash = hashlib.md5(access_url.encode("utf-8")).hexdigest()
    cache_path = settings.preview_cache_dir / f"{url_hash}.jpg"

    if cache_path.exists():
        with open(cache_path, "rb") as f:
            return f.read()

    try:
        print(f"⬇️ Downloading from NASA: {access_url[-40:]}...")
        resp = requests.get(access_url, timeout=60)
        resp.raise_for_status()
        
        with fits.open(io.BytesIO(resp.content)) as hdul:
            data = hdul[1].data
            if len(hdul) > 4 and hdul[4].name == "ZODI":
                data = data - hdul[4].data
                
            norm = ImageNormalize(data, interval=ZScaleInterval(), stretch=AsinhStretch(a=0.05))
            normalized_data = norm(data)
            
            # Use only magma
            colored_data = colormaps["magma"](normalized_data)[:, :, :3]
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
        raise HTTPException(status_code=504, detail="NASA archive timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to NASA: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
