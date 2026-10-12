import type { Metadata } from 'next';
import './globals.css';
import './visuals.css';
export const metadata: Metadata = {
  title: 'ReThink — Pahami, bukan sekadar jawab',
  description: 'Temukan hambatan konsep matematika, belajar dengan bimbingan, dan uji pemahaman secara mandiri.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
