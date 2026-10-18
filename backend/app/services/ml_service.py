def describe_wavelength(wavelength_um: float) -> str:
    """Describe the wavelength range; this does not identify image contents."""
    if wavelength_um < 1.65:
        return "Short wavelength infrared"
    if wavelength_um < 2.43:
        return "Near infrared"
    if wavelength_um < 3.10:
        return "Mid infrared"
    return "Long wavelength infrared"
