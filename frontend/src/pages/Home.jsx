import { Search } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <Search className="w-8 h-8 text-primary" />
      <h1 className="text-3xl font-bold">Lyrics Finder</h1>
      <p className="text-muted-foreground text-center">
        Enter a song title and artist to find the lyrics.
      </p>
    </div>
  )
}