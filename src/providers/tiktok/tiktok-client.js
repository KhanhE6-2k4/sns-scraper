// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'poidata/tiktok-scraper';
// const ACTOR_ID = 'apidojo/tiktok-scraper-api';

// const sortMapper = new Map([
//   ['relevance', 'RELEVANCE'],
//   ['popular', 'MOST_LIKED'],
//   ['latest', 'DATE_POSTED'],
// ])

// const dateRangeMapper = new Map([
//   ['1d', 'YESTERDAY'],
//   ['1w', 'THIS_WEEK'],
//   ['1m', 'THIS_MONTH'],
//   ['3m', 'LAST_THREE_MONTHS'],
// ])

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateRange(dateRange) {
  // Không giới hạn thời gian
  if (!dateRange || dateRange === 'all') {
    return {};
  }

  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  switch (dateRange) {
    case '1d':
      from.setDate(from.getDate() - 1);
      break;

    case '1w':
      from.setDate(from.getDate() - 7);
      break;

    case '1m':
      from.setMonth(from.getMonth() - 1);
      break;

    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;

    default:
      throw new Error(`Invalid dateRange: ${dateRange}`);
  }

  return {
    dateFrom: formatLocalDate(from),
    dateTo: formatLocalDate(to),
  };
}


function normalizeHashtag(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9_]/g, ''); // Bỏ khoảng trắng, ký tự đặc biệt
}

export class TikTokClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  async scrapeHashtags({
    hashtags,
    // dateFrom,
    // dateTo,
    dateRange,
    limit = 10,
    sortBy = 'relevance'
  }) {
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      throw new Error('hashtags must be a non-mepty array');
    }

    const normalizedHashtags = hashtags.map((value) => {
      const hashtag = normalizeHashtag(value);

      if (!hashtag) {
        throw new Error(`Invalid hashtag: ${value}`);
      }

      // return `https://www.tiktok.com/tag/${encodeURIComponent(hashtag)}`;
      return hashtag;
    });

    const dateFilters = getDateRange(dateRange);

    const input = {
      hashtags: normalizedHashtags,
      // startUrls,
      maxItems: limit,
      sortBy,
      ...dateFilters,
      // location: 'VN',
      maxItemsPerQuery: Math.ceil(limit / hashtags.length),
      // sortType: sortMapper.get(sortBy),
      uniqueAuthors: false
      // dateRange: dateRangeMapper.get(dateRange),
    }

    // if (dateFrom) {
    //   input.dateFrom = dateFrom;
    // }
    // if (dateTo) {
    //   input.dateTo = dateTo;
    // }

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async scrapeKeywords({
    queries,
    // dateFrom,
    // dateTo,
    dateRange,
    limit = 10,
    sortBy = 'relevance'
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-mepty array');
    }

    // const keywords = queries.map((query) => String(query).trim()).filter(Boolean);
    // if (keywords.length === 0) {
    //   throw new Error('queries must contain at least one non-empty keyword');
    // }

    const dateFilters = getDateRange(dateRange);

    const input = {
      searchQueries: queries,
      // keywords,
      maxItems: limit,
      maxItemsPerQuery: Math.ceil(limit / queries.length),
      sortBy,
      uniqueAuthors: false,
      ...dateFilters,
      // dateRange: dateRangeMapper.get(dateRange),
      // location: 'VN',
    }

    // if (dateFrom) {
    //   input.dateFrom = dateFrom;
    // }
    // if (dateTo) {
    //   input.dateTo = dateTo;
    // }

    // if (dateRange) {
    //   if (!dateRangeMapper.has(dateRange)) {
    //     throw new Error(`Invalid dateRange: ${dateRange}`);
    //   }
    //   input.dateRange =  dateRangeMapper.get(dateRange);
    // }

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async #runActor(input) {
    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    const newItems = items.map(item => ({
      ...item,
      query: item.searchQuery ?? null,
    }));

    console.log(`Returned ${newItems.length} videos`);
    return newItems;
  }

//   async #runActor(input) {
//     console.log('\n========== ACTOR INPUT ==========');
//     console.log(JSON.stringify(input, null, 2));

//     const run = await this.client.actor(ACTOR_ID).call(input);

//     console.log('\n========== ACTOR RUN INFO ==========');
//     console.log({
//       runId: run.id,
//       status: run.status,
//       datasetId: run.defaultDatasetId,
//     });

//     const dataset = this.client.dataset(run.defaultDatasetId);

//     const result = await dataset.listItems({
//       limit: 1000,
//       offset: 0,
//     });

//     const items = result.items ?? [];

//     console.log('\n========== DATASET SUMMARY ==========');
//     console.log({
//       requestedMaxItems: input.maxItems,
//       datasetTotal: result.total,
//       datasetCount: result.count,
//       itemsReceived: items.length,
//     });

//     console.log('\n========== FIRST RAW ITEM ==========');
//     console.dir(items[0] ?? null, { depth: null });

//     console.log('\n========== RAW ITEM KEYS ==========');
//     console.log(
//       items[0] ? Object.keys(items[0]) : 'No items returned'
//     );

//     console.log('\n========== CREATOR DATA ==========');
//     console.dir(items[0]?.channel ?? null, { depth: null });

//     console.log('\n========== FIRST 5 VIDEOS ==========');
//     console.table(
//       items.slice(0, 5).map(item => ({
//         id: item.id,
//         title: item.title,
//         url: item.postPage,
//         views: item.views,
//         likes: item.likes,
//         creator: item.channel?.username,
//         followers: item.channel?.followers,
//         totalLikes: item.channel?.likes,
//         videoCount: item.channel?.videos,
//       }))
//     );

//     console.log(`Returned ${items.length} videos`);

//     return items;
//   }
}
