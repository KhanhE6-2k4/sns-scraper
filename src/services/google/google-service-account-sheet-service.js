
import { createGoogleServiceAccountClient } from '../../integrations/google/google-service-account-client.js';

export class GoogleServiceAccountSheetService {
  constructor({ resultStorageService }) {
    this.resultStorageService = resultStorageService;
  }

  extractSpreadsheetId(spreadsheetUrl) {
    try {
      const url = new URL(spreadsheetUrl);

      if (
        url.protocol !== 'https:' ||
        !['docs.google.com', 'www.docs.google.com'].includes(url.hostname)
      ) {
        throw new Error('Invalid Google Sheets URL');
      }

      const match = url.pathname.match(
        /^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/
      );

      if (!match) {
        throw new Error('Invalid spreadsheet ID');
      }

      return match[1];
    } catch {
      throw new Error('URL Google Sheet không hợp lệ.');
    }
  }

  createSheetsClient() {
    return createGoogleServiceAccountClient();
  }

  getGoogleErrorStatus(error) {
    return error?.code ?? error?.response?.status;
  }

  handleGoogleError(error) {
    const status = this.getGoogleErrorStatus(error);

    if (status === 401) {
      throw new Error('Credentials không hợp lệ.');
    }

    if (status === 403) {
      throw new Error(
        'Không có quyền truy cập Google Sheet. Hãy chia sẻ Sheet với quyền Editor.'
      );
    }

    if (status === 404) {
      throw new Error(
        'Không tìm thấy Google Sheet. Hãy kiểm tra lại URL.'
      );
    }

    throw new Error('Không thể thao tác với Google Sheet.');
  }

  async validateSheet(spreadsheetUrl) {
    const spreadsheetId =
      this.extractSpreadsheetId(spreadsheetUrl);

    const sheets = this.createSheetsClient();

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'spreadsheetId,properties.title',
      });

      return {
        valid: true,
        spreadsheetId,
        title: response.data.properties?.title || '',
      };
    } catch (error) {
      this.handleGoogleError(error);
    }
  }

  createSheetTitle() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(now);

    const values = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}_${values.hour}-${values.minute}-${values.second}`;
  }

  parseCsv(csv) {
    const rows = [];
    let row = [];
    let value = '';
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];

      if (char === '"') {
        if (insideQuotes && csv[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }

        continue;
      }

      if (char === ',' && !insideQuotes) {
        row.push(value);
        value = '';
        continue;
      }

      if (
        (char === '\n' || char === '\r') &&
        !insideQuotes
      ) {
        if (char === '\r' && csv[i + 1] === '\n') {
          i++;
        }

        row.push(value);
        value = '';

        if (row.some(cell => cell !== '')) {
          rows.push(row);
        }

        row = [];
        continue;
      }

      value += char;
    }

    if (value.length > 0 || row.length > 0) {
      row.push(value);

      if (row.some(cell => cell !== '')) {
        rows.push(row);
      }
    }

    return rows;
  }

  async writeResults(spreadsheetUrl) {
    const spreadsheetId =
      this.extractSpreadsheetId(spreadsheetUrl);

    // Đọc CSV từ thư mục kết quả dùng chung, không cần userId.
    const csv =
      await this.resultStorageService.getResultsCsv();

    if (typeof csv !== 'string' || !csv.trim()) {
      throw new Error('Không có dữ liệu CSV để export.');
    }

    const rows = this.parseCsv(csv);

    if (rows.length === 0) {
      throw new Error('Không có dữ liệu để export.');
    }

    const sheets = this.createSheetsClient();
    const sheetTitle = this.createSheetTitle();

    let sheetId;

    try {
      const createResponse =
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetTitle,
                  },
                },
              },
            ],
          },
        });

      sheetId =
        createResponse.data.replies?.[0]?.addSheet
          ?.properties?.sheetId;

      if (sheetId === undefined) {
        throw new Error(
          'Không thể tạo tab mới trong Google Sheet.'
        );
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetTitle}'!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });
    } catch (error) {
      if (
        error.message ===
        'Không thể tạo tab mới trong Google Sheet.'
      ) {
        throw error;
      }

      this.handleGoogleError(error);
    }

    // Giữ nguyên cấu trúc kết quả như service cũ.
    return {
      spreadsheetId,
      sheetId,
      sheetTitle,
      rowCount: rows.length,
      creatorCount: Math.max(0, rows.length - 1),
    };
  }
}
