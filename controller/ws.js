module.exports = (io) => {
  const wsController = (message) => {
    // Handle messages from the frontend
    if (message === "stopRecording") {
      // Video recording has stopped
      const videoId = uuidv4();
      //   const outputPath = path.join(__dirname, "videos", `${videoId}.mp4`);

      // Concatenate video chunks
      const allChunks = videoChunks[ws.id] || [];
      const videoBuffer = Buffer.concat(allChunks);

      // Reset video chunks for this WebSocket connection
      delete videoChunks[ws.id];
    } else {
      // Handle video data from the frontend
      if (!videoChunks[ws.id]) {
        videoChunks[ws.id] = [];
      }
      videoChunks[ws.id].push(Buffer.from(message));
    }
  };

  return {
    wsController,
  };
};
