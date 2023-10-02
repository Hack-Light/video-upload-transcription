const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { startJobs } = require("./services/worker");

const app = express();
const port = 3000;

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

(async () => {
  // Start the worker and get the queueInstance asynchronously
  const { queueInstance } = await startJobs();

  // Endpoint for video uploads and processing
  app.post("/upload", upload.single("video"), async (req, res) => {
    try {
      const videoId = uuidv4();
      const videoBuffer = req.file.buffer;
      const outputPath = `./videos/video-${videoId}.mp4`; // Define the output path

      // Enqueue video processing job
      await queueInstance.enqueue("video_processing", "processVideo", [
        videoBuffer,
        outputPath,
        videoId,
      ]);

      res.json({ message: "Video processing job enqueued." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred during video processing." });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})();
