import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import { useEffect, useState } from "react";

export default function Library() {
  const [lyrics, setLyrics] = useState([]);

  useEffect(() => {
    async function fetchLyrics() {
      try {
        const res = await fetch("/api/lyrics");
        const data = await res.json();
        setLyrics(data || []);
      } catch (err) {
        console.error("Failed to load lyrics:", err);
      }
    }

    fetchLyrics();
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Your Library
        </h1>

        {lyrics.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No lyrics uploaded yet. Try uploading some!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lyrics.map((entry) => (
              <Card
                key={entry.id}
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