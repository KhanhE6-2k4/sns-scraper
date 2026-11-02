// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';
import { MAX_PARALLEL_RUNS } from '../../config/apify.js';
import { runInGroups } from '../../utils/array.js';

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

    const perQuery = Math.ceil(limit / queries.length);

    // Chia từ khóa thành nhiều nhóm, mỗi nhóm là một run chạy song song.
    return runInGroups(queries, MAX_PARALLEL_RUNS, group => {
      const input = {
        queries: group,
        searchType: SEARCH_TYPE,
        maxResultsPerQuery: perQuery,
      };

      console.log('Input:');
      console.log(JSON.stringify(input, null, 2));

      return this.#runActor(input, perQuery * group.length);
    });
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
