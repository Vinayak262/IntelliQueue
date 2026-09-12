from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd
import joblib
import os

from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(
    title="Intelligent Queue Prediction API",
    description="ML-powered university queue prediction system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

waiting_model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "waiting_time_model.pkl"
    )
)

queue_model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "queue_length_model.pkl"
    )
)

yolo_model = YOLO(
    os.path.join(
        BASE_DIR,
        "yolo11n.pt"
    )
)

class QueueRequest(BaseModel):
    day_of_week: str
    hour: int
    service_location: str
    number_of_counters: int
    queue_length: int
    average_service_time: float
    students_arriving: int
    exam_period: int
    holiday: int

class CameraCountRequest(BaseModel):
    people_count: int

current_people_count = 0

@app.get("/")
def home():
    return {
        "message": "Intelligent Queue Prediction API is running!"
    }

@app.post("/predict")
def predict_queue(data: QueueRequest):

    input_data = pd.DataFrame(
        [data.model_dump()]
    )

    predicted_waiting_time = (
        waiting_model.predict(input_data)[0]
    )

    predicted_queue_length = (
        queue_model.predict(input_data)[0]
    )

    return {
        "service_location":
            data.service_location,

        "predicted_waiting_time_minutes":
            round(
                float(predicted_waiting_time),
                2
            ),

        "predicted_queue_length_students":
            round(
                float(predicted_queue_length),
                2
            )
    }

@app.post("/camera-count")
def receive_camera_count(
    data: CameraCountRequest
):

    global current_people_count

    current_people_count = data.people_count

    return {
        "status": "success",
        "people_count":
            current_people_count
    }

@app.get("/camera-count")
def get_camera_count():

    return {
        "people_count":
            current_people_count
    }

@app.post("/detect-people")
async def detect_people(
    file: UploadFile = File(...)
):

    global current_people_count

    image_bytes = await file.read()

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    results = yolo_model(
        image,
        classes=[0],
        verbose=False
    )

    people_count = 0

    image_width, image_height = image.size

    queue_x1 = image_width * 0.15
    queue_y1 = image_height * 0.20
    queue_x2 = image_width * 0.85
    queue_y2 = image_height * 0.80

    for box in results[0].boxes.xyxy:

        x1, y1, x2, y2 = box.tolist()

        center_x = (
            x1 + x2
        ) / 2

        center_y = (
            y1 + y2
        ) / 2

        if (
            queue_x1 <= center_x <= queue_x2
            and
            queue_y1 <= center_y <= queue_y2
        ):
            people_count += 1

    current_people_count = people_count

    return {
        "status": "success",
        "people_count": people_count
    }