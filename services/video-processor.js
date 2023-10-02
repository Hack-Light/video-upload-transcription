const ffmpeg = require("fluent-ffmpeg");

const processVideo = async (videoBuffer, outputPath, id) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoBuffer)
      .videoCodec("libx264")
      .toFormat("mp4")
      .on("end", () => {
        resolve({ outputPath, id });
      })
      .on("error", (err) => {
        reject(err);
      })
      .save(outputPath);
  });
};

module.exports = { processVideo };
