const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    transcript_url: {
      type: String,
      required: false,
      default: null,
    },
    transcriptionJobName: {
      type: String,
      required: true,
    },
    bucketName: {
      type: String,
      required: true,
    },
    video_url: {
      type: String,
      required: true,
    },
    
  },

  { timestamps: true }
);

module.exports = mongoose.model("video", videoSchema);
