export function normalizeTikTokVideo(
  item,
  keyword = ''
) {
  return {
    platform: 'tiktok',

    keyword,

    title: item.text ?? '',

    url: item.webVideoUrl ?? '',

    content: item.text ?? '',

    video: {
      id: item.id ?? '',
      views: item.playCount ?? 0,
      likes: item.diggCount ?? 0,
      comments: item.commentCount ?? 0,
      shares: item.shareCount ?? 0,
      saves: item.collectCount ?? 0,
      createTime: item.createTimeISO ?? null,
    },

    creator: {
      id: item.authorMeta?.id ?? '',
      username: item.authorMeta?.name ?? '',
      nickname: item.authorMeta?.nickName ?? '',
      verified:
        item.authorMeta?.verified ?? false,
      followers:
        item.authorMeta?.fans ?? 0,
      following:
        item.authorMeta?.following ?? 0,
      totalLikes:
        item.authorMeta?.heart ?? 0,
      videoCount:
        item.authorMeta?.video ?? 0,
      bio:
        item.authorMeta?.signature ?? '',
      avatar:
        item.authorMeta?.avatar ?? '',
    },
  };
}

// export function normalizeTikTokVideo(item, keyword = '') {
//   const channel = item.channel ?? {};

//   return {
//     platform: 'tiktok',

//     // Lưu lại keyword đã dùng trong lần discovery này
//     keyword,

//     title: item.title ?? '',
//     url: item.postPage ?? '',
//     content: item.title ?? '',

//     video: {
//       id: String(item.id ?? ''),
//       views: Number(item.views ?? 0),
//       likes: Number(item.likes ?? 0),
//       comments: Number(item.comments ?? 0),
//       shares: Number(item.shares ?? 0),
//       saves: Number(item.bookmarks ?? 0),
//       createTime:
//         item.uploadedAtFormatted ??
//         (item.uploadedAt
//           ? new Date(Number(item.uploadedAt) * 1000).toISOString()
//           : null),
//     },

//     creator: {
//       id: String(channel.id ?? ''),
//       username: channel.username ?? '',
//       nickname: channel.name ?? '',
//       verified: channel.verified ?? false,
//       followers: Number(channel.followers ?? 0),
//       following: Number(channel.following ?? 0),
//       totalLikes: Number(channel.likes ?? 0),
//       videoCount: Number(channel.videos ?? 0),
//       bio: channel.bio ?? '',
//       avatar: channel.avatar ?? '',
//     },
//   };
// }
