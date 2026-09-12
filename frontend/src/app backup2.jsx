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
  const [loading, setLoading] = useState(false);

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
      setStatus("AI camera is running");
    } catch (err) {
      console.error(err);
      setError(
        "Unable to access camera. Please allow camera permission."
      );
      setStatus("Camera failed");
    }
  };

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
const detectPeople = async () => {
  console.log("DETECT FUNCTION CALLED");

  const video = videoRef.current;
  const canvas = canvasRef.current;
  console.log("VIDEO:", video);
console.log("CANVAS:", canvas);
console.log("VIDEO SIZE:", video?.videoWidth, video?.videoHeight);

  if (!video || !canvas) return;

  if (
    video.readyState < 3 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return;
  }

  if (video.requestVideoFrameCallback) {
    await new Promise((resolve) => {
      video.requestVideoFrameCallback(() => resolve());
    });
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

console.log("YOLO RESULT:", data);
console.log("YOLO PEOPLE COUNT:", data.people_count);
        setPeopleCount(Number(data.people_count) || 0);
        setStatus("AI detection running");
      } catch (err) {
        console.error("Detection error:", err);
        setStatus("AI detection connection failed");
      }
    },
    "image/jpeg",
    0.9
  );
};
  useEffect(() => {
  if (!cameraOn) return;

  const timer = setTimeout(() => {
    detectPeople();

    intervalRef.current = setInterval(() => {
      detectPeople();
    }, 2000);
  }, 1000);

  return () => {
    clearTimeout(timer);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [cameraOn]);

  const checkQueue = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">IQ</div>

          <div>
            <h2>IntelliQueue</h2>
            <span>AI Queue Management</span>
          </div>
        </div>

        <div className="online-status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="badge">
              AI POWERED • REAL TIME
            </div>

            <h1>
              Smart Queue
              <br />
              <span>Prediction System</span>
            </h1>

            <p>
              Monitor university queues using computer vision
              and machine learning to predict waiting times
              in real time.
            </p>
          </div>
        </section>

        <section className="dashboard">
          <div className="card camera-card">
            <div className="card-header">
              <div>
                <h3>Live Queue Monitoring</h3>
                <p>AI-powered people detection</p>
              </div>

              <div className="live-badge">
                <span></span>
                LIVE
              </div>
            </div>

            <div className="camera-wrapper">
<div style={{ position: "relative", width: "100%" }}>
  <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    style={{
      width: "100%",
      display: "block",
    }}
  />

  {/* Queue detection area */}
  <div
    style={{
      position: "absolute",
      left: "15%",
      top: "20%",
      width: "70%",
      height: "60%",
      border: "3px solid #00ff88",
      borderRadius: "12px",
      pointerEvents: "none",
      boxSizing: "border-box",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: "8px",
        left: "10px",
        background: "#00ff88",
        color: "#000",
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      QUEUE AREA
    </span>
  </div>
</div>

<canvas
  ref={canvasRef}
  style={{ display: "none" }}
/>

              {!cameraOn && (
                <div className="camera-placeholder">
                  <div className="camera-icon">
                    📷
                  </div>

                  <h3>Camera Ready</h3>

                  <p>
                    Start the camera to begin AI queue
                    monitoring.
                  </p>
                </div>
              )}

              <div className="people-counter">
                <span className="counter-label">
                  PEOPLE DETECTED
                </span>

                <strong>{peopleCount}</strong>
              </div>
            </div>

            <div className="camera-footer">
              <div className="ai-status">
                <span
                  className={
                    cameraOn
                      ? "pulse active"
                      : "pulse"
                  }
                ></span>

                {status}
              </div>

              {!cameraOn ? (
                <button
                  className="primary-button"
                  onClick={startCamera}
                >
                  ▶ Start Camera
                </button>
              ) : (
                <button
                  className="danger-button"
                  onClick={stopCamera}
                >
                  ■ Stop Camera
                </button>
              )}
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}
          </div>

          <div className="card prediction-card">
            <div className="card-header">
              <div>
                <h3>Queue Prediction</h3>
                <p>Machine learning analysis</p>
              </div>

              <div className="ml-icon">
                ML
              </div>
            </div>

            <div className="form-group">
              <label>
                Select Service Location
              </label>

              <select
                value={service}
                onChange={(e) =>
                  setService(e.target.value)
                }
              >
                <option>Cafeteria</option>
                <option>Admin Office</option>
                <option>Library Counter</option>
                <option>Fee Counter</option>
                <option>
                  Student Service Center
                </option>
              </select>
            </div>

            <div className="current-queue">
              <div>
                <span>Current Queue</span>
                <strong>{peopleCount}</strong>
              </div>

              <div className="queue-icon">
                👥
              </div>
            </div>

            <button
              className="predict-button"
              onClick={checkQueue}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Predict Queue →"}
            </button>

            {prediction &&
              !prediction.error && (
                <div className="results">
                  <div className="result-header">
                    Prediction Results
                  </div>

                  <div className="result-grid">
                    <div className="result-box">
                      <span>WAITING TIME</span>

                      <strong>
                        {
                          prediction.predicted_waiting_time_minutes
                        }
                      </strong>

                      <small>minutes</small>
                    </div>

                    <div className="result-box">
                      <span>EXPECTED QUEUE</span>

                      <strong>
                        {
                          prediction.predicted_queue_length_students
                        }
                      </strong>

                      <small>students</small>
                    </div>
                  </div>

                  <div className="recommendation">
                    <span>💡</span>

                    <div>
                      <strong>
                        Smart Recommendation
                      </strong>

                      <p>
                        {prediction.predicted_waiting_time_minutes <=
                        10
                          ? "Low waiting time. This is a good time to visit."
                          : prediction.predicted_waiting_time_minutes <=
                            25
                          ? "Moderate queue detected. Consider visiting soon."
                          : "High queue detected. Consider visiting later."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {prediction?.error && (
              <div className="error-box">
                {prediction.error}
              </div>
            )}
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <div className="feature-icon">
              👁️
            </div>

            <div>
              <h3>Computer Vision</h3>

              <p>
                YOLO AI detects people from the live
                camera feed.
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">
              🧠
            </div>

            <div>
              <h3>Machine Learning</h3>

              <p>
                Predicts waiting time and future queue
                length.
              </p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">
              ⚡
            </div>

            <div>
              <h3>Real-Time Monitoring</h3>

              <p>
                Continuously monitors queues for faster
                decisions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <strong>IntelliQueue</strong>
          <span>
            AI-Based Queue Prediction & Management
          </span>
        </div>

        <span>
          Intelligent University Systems
        </span>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          background: #f4f7fb;
          color: #172033;
        }

        button,
        select {
          font-family: inherit;
        }

        .app {
          min-height: 100vh;
        }

        .navbar {
          height: 76px;
          background: white;
          border-bottom: 1px solid #e7ebf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 7%;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: white;
          font-weight: 800;
          font-size: 15px;
        }

        .brand h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.4px;
        }

        .brand span {
          display: block;
          color: #7b8496;
          font-size: 11px;
          margin-top: 2px;
        }

        .online-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3d485c;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px #dcfce7;
        }

        .container {
          width: min(1180px, 92%);
          margin: auto;
          padding: 55px 0 70px;
        }

        .hero {
          margin-bottom: 38px;
        }

        .badge {
          display: inline-block;
          padding: 7px 12px;
          border-radius: 30px;
          background: #eaf1ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          margin-bottom: 15px;
        }

        .hero h1 {
          font-size: clamp(36px, 5vw, 60px);
          line-height: 1.02;
          letter-spacing: -2.5px;
          margin: 0;
        }

        .hero h1 span {
          color: #2563eb;
        }

        .hero p {
          max-width: 650px;
          color: #687386;
          font-size: 17px;
          line-height: 1.7;
          margin-top: 20px;
        }

        .dashboard {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr;
          gap: 25px;
          align-items: start;
        }

        .card {
          background: white;
          border: 1px solid #e7ebf2;
          border-radius: 20px;
          box-shadow:
            0 12px 35px rgba(30, 45, 75, 0.06);
          overflow: hidden;
        }

        .card-header {
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #edf0f5;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .card-header p {
          margin: 5px 0 0;
          color: #8992a2;
          font-size: 12px;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #dc2626;
          font-size: 11px;
          font-weight: 800;
        }

        .live-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #dc2626;
        }

        .ml-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
        }

        .camera-wrapper {
          position: relative;
          height: 430px;
          background: #0c111a;
          overflow: hidden;
        }

        .camera-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #9aa5b5;
          text-align: center;
          padding: 20px;
        }

        .camera-icon {
          width: 65px;
          height: 65px;
          border-radius: 18px;
          background: #1c2635;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 14px;
        }

        .camera-placeholder h3 {
          color: white;
          margin: 0;
        }

        .camera-placeholder p {
          font-size: 13px;
          max-width: 280px;
          line-height: 1.6;
        }

        .people-counter {
          position: absolute;
          left: 18px;
          bottom: 18px;
          background: rgba(8, 12, 18, 0.88);
          backdrop-filter: blur(10px);
          padding: 12px 18px;
          border-radius: 12px;
          color: white;
          min-width: 125px;
        }

        .counter-label {
          display: block;
          font-size: 9px;
          letter-spacing: 1px;
          color: #aeb7c5;
          font-weight: 700;
        }

        .people-counter strong {
          display: block;
          font-size: 34px;
          line-height: 1.1;
          margin-top: 3px;
        }

        .camera-footer {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #697386;
          font-weight: 600;
        }

        .pulse {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #9ca3af;
        }

        .pulse.active {
          background: #16a34a;
          box-shadow: 0 0 0 5px #dcfce7;
        }

        button {
          cursor: pointer;
          border: 0;
        }

        .primary-button,
        .danger-button {
          color: white;
          padding: 12px 20px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13px;
        }

        .primary-button {
          background: #2563eb;
        }

        .primary-button:hover {
          background: #1d4ed8;
        }

        .danger-button {
          background: #dc2626;
        }

        .danger-button:hover {
          background: #b91c1c;
        }

        .prediction-card {
          padding-bottom: 22px;
        }

        .form-group {
          padding: 24px 24px 0;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          color: #667085;
          font-weight: 700;
          margin-bottom: 8px;
        }

        select {
          width: 100%;
          border: 1px solid #dce1e9;
          border-radius: 10px;
          padding: 13px;
          background: white;
          color: #263246;
          font-size: 14px;
          outline: none;
        }

        select:focus {
          border-color: #2563eb;
        }

        .current-queue {
          margin: 20px 24px;
          padding: 18px;
          border-radius: 14px;
          background: #f7f9fc;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .current-queue span {
          display: block;
          font-size: 11px;
          color: #7b8494;
          font-weight: 700;
        }

        .current-queue strong {
          display: block;
          font-size: 30px;
          margin-top: 3px;
        }

        .queue-icon {
          font-size: 27px;
        }

        .predict-button {
          width: calc(100% - 48px);
          margin: 0 24px;
          padding: 14px;
          border-radius: 10px;
          background: #172033;
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        .predict-button:hover {
          background: #0f172a;
        }

        .predict-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results {
          margin: 22px 24px 0;
          border-top: 1px solid #edf0f5;
          padding-top: 20px;
        }

        .result-header {
          font-size: 12px;
          font-weight: 800;
          color: #596477;
          margin-bottom: 13px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .result-box {
          background: #f7f9fc;
          padding: 15px;
          border-radius: 12px;
        }

        .result-box span {
          display: block;
          font-size: 9px;
          color: #7b8494;
          font-weight: 800;
        }

        .result-box strong {
          font-size: 26px;
          display: inline-block;
          margin-top: 4px;
        }

        .result-box small {
          color: #7b8494;
          margin-left: 5px;
        }

        .recommendation {
          margin-top: 12px;
          padding: 13px;
          background: #eff6ff;
          border-radius: 12px;
          display: flex;
          gap: 10px;
        }

        .recommendation span {
          font-size: 18px;
        }

        .recommendation strong {
          font-size: 11px;
          color: #1d4ed8;
        }

        .recommendation p {
          margin: 3px 0 0;
          font-size: 11px;
          color: #526078;
          line-height: 1.5;
        }

        .features {
          margin-top: 25px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feature {
          background: white;
          border: 1px solid #e7ebf2;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          gap: 15px;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .feature h3 {
          margin: 0;
          font-size: 14px;
        }

        .feature p {
          margin: 6px 0 0;
          color: #7a8495;
          font-size: 11px;
          line-height: 1.6;
        }

        .error-box {
          margin: 0 22px 18px;
          padding: 12px;
          border-radius: 9px;
          background: #fef2f2;
          color: #dc2626;
          font-size: 12px;
          text-align: center;
        }

        footer {
          background: #172033;
          color: white;
          padding: 25px 7%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        footer strong {
          display: block;
          font-size: 15px;
        }

        footer span {
          color: #9da7b8;
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .dashboard {
            grid-template-columns: 1fr;
          }

          .features {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .navbar {
            padding: 0 5%;
          }

          .online-status {
            display: none;
          }

          .container {
            width: 94%;
            padding-top: 35px;
          }

          .hero h1 {
            font-size: 39px;
          }

          .hero p {
            font-size: 14px;
          }

          .camera-wrapper {
            height: 330px;
          }

          .camera-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .primary-button,
          .danger-button {
            width: 100%;
          }

          .result-grid {
            grid-template-columns: 1fr;
          }

          footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default App;