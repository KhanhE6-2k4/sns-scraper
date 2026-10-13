
export function normalizeYouTubeVideo(item, keyword = '') {
  // Tách video ID từ URL nếu Actor không trả về ID riêng.
  const videoId =
    item.url?.match(/[?&]v=([^&]+)/)?.[1] ?? '';

  return {
    platform: 'youtube',
    keyword,
    title: item.title ?? '',
    url: item.url ?? '',
    content: item.description ?? item.title ?? '',

    video: {
      id: videoId,
      views: item.viewCount ?? 0,
      likes: item.likeCount ?? 0,
      comments: item.comments ?? 0, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      shares: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      saves: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      createTime: item.publishedAt ?? null,
    },

    creator: {
      id: item.channel?.id ?? '',
      username: item.channel?.handle?.slice(1) ?? '',
      nickname: item.channel?.name ?? '',
      verified: false, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      followers: item.channelSubscribers ?? null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      following: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      totalLikes: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      videoCount: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      bio: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      avatar: null, // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      url: item.channel?.url ?? '',
    },

    media: {
      thumbnail: item.thumbnail ?? '',
      duration: item.duration ?? null,
      videoUrl: item.url ?? '',
    },

    metadata: {
      tags: item.tags ?? [],  // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      handle: item.channel?.handle ?? '', 
      subtitles: item.subtitles ?? null,  // Ko có trường này trong dữ liệu trả về của Actor, nhưng giữ lại để tương thích với các provider khác.
      isShort: item.channel?.isShort ?? false,  
      isLive: item.channel?.isLive ?? false,
    },
  };
}
