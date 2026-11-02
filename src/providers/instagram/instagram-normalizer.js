// Field Actor không trả về để null (thay vì 0) để bộ lọc không lọc nhầm.
// item.profile là output của Profile Actor, null nếu không lấy được profile.
export function normalizeInstagramPost(item, query = '') {
  const profile = item.profile ?? {};

  return {
    platform: 'instagram',

    query,

    title: item.text ?? '',

    url: item.url ?? '',

    content: item.text ?? '',

    video: {
      id: String(item.pk ?? item.id ?? ''),
      views: item.play_count ?? null,
      likes: item.like_count ?? null,
      comments: item.comment_count ?? null,
      shares: null,
      saves: null,
      // taken_at là unix timestamp (giây)
      createTime: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null,
    },

    creator: {
      id: String(profile.id ?? item.user?.pk ?? item.user?.id ?? ''),
      username: item.user?.username ?? profile.username ?? '',
      nickname: profile.fullName ?? item.user?.full_name ?? '',
      verified: profile.verified ?? item.user?.is_verified ?? false,
      avatar: item.user?.profile_pic_url ?? '',
      followers: profile.followersCount ?? null,
      following: profile.followsCount ?? null,
      averageLikes: profile.averageLikes ?? null, // Trung bình likes của các bài gần nhất
      bio: profile.biography ?? null,
      relatedProfiles: (profile.relatedProfiles ?? []).map(related => related.username),

      // Output của Instagram Actor không cung cấp các trường này
      totalLikes: null,
      videoCount: null,
    },

    // Thông tin riêng của Instagram
    media: {
      isVideo: Boolean(item.video_info),
      videoUrl: item.video_info?.url ?? '',
      imageUrl: item.image_info?.url ?? '',
    },

    metadata: {
      code: item.code ?? '',
      hasAudio: item.has_audio ?? null,
    },
  };
}
