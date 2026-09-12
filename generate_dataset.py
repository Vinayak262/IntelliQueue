import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Make results reproducible
np.random.seed(42)

# Number of records
num_records = 10000

# University service locations
services = [
    "Cafeteria",
    "Admin Office",
    "Library Counter",
    "Fee Counter",
    "Student Service Center"
]

# Generate dates
start_date = datetime(2026, 1, 1)

records = []

for i in range(num_records):

    # Random date
    date = start_date + timedelta(days=np.random.randint(0, 180))

    # Day and time
    day_of_week = date.strftime("%A")
    hour = np.random.randint(8, 18)

    # Random service
    service_location = np.random.choice(services)

    # Number of counters
    number_of_counters = np.random.randint(1, 6)

    # Peak hours
    peak_hours = hour in [12, 13, 14]

    # Exam period
    exam_period = np.random.choice([0, 1], p=[0.8, 0.2])

    # Holiday
    holiday = np.random.choice([0, 1], p=[0.9, 0.1])

    # Students arriving
    students_arriving = np.random.randint(5, 80)

    # Queue length
    queue_length = (
        students_arriving
        + (20 if peak_hours else 0)
        + (15 if exam_period else 0)
        - (10 if holiday else 0)
        + np.random.randint(-5, 10)
    )

    queue_length = max(0, queue_length)

    # Average service time in minutes
    average_service_time = np.random.uniform(1, 8)

    # Waiting time calculation
    waiting_time = (
        queue_length * average_service_time
    ) / number_of_counters

    # Add realistic variation
    waiting_time += np.random.uniform(-3, 5)

    waiting_time = max(1, waiting_time)

    records.append([
        date.strftime("%Y-%m-%d"),
        day_of_week,
        hour,
        service_location,
        number_of_counters,
        queue_length,
        average_service_time,
        students_arriving,
        exam_period,
        holiday,
        waiting_time
    ])

# Create DataFrame
columns = [
    "date",
    "day_of_week",
    "hour",
    "service_location",
    "number_of_counters",
    "queue_length",
    "average_service_time",
    "students_arriving",
    "exam_period",
    "holiday",
    "waiting_time"
]

df = pd.DataFrame(records, columns=columns)

# Save dataset
df.to_csv("dataset/queue_data.csv", index=False)

print("Dataset created successfully!")
print(f"Total records: {len(df)}")
print("\nFirst 5 records:")
print(df.head())