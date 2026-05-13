import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, s3Config } from '../config/s3';

export function createUuidFilename(originalName: string): string {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
}

export async function deleteFileFromS3(key: string): Promise<void> {
  const client: S3Client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    }),
  );
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export function getMediaUrl(key: string): string {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }
  if (env === 'staging') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const bucket = process.env.SUPABASE_BUCKET || 'media';
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;
  }
  return `/media/${key}`;
}
