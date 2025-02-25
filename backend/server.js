// Updated server.js with lower confidence threshold and broader keyword detection
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });
const upload = multer();

// Expanded gym equipment detection list
const gymEquipmentList = [
  'Bench Press', 'Treadmill', 'Gym Weights', 'Dumbbell', 'Barbell',
  'Squat Rack', 'Kettlebell', 'Resistance Band', 'Rowing Machine', 'Weight Plate',
  'Exercise Bike', 'Lat Pulldown Machine', 'Cable Crossover', 'Smith Machine',
  'Gym', 'Fitness', 'Sport', 'Workout', 'Exercise', 'Bodybuilding'
];

// Detection endpoint
app.post('/detect-frame', upload.none(), async (req, res) => {
  const { imageBase64, sessionId } = req.body;
  if (!imageBase64 || !sessionId) {
    return res.status(400).json({ message: 'Missing image data or session ID.' });
  }

  const imageBuffer = Buffer.from(imageBase64, 'base64');

  try {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBuffer },
      MaxLabels: 20,
      MinConfidence: 20 // Lowered threshold for more detections
    });

    const response = await rekognition.send(command);
    console.log("Full Rekognition Response:", response.Labels);

    // Filter detections for gym equipment and include confidence
    const detections = response.Labels.filter(label =>
      gymEquipmentList.includes(label.Name)
    ).map(label => ({
      name: label.Name,
      confidence: `${label.Confidence.toFixed(2)}%`
    }));

    // Send back all detections for testing
    res.json({
      detectedItems: detections,
      allLabels: response.Labels.map(label => ({
        name: label.Name,
        confidence: `${label.Confidence.toFixed(2)}%`
      }))
    });
  } catch (error) {
    console.error('Detection Error:', error);
    res.status(500).json({ message: 'Error processing image.' });
  }
});

// Start the server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
