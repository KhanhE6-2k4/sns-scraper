export function normalizeInstagramPost(item, query = '') {
  return {
    platform: 'instagram',

    query,

    title: item.caption ?? '',

    url: item.url ?? '',

    content: item.caption ?? '',

    video: {
      id: String(item.id ?? ''),
      views: item.video?.playCount ?? item.video?.igPlayCount ?? 0,
      likes: item.likeCount ?? 0,
      comments: item.commentCount ?? 0,
      shares: 0,
      saves: 0,
      createTime: item.createdAt ?? null,
    },

    creator: {
      id: String(item.owner?.id ?? ''),
      username: item.owner?.username ?? '',
      nickname: item.owner?.fullName ?? '',
      verified: item.owner?.isVerified ?? false,
      followers: item.owner?.followerCount ?? 0,

      // Output cuả instagram không cung cấp các trường này
      following: 0,
      totalLikes: 0,
      videoCount: 0,
      bio: '',
      avatar: '',
    },

    // Thông tin riêng của Instagram
    media: {
      isVideo: item.isVideo ?? false,
      videoUrl: item.video?.url ?? '',
      duration: item.video?.duration ?? 0,
    },
  };
}
