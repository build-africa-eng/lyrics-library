import { cn } from '@/lib/cn';

export default function About() {
  return (
    <div>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          About Lyrics Library
        </h1>

        <p className={cn('text-gray-700 dark:text-gray-300 leading-relaxed')}>
          Lyrics Library is a lightweight, modern web app that lets you find and upload song lyrics from various sources. 
          It’s open-source, serverless, and built for speed and simplicity.
        </p>

        <div className="space-y-3">
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100">
            Key Features
          </h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Instant search from multiple lyric sources</li>
            <li>Upload your own lyrics for storage</li>
            <li>Fast, serverless backend on Cloudflare</li>
            <li>Mobile-first and privacy-friendly design</li>
          </ul>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Built with ❤️ using React, Vite, Tailwind CSS, and Cloudflare Workers.
        </p>
      </main>
    </div>
  );
}