
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
      views: item.views ?? 0,
      likes: item.likes ?? 0,
      comments: item.comments ?? 0,
      shares: null,
      saves: null,
      createTime: item.uploadDate ?? null,
    },

    creator: {
      id: '',
      username: '',
      nickname: item.channelName ?? '',
      verified: false,
      followers: item.channelSubscribers ?? null,
      following: null,
      totalLikes: null,
      videoCount: null,
      bio: null,
      avatar: null,

      url: '',
    },

    media: {
      isVideo: true,
      duration: item.duration ?? null,
      videoUrl: item.url ?? '',
    },

    metadata: {
      tags: item.tags ?? [],
      subtitles: item.subtitles ?? null,
      isShort: false,
      isLive: false,
    },
  };
}
