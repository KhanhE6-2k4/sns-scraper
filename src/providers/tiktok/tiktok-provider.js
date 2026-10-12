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

  async discover(criteria) {
    const {
      queries,
      searchType,
      dateFrom,
      dateTo,
      limit = 10,
      sortBy = 'relevance'
    } = criteria;

    const searchOptions = {
      dateFrom,
      dateTo,
      limit,
      sortBy
    };

    if (searchType === 'hashtag') {
      return this.client.scrapeHashtags({
        hashtags: queries,
        dateFrom,
        dateTo,
        limit,
        sortBy
      });
    }

    if (searchType === 'keyword') {
      return this.client.scrapeKeywords({
        queries,
        dateFrom,
        dateTo,
        limit,
        sortBy
      });
    }

    if (searchType === 'all') {
      const keywordLimit = Math.ceil(limit / 2);
      const hashtagLimit = Math.ceil(limit / 2);

      const [keywordResults, hashtagResults] = await Promise.all([
        this.client.scrapeKeywords({
          queries,
          ...searchOptions,
          limit: keywordLimit
        }),
        this.client.scrapeHashtags({
          hashtags: queries,
          ...searchOptions,
          limit: hashtagLimit
        })
      ]);

      return [
        ...keywordResults,
        ...hashtagResults
      ];
    }

    throw new Error(
      `Unsupported TikTok search type: ${searchType}`
    );
  }

  normalize(item, context = {}) {
    return normalizeTikTokVideo(item, context.keyword ?? item.searchQuery ?? '');
  }
}
