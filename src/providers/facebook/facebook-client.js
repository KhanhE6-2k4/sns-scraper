// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'scrapesmith/facebook-search-scraper';

// Actor không hỗ trợ hashtag, sort và lọc thời gian.
// Dùng chế độ pages vì output posts không có thông tin creator (profileUrl, isVerified, followers).
const SEARCH_TYPE = 'pages';

export class FacebookClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  async scrapeKeywords({
    queries,
    limit = 10,
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-empty array');
    }

    const input = {
      queries,
      searchType: SEARCH_TYPE,
      maxResultsPerQuery: Math.ceil(limit / queries.length),
    };

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input, limit);
  }

  async #runActor(input, limit) {
    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    // Actor giới hạn theo từng query (và có thể trả dư) nên cắt lại theo tổng limit.
    const pages = items
      .filter(item => item.type === 'page')
      .slice(0, limit)
      .map(item => ({
        ...item,
        query: item.query ?? '',
      }));

    console.log(`Returned ${pages.length} pages`);
    return pages;
  }
}
