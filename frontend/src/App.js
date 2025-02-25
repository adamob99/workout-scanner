// Updated App.js to display all detections and log data for debugging
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const BACKEND_URL = "https://9ec5-2604-3d08-467f-e440-fdb5-605b-232b-76aa.ngrok-free.app";

function App() {
  const videoRef = useRef(null);
  const [detectedItems, setDetectedItems] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Start camera on component mount
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Camera access error:', error);
        setErrorMessage('Camera access failed. Please check permissions.');
      }
    }
    startCamera();
  }, []);

  // Send frame every 2 seconds for detection
  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        const sessionId = Date.now().toString();

        try {
          const response = await fetch(`${BACKEND_URL}/detect-frame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, sessionId }),
          });

          const data = await response.json();
          console.log('Detected Items:', data.detectedItems);
          console.log('All Labels:', data.allLabels);
          setDetectedItems(data.detectedItems);
          setAllLabels(data.allLabels);
        } catch (error) {
          console.error('Error sending frame:', error);
          setErrorMessage('Failed to send frame for detection.');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>🏋️‍♂️ Real-Time Gym Equipment Detection</h1>

      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', borderRadius: '10px', marginTop: '20px' }}
      />

      <div className="detections">
        <h2>Detected Gym Equipment:</h2>
        {detectedItems.length > 0 ? (
          <ul>
            {detectedItems.map((item, index) => (
              <li key={index}>{`${item.name} - Confidence: ${item.confidence}`}</li>
            ))}
          </ul>
        ) : (
          <p>No specific gym equipment detected yet.</p>
        )}
      </div>

    
    </div>
  );
}

export default App;
