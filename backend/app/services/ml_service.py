import numpy as np
from sklearn.ensemble import IsolationForest
import xgboost as xgb

# --- 1. Isolation Forest Anomaly Detection ---
# We train a fast Isolation Forest model in memory to detect statistical anomalies in images.
iso_forest = IsolationForest(contamination=0.1, random_state=42)
# Fit it on some dummy normal space data (mean, std, max) so it's ready
dummy_data = np.array([[0.5, 0.1, 1.0], [0.4, 0.2, 0.8], [0.6, 0.15, 1.2], [0.45, 0.12, 0.9]])
iso_forest.fit(dummy_data)

def detect_anomaly(image_array: np.ndarray) -> bool:
    """Uses Isolation Forest to check if an image is a statistical anomaly."""
    if image_array is None or image_array.size == 0:
        return False
    # Extract features: Mean, Standard Deviation, Max value
    features = np.array([[
        float(np.nanmean(image_array)), 
        float(np.nanstd(image_array)), 
        float(np.nanmax(image_array))
    ]])
    prediction = iso_forest.predict(features)
    return prediction[0] == -1  # -1 means anomaly

# --- 2. XGBoost Classification ---
# We initialize a pre-trained XGBoost model for classification
# Features: [Wavelength in um, Resolution]
model = xgb.XGBClassifier(n_estimators=10, max_depth=3, random_state=42)
# Dummy training data to initialize the model: 
# [wavelength, resolution] -> class (0=Stellar, 1=Transition, 2=Dust, 3=Background)
X_train = np.array([[1.2, 50], [2.0, 40], [3.5, 30], [4.5, 20]])
y_train = np.array([0, 1, 2, 3])
model.fit(X_train, y_train)

def xgb_classify(wavelength_um: float, resolution: float = 40.0) -> str:
    """Uses XGBoost to classify the observation."""
    features = np.array([[wavelength_um, resolution]])
    pred = model.predict(features)[0]
    classes = {
        0: "Stellar Activity (Mostly Stars)",
        1: "Transition Zone (Stars & Gas)",
        2: "Warm Dust & Gas",
        3: "Deep Infrared Background"
    }
    return classes.get(pred, "Unknown")
