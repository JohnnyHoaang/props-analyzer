import './global.css';
import { Nav } from './components/nav';

export const metadata = {
  title: 'Props Analyzer',
  description:
    'Browse NBA players and completed game logs (mock data, Phase 1).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Nav />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
