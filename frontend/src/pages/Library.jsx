import Card from '@/components/Card';
import { useLyrics } from '@/context/LyricsContext';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Library() {
  // useEffect will now filter based on the global searchTerm from the context
  const { lyricsList, searchTerm, searchLyrics } = useLyrics();

  useEffect(() => {
    // This fetches lyrics based on the term in the Header's search bar
    searchLyrics(searchTerm);
  }, [searchTerm, searchLyrics]);

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Your Library
        </h1>

        {lyricsList.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? `No results found for "${searchTerm}".`
              : "No lyrics uploaded yet. Try uploading some!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lyricsList.map((entry) => (
              // You should have a unique ID for the key and the link
              <Link to={`/lyrics/${entry.id}`} key={entry.id}>
                <Card
                  title={entry.title}
                  artist={entry.artist}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}