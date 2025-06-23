import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import { useLyrics } from '@/context/LyricsContext';

export default function SearchForm() {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const { searchLyrics, loading, error } = useLyrics();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!artist || !title) return;

    const query = `${artist} ${title}`;
    await searchLyrics(query, url || null); // Pass scrape URL fallback if provided
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-4">
      <Input
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
      />
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Optional lyrics source URL (e.g. Genius.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </Button>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
    </form>
  );
}
