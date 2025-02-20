require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// AWS SDK v3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

// **Updated List to Include Mapped Items**
const WORKOUT_ITEMS = [
  "Dumbbells / Barbells", "Dumbbell", "Barbell", "Kettlebell", "Treadmill", "Weight Bench",
  "Squat Rack", "Leg Press Machine", "Resistance Band", "Exercise Bike", "Rowing Machine",
  "Pull-up Bar", "Workout Machine", "Strength Equipment", "Bench Press", "Plates",
  "Barbell Rack", "Dumbbell Rack", "Home Gym"
];

// **Mapping AWS Rekognition Labels to Actual Gym Equipment**
const LABEL_MAPPING = {
  "Gym Weights": "Dumbbells / Barbells",
  "Dead Lift": "Barbell",
  "Bicep Curls": "Dumbbells",
  "Bench Press": "Weight Bench",
  "Squat": "Squat Rack",
  "Leg Press": "Leg Press Machine",
  "Rowing Machine": "Rowing Machine",
};

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 Received file:', req.file);

    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload image to S3
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    console.log('⬆️ Uploading to S3...');
    await s3.send(new PutObjectCommand(s3Params));
    console.log('✅ Image uploaded to S3:', s3Params.Key);

    // Call AWS Rekognition
    const rekogParams = {
      Image: { S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: s3Params.Key } },
      MaxLabels: 30,  // Increased label limit for broader detection
      MinConfidence: 35,  // Lowered confidence to detect smaller objects
    };

    console.log('🔍 Calling Rekognition...');
    const rekogResponse = await rekognition.send(new DetectLabelsCommand(rekogParams));

    // Extract detected labels with confidence scores
    const detectedItems = rekogResponse.Labels.map(label => ({
      name: LABEL_MAPPING[label.Name] || label.Name, // Map detected labels to gym equipment
      confidence: label.Confidence.toFixed(2) + "%",
    }));

    console.log("🔎 FULL REKOGNITION RESPONSE:", JSON.stringify(detectedItems, null, 2));

    // Strictly filter only known workout items & remove "Fitness" and "Gym"
    const filteredItems = detectedItems
      .filter(item => WORKOUT_ITEMS.includes(item.name) && !["Fitness", "Gym"].includes(item.name))
      .map(item => `${item.name} (${item.confidence})`);

    console.log("🎯 Final Filtered Equipment:", filteredItems);

    // Send final response to frontend
    res.json({ detections: filteredItems });

  } catch (error) {
    console.error('❌ Error processing image:', error);
    res.status(500).json({ message: 'Error processing image', error: error.message });
  }
});

app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
