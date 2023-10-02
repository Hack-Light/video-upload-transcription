// queue.js
const { Worker, Queue } = require("bullmq");
const {
  waitForTranscriptionCompletion,
  handleUploadAndTranscription,
} = require("./aws");

let redisConnection = {
  host: "localhost",
  port: 6379,
};

// Create a BullMQ queue
const queue = new Queue("transcriptionQueue", {
  limiter: {
    max: 1, // Set the maximum number of concurrent jobs
  },
  defaultJobOptions: {
    removeOnComplete: true, // Remove completed jobs from the queue
  },
  connection: redisConnection,
});

// Create a worker to process tasks from the queue
const worker = new Worker(
  "transcriptionQueue",
  async (job) => {
    try {
      const { transcriptionJobName } = job.data;

      // Call the waitForTranscriptionCompletion function
      const result = await waitForTranscriptionCompletion(transcriptionJobName);

      if (result) {
        console.log("Transcription completed");
      } else {
        console.error("Transcription job failed or was canceled.");
      }
    } catch (error) {
      console.error("Error processing transcription:", error);
    }
  },
  { autorun: true, connection: redisConnection }
);

module.exports = { queue };
