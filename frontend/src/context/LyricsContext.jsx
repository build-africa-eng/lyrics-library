// src/context/LyricsContext.jsx
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
        setLyricsList(Array.isArray(data) ? data : [data]);
      }
    } catch (err) {
      setError(err.message);
      setLyricsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLyrics = useCallback(async ({ title, artist, lyrics }) => {
    setLoading(true);
    setError(null);
    try {
      await api.addLyrics({ title, artist, lyrics });
      await searchLyrics(`${title} ${artist}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchLyrics]);

  return (
    <LyricsContext.Provider
      value={{
        lyricsList,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        searchLyrics,
        addLyrics,
      }}
    >
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