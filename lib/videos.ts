export type TranscriptCue = { startSeconds: number; endSeconds: number; text: string };
export type ConceptVideo = {
  id: string; version: number; topicId: string; skillIds: string[];
  title: string; summary: string; language: string; durationSeconds: number;
  renderer: string; hasAudio: boolean; width: number; height: number;
  mimeType: 'video/mp4'; videoUrl: string; posterUrl: string; captionsUrl: string;
  transcript: TranscriptCue[];
};
export type VideoCatalog = { schemaVersion: 1; catalogVersion: string; videos: ConceptVideo[] };

function webUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function readVideoCatalog(value: unknown, topicId: string): VideoCatalog | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<VideoCatalog>;
  if (c.schemaVersion !== 1 || typeof c.catalogVersion !== 'string' || !Array.isArray(c.videos) || c.videos.length > 100) return null;
  const ids = new Set<string>();
  for (const v of c.videos) {
    if (!v || typeof v !== 'object' || typeof v.id !== 'string' || ids.has(v.id) || v.topicId !== topicId || !Number.isInteger(v.version) || v.version < 1 ||
        typeof v.title !== 'string' || typeof v.summary !== 'string' || typeof v.language !== 'string' || typeof v.renderer !== 'string' || typeof v.hasAudio !== 'boolean' ||
        !Number.isFinite(v.durationSeconds) || v.durationSeconds <= 0 || !Number.isFinite(v.width) || v.width <= 0 || !Number.isFinite(v.height) || v.height <= 0 ||
        v.mimeType !== 'video/mp4' || !webUrl(v.videoUrl) || !webUrl(v.posterUrl) || !webUrl(v.captionsUrl) ||
        !Array.isArray(v.skillIds) || !v.skillIds.every(id => typeof id === 'string') || !Array.isArray(v.transcript) || v.transcript.length > 1000) return null;
    let previousEnd = 0;
    for (const cue of v.transcript) {
      if (!cue || typeof cue.text !== 'string' || !Number.isFinite(cue.startSeconds) || !Number.isFinite(cue.endSeconds) || cue.startSeconds < previousEnd || cue.endSeconds <= cue.startSeconds || cue.endSeconds > v.durationSeconds) return null;
      previousEnd = cue.endSeconds;
    }
    ids.add(v.id);
  }
  return c as VideoCatalog;
}
