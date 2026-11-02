import { SocialPlatformProvider } from "../contracts/social-platform-provider.js";
import { MAX_PARALLEL_RUNS } from '../../config/apify.js';
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

      // Hai nhánh chạy song song nên chia đôi số run để tổng không vượt MAX_PARALLEL_RUNS.
      const keywordRuns = Math.ceil(MAX_PARALLEL_RUNS / 2);
      const hashtagRuns = Math.max(1, MAX_PARALLEL_RUNS - keywordRuns);

      const [keywordResults, hashtagResults] = await Promise.all([
        keywordLimit > 0
          ? this.client.scrapeKeywords({
              queries,
              ...searchOptions,
              limit: keywordLimit,
              maxParallelRuns: keywordRuns,
            })
          : Promise.resolve([]),

        hashtagLimit > 0
          ? this.client.scrapeHashtags({
              hashtags: queries,
              ...searchOptions,
              limit: hashtagLimit,
              maxParallelRuns: hashtagRuns,
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
    return normalizeTikTokVideo(item, context.query ?? '');
  }
}
