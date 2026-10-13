import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'solidcode/youtube-scraper';

const VALID_SORT_OPTIONS = [
  'relevance',
  'uploadDate',
  'viewCount',
  'rating',
];

const DATE_FILTER_MAP = {
  all: 'any',
  '1d': 'today',
  '1w': 'week',
  '1m': 'month',
  '3m': 'year',
};

export class YouTubeClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('Apify API token is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  async scrape({
    queries = [],
    // startUrls = [],
    limit = 10,
    sortBy = 'relevance',
    dateRange = 'any',
  } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error('limit must be an integer between 1 and 500');
    }

    if (!VALID_SORT_OPTIONS.includes(sortBy)) {
      throw new Error(`Invalid sortBy: ${sortBy}`);
    }

    // if (!VALID_DATE_FILTERS.includes(dateFilter)) {
    //   throw new Error(`Invalid dateFilter: ${dateFilter}`);
    // }
    const dateFilter = DATE_FILTER_MAP[dateRange] ?? 'any';

    const searchKeywords = queries
      .map(query => String(query).trim())
      .filter(Boolean);

    // const urls = startUrls
    //   .map(url => String(url).trim())
    //   .filter(Boolean);

    if (searchKeywords.length === 0) {
      throw new Error('At least one search keyword is required');
    }

    // const input = {
    //   maxVideos: limit,
    //   sortBy,
    //   dateFilter,
    // };

    const input = {
      maxResults: limit,
      sortBy,
      uploadDate: dateFilter,
      country: 'vn',
      language: 'vi',
    };

    if (searchKeywords.length > 0) {
      input.searchQueries = searchKeywords;
    }

    // if (urls.length > 0) {
    //   input.startUrls = urls;
    // }

    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    const newItems = items.map(item => ({
      ...item,
      query: item?.sourceInput ?? '',
    }));

    console.log(`Returned ${newItems.length} videos`);
    return newItems;
  }
}
