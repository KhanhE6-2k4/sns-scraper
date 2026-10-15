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
      queries,
      searchType,
      dateRange,
      limit = 10,
    } = request;

    const searchOptions = {
      dateRange,
      limit,
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
            limit: keywordLimit
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
      `Unsupported Instagram search type: ${searchType}`
    );
  }

  normalize(item, context = {}) {
    return normalizeInstagramPost(item, context.keyword ?? item.searchQuery ?? '');
  }
}
