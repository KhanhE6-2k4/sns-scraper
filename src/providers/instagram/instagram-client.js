// Chịu trách nhiệm giao tiếp với Scrape provider trên apify

import { ApifyClient } from 'apify-client';
import { MAX_PARALLEL_RUNS } from '../../config/apify.js';
import { runInGroups } from '../../utils/array.js';

// Bước 1: tìm bài đăng theo từ khóa (cần cookie đăng nhập).
const SEARCH_ACTOR_ID = 'shareze001/instagram-search-posts-by-cookies';

// Bước 2: lấy thông tin profile (followers, averageLikes, ...) của tác giả các bài đăng.
const PROFILE_ACTOR_ID = 'alfalfa/instagram-profile-scraper';

// Actor đưa keyword vào HTTP header (chỉ nhận latin-1) nên bị crash với chữ có dấu tiếng Việt.
function removeVietnameseTones(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export class InstagramClient {
  constructor({ apiToken }) {
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required');
    }

    this.client = new ApifyClient({ token: apiToken });
  }

  // Actor chỉ nhận 1 keyword mỗi lần chạy và không hỗ trợ hashtag, sort, lọc thời gian.
  async scrapeKeywords({
    queries,
    cookies,
    limit = 10,
  }) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('queries must be a non-empty array');
    }

    if (!cookies) {
      throw new Error('Instagram cookies is required');
    }

    const size = Math.ceil(limit / queries.length);

    // Các nhóm chạy song song; trong mỗi nhóm chạy lần lượt từng keyword
    // (Actor chỉ nhận 1 keyword/run), nên số run cùng lúc không vượt MAX_PARALLEL_RUNS.
    const results = await runInGroups(queries, MAX_PARALLEL_RUNS, async group => {
      const groupPosts = [];

      for (const query of group) {
        groupPosts.push(...await this.#searchPosts({
          cookies,
          keyword: removeVietnameseTones(query),
          size,
        }, query));
      }

      return groupPosts;
    });

    const posts = results.slice(0, limit);

    return this.#attachProfiles(posts);
  }

  async #searchPosts(input, query) {
    const items = await this.#runActor(SEARCH_ACTOR_ID, input, `keyword "${query}"`);

    // Cookie không hợp lệ thì Actor trả về record { message } thay vì bài đăng.
    const posts = items.filter(item => {
      if (item.message && !item.pk) {
        console.warn(`Instagram Actor message with keyword "${query}": ${item.message}`);
        return false;
      }

      return true;
    });

    console.log(`Returned ${posts.length} posts`);

    // Output không có trường query nên gắn từ khóa gốc người dùng nhập.
    return posts.map(item => ({
      ...item,
      query,
    }));
  }

  // Gắn thông tin profile vào từng bài đăng theo username của tác giả.
  async #attachProfiles(posts) {
    const usernames = [...new Set(
      posts
        .map(post => post.user?.username)
        .filter(Boolean)
    )];

    if (usernames.length === 0) {
      return posts;
    }

    // Nhóm nào lỗi thì #runActor trả [], các nhóm khác vẫn giữ kết quả.
    const items = await runInGroups(usernames, MAX_PARALLEL_RUNS, group => this.#runActor(PROFILE_ACTOR_ID, {
      usernames: group,
      startUrls: [],
      maxProfiles: group.length, // Mặc định Actor chỉ lấy 50 profile/run
      maxPostDetails: 0,
      includeAboutSection: false,
    }, `${group.length} usernames`));

    // Profile không lấy được trả về record { error } (not_found, request_failed, ...).
    const profileByUsername = new Map(
      items
        .filter(item => !item.error && item.username)
        .map(item => [item.username.toLowerCase(), item])
    );

    console.log(`Returned ${profileByUsername.size} profiles`);

    return posts.map(post => ({
      ...post,
      profile: profileByUsername.get(post.user?.username?.toLowerCase()) ?? null,
    }));
  }

  async #runActor(actorId, input, label) {
    // Không log cookies vì là thông tin đăng nhập.
    console.log(`Input (${actorId}):`);
    console.log(JSON.stringify({ ...input, ...(input.cookies && { cookies: '***' }) }, null, 2));

    const run = await this.client.actor(actorId).call(input);

    // Run lỗi thì bỏ qua, giữ kết quả của các bước/từ khóa khác.
    if (run.status !== 'SUCCEEDED') {
      console.warn(`Instagram Actor ${actorId} ${run.status} with ${label} (runId: ${run.id})`);
      return [];
    }

    const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

    return items;
  }
}
