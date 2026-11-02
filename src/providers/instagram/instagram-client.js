// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'apidojo/instagram-scraper-api';

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateRange(dateRange) {
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

export class InstagramClient {
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
  }) {
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      throw new Error('hashtags must be a non-mepty array');
    }

    const normalizedHashtags = hashtags.map((value) => {
      const hashtag = normalizeHashtag(value);

      if (!hashtag) {
        throw new Error(`Invalid hashtag: ${value}`);
      }

      return `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`;
    });

    const input = {
      startUrls: normalizedHashtags,
      maxItems: limit,
    }

    if (getDateRange(dateRange)?.dateFrom) {
      input.until = getDateRange(dateRange).dateFrom;
    }

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async scrapeKeywords({
    queries,
    dateRange,
    limit = 10,
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-mepty array');
    }

    const input = {
      keywords: queries,
      maxItems: limit,
    }

    if (getDateRange(dateRange)?.dateFrom) {
      input.until = getDateRange(dateRange).dateFrom;
    }

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    return this.#runActor(input);
  }

  async #runActor(input) {
    const run = await this.client.actor(ACTOR_ID).call(input);

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    console.log(`Returned ${items.length} videos`);
    return items;
  }
}
