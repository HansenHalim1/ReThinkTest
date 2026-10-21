import examples from './data/video-explanations.v1.json' with { type: 'json' };
export type VideoHelp = { videoId: string; videoVersion: number; cueIndex: number; explanation: string; source: 'gateway' | 'curated'; reason?: string; model?: string };
export function demoExplanation(videoId: string, cueIndex: number): string | undefined {
  return examples[videoId as keyof typeof examples]?.[cueIndex];
}
export function readVideoHelp(value: unknown, videoId: string, videoVersion: number, cueIndex: number): VideoHelp | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<VideoHelp>;
  if (v.videoId !== videoId || v.videoVersion !== videoVersion || v.cueIndex !== cueIndex || typeof v.explanation !== 'string' || v.explanation.trim().length < 20 || v.explanation.length > 2000 || !['gateway', 'curated'].includes(v.source || '') || (v.reason !== undefined && typeof v.reason !== 'string') || (v.model !== undefined && typeof v.model !== 'string')) return null;
  return v as VideoHelp;
}
