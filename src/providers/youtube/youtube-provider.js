
import { SocialPlatformProvider } from '../contracts/social-platform-provider.js';
import { normalizeYouTubeVideo } from './youtube-normalizer.js';

export class YouTubeProvider extends SocialPlatformProvider {
  constructor({ client }) {
    super();
    this.client = client;
  }

  getPlatform() {
    return 'youtube';
  }

  async discover(request) {
    const {
      queries = [],
      searchType = 'keyword',
      limit = 10,
      sortBy = 'relevance',
      dateRange = 'all',
    } = request;

    // if (!['keyword', 'hashtag'].includes(searchType)) {
    //   throw new Error(
    //     `Unsupported YouTube search type: ${searchType}`
    //   );
    // }
    if (searchType !== 'keyword') {
        throw new Error(
          `Unsupported YouTube search type: ${searchType}`
        );
    }

    if (queries.length === 0) {
      throw new Error('Provide at least one search query');
    }

    return this.client.scrape({
      queries,
      limit,
      sortBy,
      dateRange,
    });
  }

  normalize(item, context = {}) {
    return normalizeYouTubeVideo(
      item,
      context.keyword ?? item.sourceInput ?? ''
    );
  }
}
