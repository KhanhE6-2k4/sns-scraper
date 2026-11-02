import { ApifyClient } from 'apify-client';
import { MAX_PARALLEL_RUNS } from '../../config/apify.js';
import { runInGroups } from '../../utils/array.js';

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
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('limit must be a positive integer');
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

    const total_queries = searchKeywords.length;
    const maxResults = Math.floor(limit / total_queries);

    // Giới hạn theo từng truy vấn (khớp max của ô nhập trên youtube.html).
    if (maxResults < 1 || maxResults > 5000) {
      throw new Error('limit per query must be between 1 and 5000');
    }

    // Chia từ khóa thành nhiều nhóm, mỗi nhóm là một run chạy song song.
    const items = await runInGroups(searchKeywords, MAX_PARALLEL_RUNS, async group => {
      const input = {
        maxResults,
        sortBy,
        uploadDate: dateFilter,
        country: 'vn',
        language: 'vi',
        searchQueries: group,
      };

      console.log('Input:');
      console.log(JSON.stringify(input, null, 2));

      const run = await this.client.actor(ACTOR_ID).call(input);

      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      return items;
    });

    const newItems = items.map(item => ({
      ...item,
      query: item?.sourceInput ?? '',
    }));

    console.log(`Returned ${newItems.length} videos`);
    return this.#attachChannelInfo(newItems);
  }

  // Kết quả tìm kiếm không có subscribers/mô tả kênh, nên chạy lại Actor theo handle để lấy.
  async #attachChannelInfo(videos) {
    const handles = [...new Set(
      videos
        .map(video => video.channel?.handle)
        .filter(Boolean)
    )];

    if (handles.length === 0) {
      return videos;
    }

    const channels = await runInGroups(
      handles,
      MAX_PARALLEL_RUNS,
      group => this.#fetchChannels(group)
    );

    const channelByHandle = new Map(
      channels
        .filter(item => item.recordType === 'channel' && item.handle)
        .map(item => [item.handle.toLowerCase(), item])
    );

    console.log(`Returned ${channelByHandle.size} channels`);

    return videos.map(video => ({
      ...video,
      channelInfo: channelByHandle.get(video.channel?.handle?.toLowerCase()) ?? null,
    }));
  }

  async #fetchChannels(handles) {
    // maxResults: 1 + fetchChannelInfo chỉ trả về 1 dòng channel cho mỗi handle, không kèm video.
    const input = {
      youtubeHandles: handles,
      maxResults: 1,
      fetchChannelInfo: true,
      channelContent: 'videos',
    };

    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));

    const run = await this.client.actor(ACTOR_ID).call(input);

    // Nhóm nào lỗi thì bỏ qua, video vẫn được trả về, chỉ thiếu thông tin kênh.
    if (run.status !== 'SUCCEEDED') {
      console.warn(`YouTube channel info ${run.status} (runId: ${run.id})`);
      return [];
    }

    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    return items;
  }
}
