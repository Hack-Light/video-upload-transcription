const {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PresignGetObjectCommand,
} = require("@aws-sdk/client-s3");

const Video = require("../models/videos");

// proper aws bucket
const tFetchConfig = {
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  region: "us-east-1",
};

// Configure AWS and create S3 and Transcribe clients
const s3 = new S3Client(tFetchConfig);
const transcribeClient = new TranscribeClient(tFetchConfig);

exports.handleUploadAndTranscription = async (
  originalname,
  buffer,
  videoId,
  transcriptionJobName
) => {
  try {
    let originalArr = originalname.split(".");
    let extention = originalArr[originalArr.length - 1];

    const s3BucketName = "test-by-east";
    const s3ObjectName = `${videoId}.${extention}`;

    const params = {
      Bucket: s3BucketName,
      Key: s3ObjectName,
      Body: buffer,
    };

    await s3.send(new PutObjectCommand(params));

    // Start the transcription job asynchronously
    const transcribeParams = {
      TranscriptionJobName: transcriptionJobName,
      LanguageCode: "en-US", // Change to the appropriate language code
      MediaFormat: "mp4", // Change to match your video format
      Media: {
        MediaFileUri: `s3://${s3BucketName}/${s3ObjectName}`,
      },
    };

    const transcriptionResponse = await transcribeClient.send(
      new StartTranscriptionJobCommand(transcribeParams)
    );

    return transcriptionResponse;
  } catch (error) {
    console.log(error);
  }
};

exports.waitForTranscriptionCompletion = async (jobName) => {
  while (true) {
    const response = await transcribeClient.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );

    const { TranscriptionJobStatus, Transcript, TranscriptionJobName } =
      response.TranscriptionJob;
    if (TranscriptionJobStatus === "COMPLETED") {
      let d = await Video.findOne({
        transcriptionJobName: TranscriptionJobName,
      });
      d.transcript_url = Transcript.TranscriptFileUri;
      await d.save();
      console.log(`${TranscriptionJobName} has finished running`);
      return Transcript.TranscriptFileUri;
    } else if (
      TranscriptionJobStatus === "FAILED" ||
      TranscriptionJobStatus === "CANCELED"
    ) {
      return null;
    }

    // Wait for a moment before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
  }
};
