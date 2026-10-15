// export function rangeFilterSocialContent(
//   contents,
//   {
//     verified = 'any',
//     followers = {},
//     likes = {},
//     videoCount = {},
//   }
// ) {
//   return contents.filter(content => {
//     const creator = content.creator ?? {};
//     const creatorFollowers = Number(creator.followers ?? 0);
//     const creatorLikes = Number(creator.totalLikes ?? 0);
//     const creatorVideoCount = Number(creator.videoCount ?? 0);
//     const isVerified = creator.verified === true;

//     if (followers.min !== undefined && creatorFollowers < followers.min) {
//       return false;
//     }
//     if (followers.max !== undefined && creatorFollowers > followers.max) {
//       return false;
//     }

//     if (likes.min !== undefined && creatorLikes < likes.min) {
//       return false;
//     }
//     if (likes.max !== undefined && creatorLikes > likes.max) {
//       return false;
//     }

//     if (verified === 'verified' && !isVerified) {
//       return false;
//     }

//     if (verified === 'not-verified' && isVerified) {
//       return false;
//     }

//     if (videoCount.min !== undefined && creatorVideoCount < videoCount.min) {
//       return false;
//     }

//     return true;
//   })
// }


export function rangeFilterSocialContent(
  contents,
  {
    verified = 'any',
    followers = {},
    likes = {},
    videoCount = {},
  } = {}
) {
  return contents.filter(content => {
    const creator = content.creator ?? {};

    // Chỉ lọc followers khi frontend gửi min/max
    if (
      followers.min !== undefined ||
      followers.max !== undefined
    ) {
      const value = creator.followers;

      // Có điều kiện lọc nhưng dữ liệu không tồn tại
      if (value == null || !Number.isFinite(Number(value))) {
        return false;
      }

      const followersValue = Number(value);

      if (
        followers.min !== undefined &&
        followersValue < followers.min
      ) {
        return false;
      }

      if (
        followers.max !== undefined &&
        followersValue > followers.max
      ) {
        return false;
      }
    }

    // Chỉ lọc tổng likes của creator khi frontend gửi min/max
    if (
      likes.min !== undefined ||
      likes.max !== undefined
    ) {
      const value = creator.totalLikes;

      if (value == null || !Number.isFinite(Number(value))) {
        return false;
      }

      const likesValue = Number(value);

      if (
        likes.min !== undefined &&
        likesValue < likes.min
      ) {
        return false;
      }

      if (
        likes.max !== undefined &&
        likesValue > likes.max
      ) {
        return false;
      }
    }

    // Chỉ lọc trạng thái verified khi được yêu cầu
    if (verified === 'verified' && creator.verified !== true) {
      return false;
    }

    if (
      verified === 'not-verified' &&
      creator.verified !== false
    ) {
      return false;
    }

    // Chỉ lọc videoCount khi frontend gửi min
    if (videoCount.min !== undefined) {
      const value = creator.videoCount;

      if (value == null || !Number.isFinite(Number(value))) {
        return false;
      }

      if (Number(value) < videoCount.min) {
        return false;
      }
    }

    return true;
  });
}

export function deduplicateSocialContent(contents) {
  const visited = new Set();

  return contents.filter(content => {
    const key = content.video?.id || content.url;

    if (!key) {
      return true;
    }

    if (visited.has(key)) {
      return false;
    }

    visited.add(key);

    return true;
  })
}

export function isValidSocialContent(content) {
  return (
    Boolean(content.url) &&
    Boolean(content.video?.id) &&
    Boolean(content.creator?.id || content.creator?.username)
  );
}

export function validateSocialContent(contents) {
  const invalid = [];

  contents.forEach((content, index) => {
    if (!content.url) {
      invalid.push({
        index,
        reason: 'missing url'
      });
    }

    if (!content.video?.id) {
      invalid.push({
        index,
        reason: 'missing content.id'
      });
    }

    if (!content.creator?.id && !content.creator?.username) {
      invalid.push({
        index,
        reason: 'missing creator'
      });
    }
  });

  return invalid;
}
