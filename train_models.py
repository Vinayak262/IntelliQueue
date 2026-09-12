import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


# Load dataset
df = pd.read_csv("dataset/queue_data.csv")

print("Dataset loaded successfully!")
print("Total records:", len(df))


# Features used for prediction
features = [
    "day_of_week",
    "hour",
    "service_location",
    "number_of_counters",
    "queue_length",
    "average_service_time",
    "students_arriving",
    "exam_period",
    "holiday"
]

X = df[features]

# Two prediction targets
y_waiting = df["waiting_time"]
y_queue = df["queue_length"]


# Split data
X_train, X_test, y_wait_train, y_wait_test = train_test_split(
    X, y_waiting, test_size=0.2, random_state=42
)

_, _, y_queue_train, y_queue_test = train_test_split(
    X, y_queue, test_size=0.2, random_state=42
)


# Preprocessing
categorical_features = [
    "day_of_week",
    "service_location"
]

numerical_features = [
    "hour",
    "number_of_counters",
    "queue_length",
    "average_service_time",
    "students_arriving",
    "exam_period",
    "holiday"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)


# Waiting-time model
waiting_model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "model",
            RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            )
        )
    ]
)


# Queue-length model
queue_model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "model",
            RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            )
        )
    ]
)


# Train models
print("\nTraining waiting-time model...")
waiting_model.fit(X_train, y_wait_train)
print("Waiting-time model trained!")

print("\nTraining queue-length model...")
queue_model.fit(X_train, y_queue_train)
print("Queue-length model trained!")


# Evaluate
waiting_predictions = waiting_model.predict(X_test)
queue_predictions = queue_model.predict(X_test)

waiting_mae = mean_absolute_error(y_wait_test, waiting_predictions)
waiting_r2 = r2_score(y_wait_test, waiting_predictions)

queue_mae = mean_absolute_error(y_queue_test, queue_predictions)
queue_r2 = r2_score(y_queue_test, queue_predictions)


print("\n========== MODEL RESULTS ==========")

print("\nWAITING-TIME MODEL")
print("MAE:", round(waiting_mae, 2), "minutes")
print("R2 Score:", round(waiting_r2, 2))

print("\nQUEUE-LENGTH MODEL")
print("MAE:", round(queue_mae, 2), "students")
print("R2 Score:", round(queue_r2, 2))


# Save models
os.makedirs("models", exist_ok=True)

joblib.dump(waiting_model, "models/waiting_time_model.pkl")
joblib.dump(queue_model, "models/queue_length_model.pkl")

print("\nModels saved successfully!")
print("models/waiting_time_model.pkl")
print("models/queue_length_model.pkl")