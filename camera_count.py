import cv2
import requests
from ultralytics import YOLO

# FastAPI backend
API_URL = "http://127.0.0.1:8000/camera-count"

# Load YOLO model
model = YOLO("yolo11n.pt")

# Open camera
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Camera could not be opened.")
    exit()

print("Camera started...")
print("Press Q to close.")

while True:
    success, frame = camera.read()

    if not success:
        print("Could not read camera.")
        break

    height, width, _ = frame.shape

    # Queue counting area
    x1 = int(width * 0.20)
    y1 = int(height * 0.20)
    x2 = int(width * 0.80)
    y2 = int(height * 0.90)

    # Detect people only
    results = model(
        frame,
        classes=[0],
        verbose=False
    )

    people_count = 0

    for box in results[0].boxes:

        bx1, by1, bx2, by2 = box.xyxy[0].tolist()

        # Center of detected person
        center_x = int((bx1 + bx2) / 2)
        center_y = int((by1 + by2) / 2)

        # Count only people inside queue area
        if (
            x1 <= center_x <= x2
            and y1 <= center_y <= y2
        ):
            people_count += 1

    # Send count to backend
    try:

        response = requests.post(
            API_URL,
            json={
                "people_count": people_count
            },
            timeout=1
        )

        if response.status_code == 200:
            print(
                "Camera count sent:",
                people_count
            )

    except requests.exceptions.RequestException:
        print("Backend connection failed")

    # Draw YOLO detections
    annotated_frame = results[0].plot()

    # Draw queue area
    cv2.rectangle(
        annotated_frame,
        (x1, y1),
        (x2, y2),
        (255, 0, 0),
        2
    )

    # Display count
    cv2.putText(
        annotated_frame,
        f"Queue people: {people_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    # Show camera
    cv2.imshow(
        "Queue People Counter",
        annotated_frame
    )

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Release camera
camera.release()
cv2.destroyAllWindows()