process.env.NODE_ENV !== "production" ? require("dotenv").config() : null;

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const fs = require("fs").promises;

const {
  uploadController,
  getUrlController,
  getVideoTranscriptController,
  actualWorker,
} = require("./controller");

const app = express();
const port = process.env.PORT || 3000;

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

mongoose
  .connect(process.env.DATABASE_URL, options)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// Set up Multer for handling video uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the route for uploading videos
app.post("/upload", upload.single("video"), uploadController);
app.get("/get-video-url/:videoId", getUrlController);
app.get("/get-transcript/:videoId", getVideoTranscriptController);
app.get("/docs/http", (req, res)=>{
  return res.redirect()
});
app.get("/docs/ws", (req, res)=> {
  return res.redirect
});

const videoChunks = {};

const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("websocket connected");
  socket.on("message", async (message) => {
    // Handle messages from the frontend
    if (message === "stopRecording") {
      // Video recording has stopped
      const videoId = uuidv4();

      // Concatenate video chunks
      const allChunks = videoChunks[socket.id] || [];
      const videoBuffer = Buffer.concat(allChunks);

      await actualWorker("test.mp4", videoBuffer);

      // Reset video chunks for this WebSocket connection
      delete videoChunks[socket.id];
    } else {
      // Handle video data from the frontend
      if (!videoChunks[socket.id]) {
        videoChunks[socket.id] = [];
      }
      videoChunks[socket.id].push(Buffer.from(message));
    }
  });

  socket.emit("connected", {
    message: `a new client connected with id of ${socket.id}`,
  });
});

// Start the Express server
httpServer.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
