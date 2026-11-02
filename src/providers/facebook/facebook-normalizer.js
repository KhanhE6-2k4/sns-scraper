const FOLLOWER_MULTIPLIERS = {
  K: 1_000,
  M: 1_000_000,
};

// Actor không có trường followers riêng, số followers nằm trong snippet,
// vd: "Digital creator · 1K followers", "Education website · 1 follower".
function parseFollowers(snippet) {
  const match = String(snippet ?? '').match(/([\d.,]+)\s*([KM])?\s+followers?/i);

  if (!match) {
    return null;
  }

  const value = Number(match[1].replace(/,/g, ''));
  const multiplier = FOLLOWER_MULTIPLIERS[match[2]?.toUpperCase()] ?? 1;

  return Number.isFinite(value) ? Math.round(value * multiplier) : null;
}

// Mỗi kết quả của chế độ pages là một page, đồng thời là creator.
// Actor không trả về các chỉ số tương tác, để null (thay vì 0) để bộ lọc không lọc nhầm.
export function normalizeFacebookPage(item, query = '') {
  return {
    platform: 'facebook',

    query,

    title: item.name ?? '',

    url: item.url ?? item.profileUrl ?? '',

    content: item.description ?? '',

    video: {
      id: String(item.facebookId ?? ''),
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      createTime: null,
    },

    creator: {
      id: String(item.facebookId ?? ''),
      username: '', // Page không có handle cố định (có thể là profile.php?id=...)
      nickname: item.name ?? '',
      verified: item.isVerified ?? false,
      avatar: item.image?.uri ?? '',
      url: item.profileUrl ?? item.url ?? '',
      followers: parseFollowers(item.snippet),
      bio: item.description ?? null,

      // Output của Facebook Actor không cung cấp các trường này
      following: null,
      totalLikes: null,
      videoCount: null,
    },

    // Thông tin riêng của Facebook
    metadata: {
      type: item.type ?? null,
      snippet: item.snippet ?? null,
    },
  };
}
