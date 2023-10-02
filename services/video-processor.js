const ffmpeg = require("fluent-ffmpeg");

const processVideo = async (videoBuffer) => {
  return new Promise((resolve, reject) => {
    const dataChunks = []; // Array to collect video data chunks

    const ffmpegCommand = ffmpeg()
      .input(videoBuffer)
      .videoCodec("libx264")
      .toFormat("mp4")
      .on("end", () => {
        // Concatenate all data chunks to create the final video buffer
        const videoDataBuffer = Buffer.concat(dataChunks);
        resolve(videoDataBuffer);
      })
      .on("error", (err) => {
        reject(err);
      })
      .toFormat("mp4")
      .pipe()
      .on("data", (chunk) => {
        // Collect video data chunks as they are processed
        dataChunks.push(chunk);
      });
  });
};

module.exports = { processVideo };
