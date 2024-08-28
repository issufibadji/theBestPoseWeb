import { AutoModel, AutoProcessor, RawImage } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

// Load model and processor
const model_id = 'Xenova/yolov8s-pose';
const model = await AutoModel.from_pretrained(model_id);
const processor = await AutoProcessor.from_pretrained(model_id);

const status = document.getElementById('status');
const fileUpload = document.getElementById('file-upload');
const imageContainer = document.getElementById('image-container');

fileUpload.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Set up a callback when the file is loaded
    reader.onload = async function(e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        image.style.maxWidth = '100%';
        imageContainer.appendChild(image);
        await estimatePose(image);
    };
    reader.readAsDataURL(file);
});

// Define common keypoint connections for drawing lines
const keypointConnections = [
    [5, 6], // shoulders
    [5, 7],
    [7, 9], // left arm
    [6, 8],
    [8, 10], // right arm
    [5, 11],
    [6, 12], // upper torso to hips
    [11, 12], // hips
    [11, 13],
    [13, 15], // left leg
    [12, 14],
    [14, 16], // right leg
];

// List of colors to differentiate each person
const colors = [
    'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'magenta'
];

// Estimate pose in the image
async function estimatePose(img) {
    status.textContent = 'Analysing...';

    const rawImage = await RawImage.read(img.src);
    const { pixel_values } = await processor(rawImage);

    const { output0 } = await model({ images: pixel_values });
    const permuted = output0[0].transpose(1, 0);

    const results = [];
    const [scaledHeight, scaledWidth] = pixel_values.dims.slice(-2);
    for (const [xc, yc, w, h, score, ...keypoints] of permuted.tolist()) {
        if (score < 0.3) continue;

        const x1 = (xc - w / 2) / scaledWidth * img.width;
        const y1 = (yc - h / 2) / scaledHeight * img.height;
        const x2 = (xc + w / 2) / scaledWidth * img.width;
        const y2 = (yc + h / 2) / scaledHeight * img.height;
        results.push({ x1, x2, y1, y2, score, keypoints });
    }

    const filteredResults = removeDuplicates(results, 0.5);
    renderResults(filteredResults, img, scaledWidth, scaledHeight);
    status.textContent = 'Ready';
}

function removeDuplicates(detections, iouThreshold) {
    const filteredDetections = [];

    for (const detection of detections) {
        let isDuplicate = false;
        let duplicateIndex = -1;
        let maxIoU = 0;

        for (let i = 0; i < filteredDetections.length; ++i) {
            const filteredDetection = filteredDetections[i];
            const iou = calculateIoU(detection, filteredDetection);
            if (iou > iouThreshold) {
                isDuplicate = true;
                if (iou > maxIoU) {
                    maxIoU = iou;
                    duplicateIndex = i;
                }
            }
        }

        if (!isDuplicate) {
            filteredDetections.push(detection);
        } else if (duplicateIndex !== -1 && detection.score > filteredDetections[duplicateIndex].score) {
            filteredDetections[duplicateIndex] = detection;
        }
    }

    return filteredDetections;
}

function calculateIoU(detection1, detection2) {
    const xOverlap = Math.max(0, Math.min(detection1.x2, detection2.x2) - Math.max(detection1.x1, detection2.x1));
    const yOverlap = Math.max(0, Math.min(detection1.y2, detection2.y2) - Math.max(detection1.y1, detection2.y1));
    const overlapArea = xOverlap * yOverlap;

    const area1 = (detection1.x2 - detection1.x1) * (detection1.y2 - detection1.y1);
    const area2 = (detection2.x2 - detection2.x1) * (detection2.y2 - detection2.y1);
    const unionArea = area1 + area2 - overlapArea;

    return overlapArea / unionArea;
}

// Render results on the image
function renderResults(results, img, scaledWidth, scaledHeight) {
    results.forEach(({ x1, y1, x2, y2, keypoints }, index) => {
        // Draw bounding box
        const boxElement = document.createElement('div');
        boxElement.className = 'bounding-box';
        Object.assign(boxElement.style, {
            left: `${x1}px`,
            top: `${y1}px`,
            width: `${x2 - x1}px`,
            height: `${y2 - y1}px`,
            borderColor: colors[index % colors.length],
        });
        imageContainer.appendChild(boxElement);

        // Draw keypoints and connections
        const points = [];
        for (let i = 0; i < keypoints.length; i += 3) {
            const [x, y, point_score] = keypoints.slice(i, i + 3);
            if (point_score < 0.3) continue;

            const keypointElement = document.createElement('div');
            keypointElement.className = 'keypoint';
            Object.assign(keypointElement.style, {
                left: `${(x / scaledWidth) * img.width}px`,
                top: `${(y / scaledHeight) * img.height}px`,
                width: '6px',
                height: '6px',
                backgroundColor: colors[index % colors.length],
                position: 'absolute',
                borderRadius: '50%',
            });
            imageContainer.appendChild(keypointElement);
            points.push({ x: (x / scaledWidth) * img.width, y: (y / scaledHeight) * img.height });
        }

        // Draw connections between keypoints
        keypointConnections.forEach(([start, end]) => {
            if (points[start] && points[end]) {
                const lineElement = document.createElement('div');
                lineElement.style.position = 'absolute';
                lineElement.style.backgroundColor = colors[index % colors.length];
                lineElement.style.height = '2px';

                const xDiff = points[end].x - points[start].x;
                const yDiff = points[end].y - points[start].y;
                const length = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                const angle = Math.atan2(yDiff, xDiff) * (180 / Math.PI);

                Object.assign(lineElement.style, {
                    left: `${points[start].x}px`,
                    top: `${points[start].y}px`,
                    width: `${length}px`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 0',
                });
                imageContainer.appendChild(lineElement);
            }
        });
    });
}