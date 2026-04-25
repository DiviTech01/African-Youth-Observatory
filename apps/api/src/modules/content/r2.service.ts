import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface R2HealthReport {
  configured: boolean;
  reachable: boolean;
  bucket: string | null;
  publicUrl: string | null;
  reason?: string;
  missingVars?: string[];
}

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private client: S3Client | null = null;
  private bucket: string;
  private publicBase: string;
  private missingVars: string[] = [];

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET ?? '';
    this.publicBase = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

    const missing: string[] = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    if (!this.bucket) missing.push('R2_BUCKET');
    if (!this.publicBase) missing.push('R2_PUBLIC_URL');
    this.missingVars = missing;

    if (missing.length) {
      this.logger.warn(
        `R2 env vars missing (${missing.join(', ')}). Image uploads will fail until configured.`,
      );
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async health(): Promise<R2HealthReport> {
    if (!this.client) {
      return {
        configured: false,
        reachable: false,
        bucket: this.bucket || null,
        publicUrl: this.publicBase || null,
        reason: 'Missing env vars',
        missingVars: this.missingVars,
      };
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return {
        configured: true,
        reachable: true,
        bucket: this.bucket,
        publicUrl: this.publicBase,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        configured: true,
        reachable: false,
        bucket: this.bucket,
        publicUrl: this.publicBase,
        reason: message,
      };
    }
  }

  async uploadImage(file: Express.Multer.File, prefix = 'cms'): Promise<{ url: string; key: string }> {
    if (!this.client) {
      throw new InternalServerErrorException('R2 is not configured on this server');
    }
    if (!file || !file.buffer) {
      throw new InternalServerErrorException('No file buffer received');
    }

    const ext = extname(file.originalname || '').toLowerCase() || '.bin';
    const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return { url: `${this.publicBase}/${key}`, key };
  }
}
