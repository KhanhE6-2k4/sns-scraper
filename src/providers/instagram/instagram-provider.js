import { SocialPlatformProvider } from "../contracts/social-platform-provider.js";
import { normalizeInstagramPost } from "./instagram-normalizer.js";

export class InstagramProvider extends SocialPlatformProvider {
  constructor({ client }) {
    super();
    this.client = client;
  }

  getPlatform() {
    return 'instagram';
  }

  async discover(request) {
    const {
      queries = [],
      searchType = 'keyword',
      limit = 10,
      options = {},
    } = request;

    // Actor chỉ hỗ trợ tìm theo từ khóa.
    if (searchType !== 'keyword') {
      throw new Error(
        `Unsupported Instagram search type: ${searchType}`
      );
    }

    if (queries.length === 0) {
      throw new Error('Provide at least one search query');
    }

    return this.client.scrapeKeywords({
      queries,
      cookies: options.cookies,
      limit,
    });
  }

  normalize(item, context = {}) {
    return normalizeInstagramPost(item, context.query || item.query || '');
  }
}
