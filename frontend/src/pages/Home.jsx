import LyricsDisplay from '@/components/LyricsDisplay';
import Upload from '@/components/Upload';
import { useLyrics } from '@/context/LyricsContext';

// Notice there is no <Header /> here anymore!
export default function Home() {
  const { lyricsList, loading, error } = useLyrics();

  return (
    // The <main> tag and wrapper divs are now in AppLayout.jsx
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Lyrics Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Search, upload, and explore lyrics instantly.
        </p>
      </section>

      <Upload />

      {loading && <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      
      {lyricsList.length > 0 && (
        <LyricsDisplay lyrics={lyricsList[0].lyrics} />
      )}
    </div>
  );
}