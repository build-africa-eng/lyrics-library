export default function About() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-4xl font-bold">About Lyrics Library</h1>
        <p className="text-muted-foreground">
          This project helps you search and view lyrics for your favorite songs.
          It uses a custom Cloudflare Worker + Puppeteer backend to scrape lyrics
          from multiple sources.
        </p>
        <p className="text-muted-foreground">
          It's lightweight, open source, and built with modern tools like React,
          Tailwind CSS v4, Lucide icons, and Vite for performance.
        </p>
      </div>
    </main>
  )
}