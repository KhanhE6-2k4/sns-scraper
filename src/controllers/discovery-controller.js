import { DiscoveryRequest } from '../dto/discovery-request.js';
export class DiscoveryController {
  constructor({ discoveryService, resultStorageService, jobSlotService }) {
    this.discoveryService = discoveryService;
    this.resultStorageService = resultStorageService;
    this.jobSlotService = jobSlotService;
  }


  discover = async (req, res) => {
    let slot = null;
    try {
      // const userId = req.session.userId;

      // if (!userId) {
      //   return res.status(401).json({
      //     error: 'Unauthorized',
      //   });
      // }
      const request = new DiscoveryRequest(req.body);

      // 1. Lấy slot trước khi chạy discovery.
      slot = await this.jobSlotService.acquireSlot(
        request.platform,
        req.body,
      );

      // 2. Nếu không còn slot thì từ chối xử lý request
      if (!slot) {
        return res.status(429).json({
          success: false,
          code: 'PLATFORM_CONCURRENCY_LIMIT',
          message: `Nền tảng ${request.platform} đã tới giới hạn. Vui lòng thử lại sau.`
        });
      }

      // 3. Chạy logic discovey
      const videos = await this.discoveryService.discover(request);

      // const result = await this.resultStorageService.saveResults(userId, videos);
      // 4. Lưu kết quả theo jobId
      const result = await this.resultStorageService.saveResults(
        request.platform,
        slot.jobId,
        videos
      );

      // 5. Đánh dấu hoàn thành sau khi lưu kết quả.
      await this.jobSlotService.completeJob(
        slot.platform,
        slot.slotNumber,
        slot.jobId,
        {
          resultCount: videos.length,
          creatorCount: result.creatorCount,
        },
      );

      return res.json({
        success: true,
        jobId: slot.jobId,
        platform: slot.platform,
        count: videos.length,
        creatorCount: result.creatorCount,
        downloads: {
          json: `/api/download/${slot.platform}/` + `${slot.jobId}/results.json`,
          csv: `/api/download/${slot.platform}/` + `${slot.jobId}/results.csv`,
        },
        videos,
      });
    } catch (error) {
      console.error('Discovery error:', error);
      // Không để lỗi cập nhật trạng thái che mất lỗi gốc.
      if (slot) {
        console.error('Job failed:', {
          platform: slot.platform,
          slotNumber: slot.slotNumber,
          jobId: slot.jobId,
          error: error.message,
          stack: error.stack,
        });
        try {
          await this.jobSlotService.failJob(
            slot.platform,
            slot.slotNumber,
            slot.jobId,
            error,
          );
        } catch (statusError) {
          console.error(
            'Failed to update job status:',
            statusError,
          );
        }
      }
      return res.status(500).json({
        success: false,
        jobId: slot?.jobId,
        error: error.message || 'Discovery failed',
      });
    }
  };
}
