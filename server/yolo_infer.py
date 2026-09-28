# yolo_infer.py
from ultralytics import YOLO
import sys
import json

image_path = sys.argv[1]

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Run prediction
results = model.predict(source=image_path, imgsz=640, verbose=False)  # <- verbose=False suppresses logs

# Parse predictions
output = []
for r in results:
    for box in r.boxes:
        output.append({
            "class": int(box.cls[0]),
            "confidence": float(box.conf[0]),
            "xyxy": box.xyxy[0].tolist()
        })

print(json.dumps(output))  # ONLY JSON