import { DiscoveryRequest } from '../dto/discovery-request.js';
export class DiscoveryController {
  constructor({ discoveryService, resultStorageService }) {
    this.discoveryService = discoveryService;
    this.resultStorageService = resultStorageService;
  }


  discover = async (req, res) => {
    try {
      // const userId = req.session.userId;

      // if (!userId) {
      //   return res.status(401).json({
      //     error: 'Unauthorized',
      //   });
      // }
      const request = new DiscoveryRequest(req.body);

      const videos = await this.discoveryService.discover(request);

      // const result = await this.resultStorageService.saveResults(userId, videos);
      const result = await this.resultStorageService.saveResults(videos);

      return res.json({
        success: true,
        count: videos.length,
        creatorCount: result.creatorCount,
        downloads: {
          json: '/api/download/results.json',
          csv: '/api/download/results.csv',
        },
        videos,
      });
    } catch (error) {
      console.error('Discovery error:', error);
      return res.status(500).json({
        error: error.message || 'Discovery failed',
      });
    }
  };
}
