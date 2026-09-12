import { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);
  const [status, setStatus] = useState("Camera is off");
  const [error, setError] = useState("");
  const [service, setService] = useState("Cafeteria");
  const [prediction, setPrediction] = useState(null);

  // =========================
  // START CAMERA
  // =========================
  const startCamera = async () => {
    try {
      setError("");
      setStatus("Opening camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        await videoRef.current.play();
      }

      setCameraOn(true);
      setStatus("Camera running");
    } catch (err) {
      console.error(err);
      setError("Unable to open camera.");
      setStatus("Camera failed");
    }
  };

  // =========================
  // STOP CAMERA
  // =========================
  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setPeopleCount(0);
    setStatus("Camera stopped");
  };

  // =========================
  // SEND FRAME TO YOLO
  // =========================
  const detectPeople = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "camera.jpg");

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/detect-people",
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }

          const data = await response.json();

          setPeopleCount(Number(data.people_count) || 0);
          setStatus("AI detection running");
        } catch (err) {
          console.error("Detection error:", err);
          setStatus("AI detection connection failed");
        }
      },
      "image/jpeg",
      0.7
    );
  };

  // =========================
  // START YOLO DETECTION
  // =========================
  useEffect(() => {
    if (!cameraOn) return;

    detectPeople();

    intervalRef.current = setInterval(() => {
      detectPeople();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cameraOn]);

  // =========================
  // QUEUE PREDICTION
  // =========================
  const checkQueue = async () => {
    try {
      setPrediction(null);

      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            day_of_week: "Monday",
            hour: 13,
            service_location: service,
            number_of_counters: 3,
            queue_length: peopleCount,
            average_service_time: 2.5,
            students_arriving: peopleCount + 10,
            exam_period: 0,
            holiday: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data = await response.json();

      setPrediction(data);
    } catch (err) {
      console.error(err);

      setPrediction({
        error: "Unable to connect to prediction server.",
      });
    }
  };

  // =========================
  // CLEANUP
  // =========================
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // =========================
  // WEBSITE
  // =========================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        paddingBottom: "50px",
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          background: "white",
          padding: "18px 8%",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Intelligent Queue Management
        </h2>

        <p style={{ margin: "5px 0 0", color: "#666" }}>
          AI Powered University Queue System
        </p>
      </nav>

      {/* MAIN */}
      <main
        style={{
          maxWidth: "850px",
          margin: "auto",
          padding: "40px 20px",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          Smart Queue Prediction
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
          }}
        >
          Real-time camera based people detection
        </p>

        {/* CAMERA */}
        <div
          style={{
            marginTop: "30px",
            background: "#111",
            borderRadius: "15px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              display: "block",
              minHeight: "400px",
              objectFit: "cover",
              background: "#000",
            }}
          />

          {/* COUNT */}
          <div
            style={{
              position: "absolute",
              top: "15px",
              left: "15px",
              background: "rgba(0,0,0,0.75)",
              color: "white",
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            People: {peopleCount}
          </div>
        </div>

        {/* HIDDEN CANVAS */}
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />

        {/* STATUS */}
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
            fontWeight: "bold",
          }}
        >
          {status}
        </div>

        {error && (
          <p
            style={{
              color: "red",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {!cameraOn ? (
            <button
              onClick={startCamera}
              style={{
                padding: "14px 25px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{
                padding: "14px 25px",
                border: "none",
                borderRadius: "8px",
                background: "#dc2626",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Stop Camera
            </button>
          )}
        </div>

        {/* QUEUE PREDICTION */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            marginTop: "35px",
            boxShadow: "0 3px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Queue Prediction</h2>

          <label>Service Location</label>

          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <option>Cafeteria</option>
            <option>Admin Office</option>
            <option>Library Counter</option>
            <option>Fee Counter</option>
            <option>Student Service Center</option>
          </select>

          <button
            onClick={checkQueue}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: "#16a34a",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Check Queue
          </button>

          {prediction && !prediction.error && (
            <div style={{ marginTop: "25px" }}>
              <h3>Prediction Result</h3>

              <p>
                <strong>Service:</strong>{" "}
                {prediction.service_location}
              </p>

              <p>
                <strong>Waiting Time:</strong>{" "}
                {prediction.predicted_waiting_time_minutes} minutes
              </p>

              <p>
                <strong>Predicted Queue:</strong>{" "}
                {prediction.predicted_queue_length_students} students
              </p>
            </div>
          )}

          {prediction?.error && (
            <p style={{ color: "red" }}>
              {prediction.error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;