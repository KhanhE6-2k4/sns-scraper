import fs from 'fs/promises';
import path from 'path';
import { isSupportedPlatform } from '../../config/platforms.js';

export class ResultStorageService {
  constructor({ exportCreatorsCsv }) {
    this.exportCreatorsCsv = exportCreatorsCsv;
  }

  getResultsDirectory(platform, jobId) {
    if (!isSupportedPlatform(platform)) {
      throw new Error(
        `Unsupported platform: ${JSON.stringify(platform)}`
      );
    }

    return path.join(
      process.cwd(),
      'data',
      'results',
      platform,
      jobId,
    );
  }

  getResultsJsonPath(platform, jobId) {
    return path.join(
      this.getResultsDirectory(platform, jobId),
      'results.json'
    );
  }

  getResultsCsvPath(platform, jobId) {
    return path.join(
      this.getResultsDirectory(platform, jobId),
      'results.csv'
    );
  }

  async saveResults(platform, jobId, videos) {
    const resultsDirectory = this.getResultsDirectory(platform, jobId);

    await fs.mkdir(resultsDirectory, {
      recursive: true,
    });

    const jsonPath = this.getResultsJsonPath(platform, jobId);
    const csvPath = this.getResultsCsvPath(platform, jobId);

    await fs.writeFile(
      jsonPath,
      JSON.stringify(videos, null, 2),
      'utf8'
    );

    const csvResult = await this.exportCreatorsCsv(
      videos,
      csvPath
    );

    return {
      jsonPath,
      csvPath,
      creatorCount: csvResult.creatorCount,
    };
  }

  async getResultsJson(platform, jobId) {
    try {
      return await fs.readFile(
        this.getResultsJsonPath(platform, jobId),
        'utf8'
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(
          `Chưa có kết quả tìm kiếm cho ${platform}.`
        );
      }

      throw error;
    }
  }

  async getResultsCsv(platform, jobId) {
    try {
      return await fs.readFile(
        this.getResultsCsvPath(platform, jobId),
        'utf8'
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(
          'Chưa có kết quả tìm kiếm để export.'
        );
      }

      throw error;
    }
  }
}
