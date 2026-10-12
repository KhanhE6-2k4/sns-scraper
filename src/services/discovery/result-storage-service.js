import fs from 'fs/promises';
import path from 'path';

export class ResultStorageService {
  constructor({ exportCreatorsCsv }) {
    this.exportCreatorsCsv = exportCreatorsCsv;
  }

  getResultsDirectory() {
    return path.join(
      process.cwd(),
      'data',
      'results'
    );
  }

  getResultsJsonPath() {
    return path.join(
      this.getResultsDirectory(),
      'results.json'
    );
  }

  getResultsCsvPath() {
    return path.join(
      this.getResultsDirectory(),
      'results.csv'
    );
  }

  async saveResults(videos) {
    const resultsDirectory = this.getResultsDirectory();

    await fs.mkdir(resultsDirectory, {
      recursive: true,
    });

    const jsonPath = this.getResultsJsonPath();
    const csvPath = this.getResultsCsvPath();

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

  async getResultsJson() {
    try {
      return await fs.readFile(
        this.getResultsJsonPath(),
        'utf8'
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(
          'Chưa có kết quả tìm kiếm để tải.'
        );
      }

      throw error;
    }
  }

  async getResultsCsv() {
    try {
      return await fs.readFile(
        this.getResultsCsvPath(),
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
