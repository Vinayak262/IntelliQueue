# IntelliQueue frontend

This is a fully static React/Vite application. It runs people detection locally
in the browser with ONNX Runtime Web and the bundled YOLO11n ONNX model; camera
frames are never sent to a server. Queue predictions also run locally from the
verified source-data behavior used to train the original sklearn models.

Run locally with `npm ci` followed by `npm run dev`. Production deployment is
handled by the repository's GitHub Pages workflow.
