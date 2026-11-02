import { SocialPlatformProvider } from '../contracts/social-platform-provider.js';
import { normalizeFacebookPage } from './facebook-normalizer.js';

export class FacebookProvider extends SocialPlatformProvider {
  constructor({ client }) {
    super();
    this.client = client;
  }

  getPlatform() {
    return 'facebook';
  }

  async discover(request) {
    const {
      queries = [],
      searchType = 'keyword',
      limit = 10,
    } = request;

    // Actor chỉ hỗ trợ tìm theo từ khóa (chế độ pages).
    if (searchType !== 'keyword') {
      throw new Error(
        `Unsupported Facebook search type: ${searchType}`
      );
    }

    if (queries.length === 0) {
      throw new Error('Provide at least one search query');
    }

    return this.client.scrapeKeywords({
      queries,
      limit,
    });
  }

  normalize(item, context = {}) {
    return normalizeFacebookPage(item, context.query || item.query || '');
  }
}
