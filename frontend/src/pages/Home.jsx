import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import LyricsDisplay from "@/components/LyricsDisplay";
import Upload from "@/components/Upload";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Lyrics Library
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Search, upload, and explore lyrics instantly.
          </p>
        </section>

        <SearchBar />

        <Upload />

        <LyricsDisplay />
      </main>
    </>
  );
}