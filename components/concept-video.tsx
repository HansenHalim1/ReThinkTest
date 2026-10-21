'use client';

import { useEffect, useState } from 'react';
import { Film, RefreshCw } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { demoVideoCatalog } from '@/lib/demo-videos';
import { readVideoCatalog, type ConceptVideo } from '@/lib/videos';
import TranscriptHelp from '@/components/transcript-help';
import StudyVideo from '@/components/study-video';
import { fromVideo } from '@/lib/study-chat';

export default function ConceptVideoPanel({ topicId, demo = false }: { topicId: string; demo?: boolean }) {
  const [videos, setVideos] = useState<ConceptVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setVideos([]);
    if (demo && preview) {
      setVideos(demoVideoCatalog(topicId, window.location.origin).videos);
      setLoading(false);
      return () => controller.abort();
    }
    void (async () => {
      try {
        const response = await fetch(`${apiUrl('/api/videos')}?topicId=${encodeURIComponent(topicId)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), cache: 'no-store' });
        if (!response.ok) throw Error();
        const catalog = readVideoCatalog(await response.json(), topicId);
        if (!catalog) throw Error();
        if (!controller.signal.aborted) setVideos(catalog.videos);
      } catch {
        if (!controller.signal.aborted) setError('Video belum dapat dimuat. Periksa koneksi lalu coba lagi.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [topicId, demo, preview, reload]);

  if (loading) return <p className="video-status" role="status">Memuat video konsep…</p>;
  if (error) return <div className="video-status" role="alert"><p>{error}</p><button type="button" className="secondary" onClick={() => setReload(v => v + 1)}><RefreshCw size={16} />Coba lagi</button>{demo && <button type="button" className="secondary" onClick={() => setPreview(true)}>Putar video contoh</button>}</div>;
  if (!videos.length) return <div className="video-empty"><Film size={30} /><h2>Video untuk topik ini belum tersedia</h2><p>Gunakan Rumus dan Visualisasi untuk menjelajahi konsep ini. Katalog video dapat dimuat ulang ketika topik ini tersedia.</p></div>;
  return <div className="concept-video-list">{demo && preview && <p className="video-note" role="status">Pratinjau video contoh. <button type="button" className="text-button" onClick={() => setPreview(false)}>Muat katalog video</button></p>}{videos.map(video => <ConceptVideoCard key={`${video.id}-${reload}`} video={video} demo={demo} />)}</div>;
}

function ConceptVideoCard({ video, demo }: { video: ConceptVideo; demo: boolean }) {
  const [selectedCue, setSelectedCue] = useState<number | null>(null);
  return <article className="concept-video-card">
    <div className="video-heading"><div><span className="eyebrow">VIDEO KONSEP</span><h2>{video.title}</h2><p>{video.summary}</p></div><span className="tag neutral">{Math.round(video.durationSeconds)} detik</span></div>
    <StudyVideo source={fromVideo(video)} onAsk={setSelectedCue} />
    <p className="video-note">{video.hasAudio ? 'Tersedia teks Bahasa Indonesia.' : 'Animasi tanpa suara · teks Bahasa Indonesia tersedia.'} Gunakan layar penuh untuk membaca diagram.</p>
    {selectedCue !== null && <TranscriptHelp key={`${video.id}-${selectedCue}`} video={video} cueIndex={selectedCue} demo={demo} onClose={() => setSelectedCue(null)} />}
  </article>;
}
