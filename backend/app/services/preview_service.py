import io
import hashlib
import requests
from astropy.io import fits
from astropy.visualization import ZScaleInterval, ImageNormalize, AsinhStretch
from PIL import Image
import numpy as np
from matplotlib import colormaps

from app.config import settings

def generate_preview(access_url: str) -> bytes:
    """Downloads a FITS file, extracts the image, caches it, and returns a JPEG."""
    
    # Ensure cache directory exists
    settings.preview_cache_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Generate a unique filename based on the URL
    url_hash = hashlib.md5(access_url.encode("utf-8")).hexdigest()
    cache_path = settings.preview_cache_dir / f"{url_hash}.jpg"

    # 2. Check the cache first!
    if cache_path.exists():
        print(f"🚀 Cache hit! Loading from disk: {cache_path.name}")
        with open(cache_path, "rb") as f:
            return f.read()

    # 3. Cache miss — download from NASA
    print(f"⬇️ Cache miss. Downloading from NASA: {access_url[-40:]}...")
    resp = requests.get(access_url, timeout=60)
    resp.raise_for_status()
    
    with fits.open(io.BytesIO(resp.content)) as hdul:
        data = hdul[1].data
        
        # Subtract ZODI background
        if len(hdul) > 4 and hdul[4].name == "ZODI":
            data = data - hdul[4].data
            
        # Normalize and colorize
        norm = ImageNormalize(
            data, 
            interval=ZScaleInterval(), 
            stretch=AsinhStretch(a=0.1)
        )
        normalized_data = norm(data)
        colored_data = colormaps["inferno"](normalized_data)[:, :, :3]
        image_data = (colored_data * 255).astype(np.uint8)
        
        # Resize and save to memory
        img = Image.fromarray(image_data)
        img = img.resize((400, 400), Image.Resampling.LANCZOS)
        
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        image_bytes = buf.getvalue()

        # 4. Save to disk cache for the next time
        with open(cache_path, "wb") as f:
            f.write(image_bytes)
        
        print(f"💾 Saved new image to cache: {cache_path.name}")
        return image_bytes