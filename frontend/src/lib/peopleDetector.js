import * as ort from "onnxruntime-web/wasm";

const MODEL_SIZE = 640;
const PERSON_CLASS_INDEX = 0;
const SCORE_THRESHOLD = 0.35;
const NMS_IOU_THRESHOLD = 0.45;

let detectorPromise;

function intersectionOverUnion(first, second) {
  const left = Math.max(first.x1, second.x1);
  const top = Math.max(first.y1, second.y1);
  const right = Math.min(first.x2, second.x2);
  const bottom = Math.min(first.y2, second.y2);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const firstArea = (first.x2 - first.x1) * (first.y2 - first.y1);
  const secondArea = (second.x2 - second.x1) * (second.y2 - second.y1);

  return intersection / (firstArea + secondArea - intersection || 1);
}

function suppressOverlappingBoxes(boxes) {
  const sortedBoxes = [...boxes].sort((first, second) => second.score - first.score);
  const selected = [];

  for (const box of sortedBoxes) {
    if (
      selected.every(
        (selectedBox) =>
          intersectionOverUnion(box, selectedBox) < NMS_IOU_THRESHOLD,
      )
    ) {
      selected.push(box);
    }
  }

  return selected;
}

function createInputTensor(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { data } = context.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
  const channelSize = MODEL_SIZE * MODEL_SIZE;
  const input = new Float32Array(channelSize * 3);

  for (let pixelIndex = 0; pixelIndex < channelSize; pixelIndex += 1) {
    const sourceIndex = pixelIndex * 4;
    input[pixelIndex] = data[sourceIndex] / 255;
    input[channelSize + pixelIndex] = data[sourceIndex + 1] / 255;
    input[channelSize * 2 + pixelIndex] = data[sourceIndex + 2] / 255;
  }

  return new ort.Tensor("float32", input, [1, 3, MODEL_SIZE, MODEL_SIZE]);
}

function decodePersonBoxes(
  output,
  scale,
  paddingX,
  paddingY,
  sourceWidth,
  sourceHeight,
) {
  const [batchSize, firstDimension, secondDimension] = output.dims;
  if (batchSize !== 1) {
    throw new Error("The local YOLO model returned an unsupported batch size.");
  }

  const channelFirst = firstDimension === 84;
  const candidateCount = channelFirst ? secondDimension : firstDimension;
  const boxes = [];

  for (let index = 0; index < candidateCount; index += 1) {
    const offset = channelFirst ? index : index * secondDimension;
    const stride = channelFirst ? candidateCount : 1;
    const personScore = output.data[
      offset + (4 + PERSON_CLASS_INDEX) * stride
    ];

    if (personScore < SCORE_THRESHOLD) {
      continue;
    }

    const centerX = output.data[offset];
    const centerY = output.data[offset + stride];
    const width = output.data[offset + stride * 2];
    const height = output.data[offset + stride * 3];

    const x1 = Math.max(0, (centerX - width / 2 - paddingX) / scale);
    const y1 = Math.max(0, (centerY - height / 2 - paddingY) / scale);
    const x2 = Math.min(sourceWidth, (centerX + width / 2 - paddingX) / scale);
    const y2 = Math.min(sourceHeight, (centerY + height / 2 - paddingY) / scale);

    if (x2 > x1 && y2 > y1) {
      boxes.push({ x1, y1, x2, y2, score: personScore });
    }
  }

  return suppressOverlappingBoxes(boxes);
}

class PeopleDetector {
  constructor(session) {
    this.session = session;
    this.inputName = session.inputNames[0];
    this.outputName = session.outputNames[0];
  }

  async detect(video, workCanvas) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const scale = Math.min(MODEL_SIZE / sourceWidth, MODEL_SIZE / sourceHeight);
    const resizedWidth = Math.round(sourceWidth * scale);
    const resizedHeight = Math.round(sourceHeight * scale);
    const paddingX = (MODEL_SIZE - resizedWidth) / 2;
    const paddingY = (MODEL_SIZE - resizedHeight) / 2;
    const context = workCanvas.getContext("2d", { willReadFrequently: true });

    workCanvas.width = MODEL_SIZE;
    workCanvas.height = MODEL_SIZE;
    context.fillStyle = "#727272";
    context.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);
    context.drawImage(
      video,
      0,
      0,
      sourceWidth,
      sourceHeight,
      paddingX,
      paddingY,
      resizedWidth,
      resizedHeight,
    );

    const results = await this.session.run({
      [this.inputName]: createInputTensor(workCanvas),
    });

    return decodePersonBoxes(
      results[this.outputName],
      scale,
      paddingX,
      paddingY,
      sourceWidth,
      sourceHeight,
    );
  }
}

export function loadPeopleDetector() {
  if (!detectorPromise) {
    // GitHub Pages is cross-origin-isolation-free, so use one WASM thread.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;

    detectorPromise = ort.InferenceSession.create(
      `${import.meta.env.BASE_URL}models/yolo11n.onnx`,
      {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      },
    ).then((session) => new PeopleDetector(session));
  }

  return detectorPromise;
}
