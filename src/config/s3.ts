import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_BUCKET_NAME || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
};

let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }
  return _s3Client;
}

function buildS3Upload(folder: string, maxSize: number) {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production' || env === 'staging') {
    return multer({
      storage: multerS3({
        s3: getS3Client(),
        bucket: s3Config.bucket,
        metadata: (_req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (_req, file, cb) => {
          const filename = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, `${folder}/${filename}`);
        },
      }),
      limits: { fileSize: maxSize },
    });
  }

  // Local development: store in /tmp/uploads
  return multer({
    storage: multer.diskStorage({
      destination: `/tmp/uploads/${folder}`,
      filename: (_req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: maxSize },
  });
}

export const documentUpload = buildS3Upload('documents', 5 * 1024 * 1024);
export const imageUpload = buildS3Upload('images', 3 * 1024 * 1024);
export const materialUpload = buildS3Upload('materials', 30 * 1024 * 1024);
