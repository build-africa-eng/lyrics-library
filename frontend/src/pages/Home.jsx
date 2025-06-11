import Navbar from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import LyricsDisplay from '@/components/LyricsDisplay';
import Upload from '@/components/Upload';
import { useLyrics } from '@/context/LyricsContext';
import { useState } from 'react';

export default function Home() {
  const { lyricsList, loading, error } = useLyrics();
  const [searchValue, setSearchValue] = useState('');

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Lyrics Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Search, upload, and explore lyrics instantly.
          </p>
        </section>

        <SearchForm />
        <SearchBar value={searchValue} onChange={setSearchValue} />
        <Upload />
        {loading && <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {lyricsList.length > 0 && (
          <LyricsDisplay lyrics={lyricsList[0].lyrics} />
        )}
      </main>
    </>
  );
}