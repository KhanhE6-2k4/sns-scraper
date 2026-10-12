
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

    ...options
  }) {
    this.platform = platform;
    this.queries = queries;
    this.searchType = searchType;
    this.limit = limit;
    this.sortBy = sortBy;
    this.dateRange = dateRange;

    this.filters = {
      verified: verifiedFilter,
      followers: {},
      likes: {},
      videoCount: {},
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

    this.options = options;
  }
}
