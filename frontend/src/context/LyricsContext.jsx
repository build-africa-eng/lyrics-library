import { createContext, useContext, useState } from "react";
import * as api from "@/utils/api";

const LyricsContext = createContext();

export function LyricsProvider({ children }) {
  const [lyricsList, setLyricsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchLyrics = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchLyrics(query);
      setLyricsList(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
      setLyricsList([]);
    } finally {
      setLoading(false);
    }
  };

  const addLyrics = async (details) => {
    setLoading(true);
    setError(null);
    try {
      await api.addLyrics(details);
      await searchLyrics(`${details.title} ${details.artist}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LyricsContext.Provider value={{ lyricsList, loading, error, searchLyrics, addLyrics }}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  return useContext(LyricsContext);
}