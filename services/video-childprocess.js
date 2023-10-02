const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { processVideo } = require("./video-processor");

process.on("message", async (payload) => {
  const { buffer, name } = payload;

  const endProcess = ({ successful, endPayload }) => {
    // Format response so it fits the api response
    process.send({ successful, endPayload });
    // End process
    process.exit();
  };

  try {
    let compressedBuffer = await processVideo(buffer);
    endProcess({ successful: true, endPayload: compressedBuffer });
  } catch (error) {
    endProcess({ successful: false, endPayload: null });
  }
});
