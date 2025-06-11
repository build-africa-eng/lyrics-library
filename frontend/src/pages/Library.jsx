import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import { useLyrics } from '@/context/LyricsContext';
import { useEffect } from 'react';

export default function Library() {
  const { lyricsList, searchLyrics } = useLyrics();

  useEffect(() => {
    searchLyrics(''); // Fetch all lyrics
  }, [searchLyrics]);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Your Library
        </h1>

        {lyricsList.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No lyrics uploaded yet. Try uploading some!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lyricsList.map((entry) => (
              <Card
                key={`${entry.artist}-${entry.title}`}
                title={entry.title}
                artist={entry.artist}
                lyrics={entry.lyrics}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}