// src/context/LyricsContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '@/utils/api';

const LyricsContext = createContext();

export function LyricsProvider({ children }) {
  const [lyricsList, setLyricsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Search lyrics by query.
   * If not found, falls back to scraping using provided URL.
   */
  const searchLyrics = useCallback(async (query, scrapeUrl = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchLyricsWithFallback(query, scrapeUrl);
      setLyricsList(data.lyrics ? data.lyrics : [data]);
    } catch (err) {
      setError(err.message);
      setLyricsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually add new lyrics to the database.
   */
  const addLyrics = useCallback(async (newLyricData) => {
    setLoading(true);
    setError(null);
    try {
      const addedLyric = await api.addLyrics(newLyricData);
      setLyricsList((prevList) => [addedLyric, ...prevList]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    lyricsList,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    searchLyrics, // takes query, optional scrape URL
    addLyrics,
  };

  return (
    <LyricsContext.Provider value={value}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  const context = useContext(LyricsContext);
  if (!context) {
    throw new Error('useLyrics must be used within a LyricsProvider');
  }
  return context;
}
