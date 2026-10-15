// Actor không trả về các trường để null (thay vì 0) để bộ lọc không lọc nhầm.
export function normalizeThreadsPost(item, query = '') {
  return {
    platform: 'threads',

    query,

    title: item.text ?? '',

    url: item.url ?? '',

    content: item.text ?? '',

    video: {
      id: String(item.postId ?? ''),
      views: null, // Actor luôn trả viewCount = null
      likes: item.likeCount ?? 0,
      comments: item.replyCount ?? 0,
      shares: item.repostCount ?? 0,
      saves: null,
      createTime: item.postedAt ?? null,
    },

    creator: {
      id: String(item.authorId ?? ''),
      username: item.authorUsername ?? '',
      nickname: item.authorFullName ?? '',
      verified: item.authorVerified ?? false,
      avatar: item.authorProfilePic ?? '',
      url: item.authorUrl ?? '',

      // Output của Threads Actor không cung cấp các trường này
      followers: null,
      following: null,
      totalLikes: null,
      videoCount: null,
      bio: null,
    },

    // Thông tin riêng của Threads
    media: {
      type: item.mediaType ?? null,
      hasMedia: item.hasMedia ?? false,
      imageUrl: item.imageUrl ?? '',
    },

    metadata: {
      code: item.code ?? '',
      topicTag: item.topicTag ?? null,
      language: item.language ?? null,
      isReply: item.isReply ?? false,
      quoteCount: item.quoteCount ?? 0,
      source: item.source ?? null,
    },
  };
}
