import fs from 'fs/promises';
import path from 'path';
import { query } from '../../db/index.js';

const ALLOWED_PLATFORMS = [
  'tiktok',
  'instagram',
  'youtube',
];

const ALLOWED_FILES = {
  'results.json': 'results.json',
  'results.csv': 'results.csv',
};

export class DownloadService {
  getAllowedPlatform(platform) {
    return ALLOWED_PLATFORMS.includes(platform)
      ? platform
      : null;
  }
  getAllowedFile(fileName) {
    return ALLOWED_FILES[fileName] ?? null;
  }


  isValidUuid(jobId) {
    return typeof jobId === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId);
  }

  async getFilePath(platform, jobId, fileName) {
    const safePlatform = this.getAllowedPlatform(platform);
    const safeFileName = this.getAllowedFile(fileName);
    const validUuid = this.isValidUuid(jobId);

    console.log('[Download validation]', {
      platform,
      jobId,
      fileName,
      safePlatform,
      safeFileName,
      validUuid,
    });

    if (!safePlatform || !safeFileName || !validUuid) {
      throw new Error(
        `Invalid download parameters: platform=${platform}, jobId=${jobId}, file=${fileName}`
      );
    }

    // Chỉ cho phép tải file thuộc một trong các slot đã đăng ký.
    const result = await query(
      `SELECT 1
        FROM discovery_job_slots
        WHERE platform = $1
          AND job_id = $2::uuid`,
      [safePlatform, jobId],
    );

    console.log('[Download DB result]', {
      rowCount: result.rowCount,
      rows: result.rows,
    });

    if (result.rowCount === 0) {
      throw new Error('File not found!');
    }

    const filePath = path.join(
      process.cwd(),
      'data',
      'results',
      safePlatform,
      jobId,
      safeFileName
    );

    console.log('[Download resolved path]', filePath);

    return filePath;
  }

  async ensureFileExist(filePath) {
    try {
      await fs.access(filePath);
      console.log('[Download file exists]', filePath);
    } catch (error) {
      console.error('[Download file access failed]', {
        filePath,
        code: error.code,
      });

      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }

      throw error;
    }
  }

  async getDownloadInfo(platform, jobId, fileName) {
    const safePlatform = this.getAllowedPlatform(platform);
    const safeFileName = this.getAllowedFile(fileName);

    if (!safePlatform || !safeFileName) {
      throw new Error('File not found!');
    }

    const filePath = await this.getFilePath(
      safePlatform,
      jobId,
      safeFileName
    );

    await this.ensureFileExist(filePath);

    return {
      filePath,
      fileName: safeFileName,
    };
  }
}
