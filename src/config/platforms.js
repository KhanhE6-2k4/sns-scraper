// Nguồn duy nhất khai báo các nền tảng được hỗ trợ.
// Thêm nền tảng mới: bổ sung vào SUPPORTED_PLATFORMS và PROFILE_URL_BUILDERS.

export const SUPPORTED_PLATFORMS = [
  'tiktok',
  'instagram',
  'youtube',
  'threads',
  'facebook',
];

const PROFILE_URL_BUILDERS = {
  tiktok: username => `https://www.tiktok.com/@${username}`,
  instagram: username => `https://www.instagram.com/${username}/`,
  youtube: username => `https://www.youtube.com/@${username}`,
  threads: username => `https://www.threads.com/@${username}`,
  facebook: username => `https://www.facebook.com/${username}`,
};

export function isSupportedPlatform(platform) {
  return SUPPORTED_PLATFORMS.includes(platform);
}

export function getCreatorProfileUrl(platform, username) {
  if (!username) return '';

  const buildProfileUrl = PROFILE_URL_BUILDERS[platform];

  return buildProfileUrl ? buildProfileUrl(username) : '';
}
