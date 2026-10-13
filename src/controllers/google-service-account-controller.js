export class GoogleServiceAccountController {
  constructor({ googleServiceAccountSheetService }) {
    this.googleServiceAccountSheetService =
      googleServiceAccountSheetService;

    this.validateSheet = this.validateSheet.bind(this);
    this.exportResults = this.exportResults.bind(this);
  }

  async validateSheet(req, res) {
    try {
      const { spreadsheetUrl } = req.body;

      if (
        typeof spreadsheetUrl !== 'string' ||
        !spreadsheetUrl.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập URL Google Sheet.',
        });
      }

      const result =
        await this.googleServiceAccountSheetService
          .validateSheet(spreadsheetUrl.trim());

      return res.status(200).json({
        success: true,
        message: 'Truy cập Google Sheet thành công.',
        ...result,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportResults(req, res) {
    try {
      const { spreadsheetUrl, platform, jobId } = req.body;

      if (
        typeof spreadsheetUrl !== 'string' ||
        !spreadsheetUrl.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập URL Google Sheet.',
        });
      }

      // Dùng Service Account, không phụ thuộc phiên đăng nhập.
      const result =
        await this.googleServiceAccountSheetService
          .writeResults(spreadsheetUrl.trim(), platform, jobId);

      return res.status(200).json({
        success: true,
        message: 'Export Google Sheets thành công.',
        ...result,
      });
    } catch (error) {
      console.error(
        'Google Service Account export failed:',
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
