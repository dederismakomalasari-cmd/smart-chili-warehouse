import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="Smart Chili YOLO11 Inference API", version="0.1.0")
WEIGHTS = Path(os.getenv("YOLO_WEIGHTS", "weights/best.pt"))
CONF = float(os.getenv("YOLO_CONF", "0.25"))
model = None

@app.on_event("startup")
def load_model():
    global model
    if WEIGHTS.exists():
        model = YOLO(str(WEIGHTS))

@app.get("/health")
def health():
    return {"ok": True, "model_loaded": model is not None, "weights": str(WEIGHTS)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Weights best.pt belum tersedia.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Unggah file gambar.")
    raw = await file.read()
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="File bukan gambar valid.")
    results = model.predict(image, conf=CONF, verbose=False)
    result = results[0]
    names = result.names
    detections = []
    for box in result.boxes:
        cls_id = int(box.cls.item())
        detections.append({
            "class_id": cls_id,
            "class_name": names[cls_id],
            "confidence": round(float(box.conf.item()), 5),
            "xyxy": [round(float(v), 2) for v in box.xyxy[0].tolist()]
        })
    return {
        "model": "YOLO11",
        "image": file.filename,
        "image_width": result.orig_shape[1],
        "image_height": result.orig_shape[0],
        "confidence_threshold": CONF,
        "detections": detections,
        "count": len(detections)
    }
