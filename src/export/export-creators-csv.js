import fs from 'fs/promises';
import path from 'path';

// function escapeCsv(value) {
//     if (value === null || value === undefined) {
//         return '';
//     }

//     const stringValue = String(value);

//     if (
//         stringValue.includes(',') ||
//         stringValue.includes('"') ||
//         stringValue.includes('\n')
//     ) {
//         return `"${stringValue.replace(/"/g, '""')}"`;
//     }

//     return stringValue;
// }

function getCreatorProfileUrl(platform, username) {
  if (!username) return '';

  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${username}/`;

    case 'tiktok':
      return `https://www.tiktok.com/@${username}`;

    case 'youtube':
      return `https://www.youtube.com/@${username}`;

    default:
      return '';
  }
}

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function exportCreatorsCsv(videos, outputPath) {
    const creators = new Map();

    for (const video of videos) {
        const creator = video.creator;

        if (!creator) {
            continue;
        }

        const creatorId =
            creator.id ||
            creator.username;

        if (!creatorId) {
            continue;
        }

        const mapKey = `${video.platform ?? 'tiktok'}:${creatorId}`;


        if (!creators.has(mapKey)) {
          const profileUrl = getCreatorProfileUrl(
              video.platform ?? 'tiktok',
              creator.username
          );
          creators.set(mapKey, {
              creator: creator.username || '',
              creatorName: creator.nickname || '',
              profileUrl,
              verified: creator.verified ?? false,
              followers: creator.followers ?? 0,
              totalLikes: creator.totalLikes ?? 0,
              videoCount: creator.videoCount ?? 0,
              videosFound: 0,
              keywords: new Set(),
              bio: creator.bio || '',
          });
        }

        const current = creators.get(mapKey);

        current.videosFound += 1;

        if (video.keyword) {
            current.keywords.add(video.keyword);
        }
    }

    const headers = [
        'Creator',
        'Creator Name',
        'Profile URL',
        'Verified',
        'Followers',
        'Total Likes',
        'Video Count',
        'Videos Found',
        'Keywords Matched',
        'Bio',
    ];

    const rows = [
        headers,
    ];

    for (const creator of creators.values()) {
        rows.push([
            creator.creator,
            creator.creatorName,
            creator.profileUrl,
            creator.verified,
            creator.followers,
            creator.totalLikes,
            creator.videoCount,
            creator.videosFound,
            [...creator.keywords].join('; '),
            creator.bio,
        ]);
    }
    if (outputPath) {
        const csvRows = rows.map(row => row.map(escapeCsv).join(','));

        const csv = '\uFEFF' + csvRows.join('\n');

        await fs.mkdir(path.dirname(outputPath), {
            recursive: true,
        });

        await fs.writeFile(
            outputPath,
            csv,
            'utf8'
        );
    }


    return {
        rows,
        creatorCount: creators.size,
        outputPath,
    };
}
