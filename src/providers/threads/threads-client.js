// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';
import { MAX_PARALLEL_RUNS } from '../../config/apify.js';
import { runInGroups } from '../../utils/array.js';

const ACTOR_ID = 'automation_craft/threads-search-scraper';

// Actor không có sort, searchMode là lựa chọn gần nhất.
const SORT_MODE_MAP = {
  relevance: 'top',
  latest: 'recent',
};

// Actor nhận khoảng thời gian tương đối cho postedAfter.
const DATE_RANGE_MAP = {
  '1d': 'yesterday',
  '1w': '7 days',
  '1m': '1 month',
  '3m': '3 months',
};

function getSearchMode(sortBy) {
  const searchMode = SORT_MODE_MAP[sortBy];

  if (!searchMode) {
    throw new Error(`Invalid sortBy: ${sortBy}`);
  }

  return searchMode;
}

function getPostedAfter(dateRange) {
  // Không giới hạn thời gian
  if (!dateRange || dateRange === 'all') {
    return null;
  }

  const postedAfter = DATE_RANGE_MAP[dateRange];

  if (!postedAfter) {
    throw new Error(`Invalid dateRange: ${dateRange}`);
  }

  return postedAfter;
}

function normalizeHashtag(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9_]/g, ''); // Bỏ khoảng trắng, ký tự đặc biệt
}

export class ThreadsClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  async scrapeHashtags({
    hashtags,
    dateRange,
    limit = 10,
    sortBy = 'relevance',
    maxParallelRuns = MAX_PARALLEL_RUNS,
  }) {
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      throw new Error('hashtags must be a non-empty array');
    }

    const tags = hashtags.map((value) => {
      const hashtag = normalizeHashtag(value);

      if (!hashtag) {
        throw new Error(`Invalid hashtag: ${value}`);
      }

      return hashtag;
    });

    const perQuery = Math.ceil(limit / tags.length);

    // Chia tag thành nhiều nhóm, mỗi nhóm là một run chạy song song.
    return runInGroups(tags, maxParallelRuns, group => this.#runActor(
      this.#buildInput({
        tags: group,
        dateRange,
        limit: perQuery * group.length,
        sortBy,
        queryCount: group.length,
      })
    ));
  }

  async scrapeKeywords({
    queries,
    dateRange,
    limit = 10,
    sortBy = 'relevance',
    maxParallelRuns = MAX_PARALLEL_RUNS,
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-empty array');
    }

    const perQuery = Math.ceil(limit / queries.length);

    // Chia từ khóa thành nhiều nhóm, mỗi nhóm là một run chạy song song.
    return runInGroups(queries, maxParallelRuns, group => this.#runActor(
      this.#buildInput({
        searchQueries: group,
        dateRange,
        limit: perQuery * group.length,
        sortBy,
        queryCount: group.length,
      })
    ));
  }

  #buildInput({ dateRange, limit, sortBy, queryCount, ...searchInput }) {
    const input = {
      ...searchInput,
      // Actor mặc định loại bài không chứa đúng chữ của từ khóa,
      // làm mất kết quả khi từ khóa và bài viết khác dấu (vd. "tieng anh" vs "tiếng anh").
      requireKeywordInText: false,
      searchMode: getSearchMode(sortBy),
      maxPosts: limit,
      maxPostsPerQuery: Math.ceil(limit / queryCount),
    };

    const postedAfter = getPostedAfter(dateRange);

    if (postedAfter) {
      input.postedAfter = postedAfter;
    }

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return input;
  }

  async #runActor(input) {
    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    // Dataset còn chứa các dòng coverage/status/summary, chỉ giữ bài viết.
    const posts = items
      .filter(item => item.type === 'post')
      .map(item => ({
        ...item,
        query: item.sourceQuery ?? '',
      }));

    console.log(`Returned ${posts.length} posts`);
    return posts;
  }
}
