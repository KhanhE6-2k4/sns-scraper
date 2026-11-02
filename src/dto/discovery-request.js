
export class DiscoveryRequest {
  constructor({
    platform,
    queries = [],
    searchType = 'keyword',
    limit = 10,
    sortBy = 'relevance',
    dateRange = 'all',

    verifiedFilter = 'any',

    isFilteredByFollowers = false,
    minFollowers,
    maxFollowers,

    isFilteredByLikes = false,
    minLikes,
    maxLikes,

    isFilteredByVideoCount = false,
    minVideoCount,

    isFilteredByAverageLikes = false,
    minAverageLikes,
    maxAverageLikes,

    ...options
  }) {
    this.platform = platform;
    this.queries = queries;
    this.searchType = searchType;

    // Frontend gửi số lượng cho mỗi truy vấn, đổi sang tổng để các client chia lại theo từng truy vấn.
    this.limit = Number(limit) * Math.max(queries.length, 1);
    this.sortBy = sortBy;
    this.dateRange = dateRange;

    this.filters = {
      verified: verifiedFilter,
      followers: {},
      likes: {},
      videoCount: {},
      averageLikes: {},
    };

    if (isFilteredByFollowers) {
      if (minFollowers !== undefined && minFollowers !== '') {
        this.filters.followers.min = Number(minFollowers);
      }

      if (maxFollowers !== undefined && maxFollowers !== '') {
        this.filters.followers.max = Number(maxFollowers);
      }
    }

    if (isFilteredByLikes) {
      if (minLikes !== undefined && minLikes !== '') {
        this.filters.likes.min = Number(minLikes);
      }

      if (maxLikes !== undefined && maxLikes !== '') {
        this.filters.likes.max = Number(maxLikes);
      }
    }

    if (
      isFilteredByVideoCount &&
      minVideoCount !== undefined &&
      minVideoCount !== ''
    ) {
      this.filters.videoCount.min = Number(minVideoCount);
    }

    if (isFilteredByAverageLikes) {
      if (minAverageLikes !== undefined && minAverageLikes !== '') {
        this.filters.averageLikes.min = Number(minAverageLikes);
      }

      if (maxAverageLikes !== undefined && maxAverageLikes !== '') {
        this.filters.averageLikes.max = Number(maxAverageLikes);
      }
    }

    this.options = options;
  }
}
