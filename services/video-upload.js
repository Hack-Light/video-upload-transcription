const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
});

exports.upload = async (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "video",
          public_id: originalName,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(fileBuffer);
  });
};
