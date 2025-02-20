import { useState } from "react";
import axios from "axios";

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "http://35.170.242.201:5000"; // Your EC2 backend

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image) return alert("Please select an image");
    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(`${BACKEND_URL}/upload`, formData);
      setDetections(response.data.detections);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-xl font-bold mb-4">Scan Your Home Gym</h1>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="mb-3 file:mr-4 file:py-2 file:px-4 file:border-0
                   file:text-sm file:font-semibold file:bg-blue-500 file:text-white
                   hover:file:bg-blue-600"
      />

      {preview && (
        <div className="flex justify-center w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-[80vw] max-w-[250px] h-auto max-h-[180px] object-contain rounded-lg shadow-lg mb-3"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Detecting..." : "Detect Equipment"}
      </button>

      {detections.length > 0 && (
        <div className="mt-6 bg-white p-4 shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Detected Equipment:</h2>
          <ul className="list-disc pl-5">
            {detections.map((item, index) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
