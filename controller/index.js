const { v4: uuidv4 } = require("uuid");
const util = require("util");

// Promisify fork
const forkAsync = util.promisify(fork);

const {
  waitForTranscriptionCompletion,
  handleUploadAndTranscription,
  generateVideoUrl,
} = require("../services/aws");
const { upload } = require("../services/video-upload");
const Video = require("../models/videos");
const { queue } = require("../services/queue");

exports.uploadController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    const { originalname, buffer } = req.file;

    let data = await this.actualWorker(originalname, buffer);

    res
      .status(200)
      .json({ message: "Video uploaded and transcription job started.", data });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the video." });
  }
};

exports.getUrlController = async (req, res) => {
  try {
    const { videoId } = req.params;

    const { transcript_url, video_url } = await Video.findById(videoId);

    res.json({ video_url, transcript_url });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the video URL." });
  }
};

exports.getVideoTranscriptController = async (req, res) => {
  try {
    const { videoId } = req.params;

    const { transcript_url } = await Video.findById(videoId);

    res.json({ transcript_url });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting video transcript." });
  }
};

exports.actualWorker = async (originalname, buffer) => {
  try {
    const videoId = uuidv4();
    let originalArr = originalname.split(".");
    let extention = originalArr[originalArr.length - 1] || "mov";

    const s3ObjectName = `${videoId}.${extention}`;

    const transcriptionJobName = `li-${videoId}`;

    const [uploadResult, transcriptionResult] = await Promise.all([
      upload(buffer, videoId), // Upload function
      handleUploadAndTranscription(
        originalname,
        buffer,
        videoId,
        transcriptionJobName
      ), // Transcription function
    ]);

    const url = uploadResult.secure_url;

    let data = await Video.create({
      key: s3ObjectName,
      transcriptionJobName: transcriptionJobName,
      bucketName: "test-by-east",
      video_url: url,
    });

    queue.add("transcription", {
      transcriptionJobName,
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

// i have not started using this
exports.newActualWorker = async (originalname, buffer) => {
  try {
    const videoId = uuidv4();
    let originalArr = originalname.split(".");
    let extention = originalArr[originalArr.length - 1] || "mp4";

    const s3ObjectName = `${videoId}.${extention}`;

    const transcriptionJobName = `li-${videoId}`;

    // Wrap the child process logic in a Promise
    const result = await new Promise(async (resolve, reject) => {
      try {
        // Create a new child process
        const child = await forkAsync(".../services/video-childprocess.js");

        // Send message to child process
        child.send(buffer);

        // Listen for message from child process
        child.on("message", async (message) => {
          const { successful, endPayload } = message;

          if (!successful) {
            reject(new Error("Unable to process video"));
            return;
          }

          const [uploadResult, transcriptionResult] = await Promise.all([
            upload(endPayload, videoId), // Upload function
            handleUploadAndTranscription(
              originalname,
              endPayload,
              videoId,
              transcriptionJobName
            ), // Transcription function
          ]);

          const url = uploadResult.secure_url;

          let data = await Video.create({
            key: s3ObjectName,
            transcriptionJobName: transcriptionJobName,
            bucketName: "test-by-east",
            video_url: url,
          });

          queue.add("transcription", {
            transcriptionJobName,
          });

          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });

    return result;
  } catch (error) {
    console.log(error);
  }
};
