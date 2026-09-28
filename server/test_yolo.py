from ultralytics import YOLO
import cv2

# Load YOLO model (pre-trained COCO)
model = YOLO("yolov8n.pt")  # tiny model, fast for testing

# Load an image
img = cv2.imread("uploads/test.jpg")

# Run detection
results = model.predict(source=img)

# Print predictions
print(results[0].boxes)
print("Detected classes:", results[0].names)