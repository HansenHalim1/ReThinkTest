// Public pilot metadata only. No assessment answers or user state.
import catalog from './data/video-catalog.v1.json' with { type: 'json' };
import type { VideoCatalog } from './videos.ts';
export function demoVideoCatalog(topicId: string, origin: string): VideoCatalog {
  const base = new URL('/videos/', origin);
  return {
    schemaVersion: 1, catalogVersion: catalog.catalogVersion,
    videos: catalog.videos.filter(v => v.topicId === topicId).map(({ videoFile, posterFile, captionsFile, ...v }) => ({
      ...v, mimeType: 'video/mp4', videoUrl: new URL(videoFile, base).href,
      posterUrl: new URL(posterFile, base).href, captionsUrl: new URL(captionsFile, base).href,
    })),
  };
}
