import { SocialPlatformProvider } from "../contracts/social-platform-provider.js";
import { normalizeTikTokVideo } from "./tiktok-normalizer.js";

export class TikTokProvider extends SocialPlatformProvider {
  constructor({ client }) {
    super();
    this.client = client;
  }

  getPlatform() {
    return 'tiktok';
  }

  async discover(request) {
    const {
      queries,
      searchType,
      dateRange,
      limit = 10,
      sortBy = 'relevance'
    } = request;

    const searchOptions = {
      dateRange,
      limit,
      sortBy
    };

    if (searchType === 'hashtag') {
      return this.client.scrapeHashtags({
        hashtags: queries,
        ...searchOptions,
      });
    }

    if (searchType === 'keyword') {
      return this.client.scrapeKeywords({
        queries,
        ...searchOptions,
      });
    }

    if (searchType === 'all') {
      const keywordLimit = Math.floor(limit / 2);
      const hashtagLimit = limit - keywordLimit;

      const [keywordResults, hashtagResults] = await Promise.all([
        keywordLimit > 0
          ? this.client.scrapeKeywords({
              queries,
              ...searchOptions,
              limit: keywordLimit,
            })
          : Promise.resolve([]),

        hashtagLimit > 0
          ? this.client.scrapeHashtags({
              hashtags: queries,
              ...searchOptions,
              limit: hashtagLimit,
            })
          : Promise.resolve([]),
      ]);

      return [
        ...keywordResults,
        ...hashtagResults,
      ].slice(0, limit);
    }

    throw new Error(
      `Unsupported TikTok search type: ${searchType}`
    );
  }

  normalize(item, context = {}) {
    return normalizeTikTokVideo(item, context.keyword ?? item.searchQuery ?? '');
  }
}
