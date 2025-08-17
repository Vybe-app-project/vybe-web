import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.REACT_APP_S3_ACCESS_KEY,
  secretAccessKey: process.env.REACT_APP_S3_SECRET_KEY,
  region: process.env.REACT_APP_S3_REGION,
});

const s3 = new AWS.S3();

export default s3;