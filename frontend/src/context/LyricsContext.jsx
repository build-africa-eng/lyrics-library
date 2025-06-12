import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '@/utils/api';

const LyricsContext = createContext();

export function LyricsProvider({ children }) {
  const [lyricsList, setLyricsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchLyrics = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      if (!query) {
        const data = await api.fetchAllLyrics();
        setLyricsList(Array.isArray(data) ? data : []);
      } else {
        const data = await api.fetchLyrics(query);
        // Ensure result is always an array for consistent state
        setLyricsList(Array.isArray(data) ? data : (data ? [data] : []));
      }
    } catch (err) {
      setError(err.message);
      setLyricsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Improved logic: avoids a second network call
  const addLyrics = useCallback(async (newLyricData) => {
    setLoading(true);
    setError(null);
    try {
      // The API should return the newly created lyric object
      const addedLyric = await api.addLyrics(newLyricData);
      // Add the new lyric to the existing list in state
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
    searchLyrics,
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