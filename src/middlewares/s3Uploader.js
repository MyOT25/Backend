import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer 설정 (메모리에 파일 저장)
const storage = multer.memoryStorage();

/**
 * S3 업로드 미들웨어
 * @param {Object} options
 * @param {Number} [options.maxSizeMB] - 최대 파일 크기(MB)
 */
export const s3Uploader = ({ maxSizeMB = 20 } = {}) =>
  multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 }, // MB → Byte
  }).single("image");

// 실제 S3 업로드 함수
export const uploadToS3 = async (fileBuffer, originalName, mimeType) => {
  const uniqueName =
    crypto.randomUUID() + path.extname(originalName);

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: uniqueName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueName}`;
  return imageUrl;
};
