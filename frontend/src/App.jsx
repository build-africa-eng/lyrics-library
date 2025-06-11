import { useState } from 'react'
import SearchBar from './components/SearchBar'
import LyricsDisplay from './components/LyricsDisplay'

export default function App() {
  const [lyrics, setLyrics] = useState(null)

  return (
    <main className="p-4 max-w-xl mx-auto min-h-screen flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">🎶 Lyrics Finder</h1>
      <SearchBar onResult={setLyrics} />
      {lyrics && <LyricsDisplay data={lyrics} />}
    </main>
  )
}