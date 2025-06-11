import { Info, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">About This Project</h1>
        </div>

        <p className="text-base leading-relaxed text-muted-foreground">
          This project is a modern lyrics library built for speed, readability, and simplicity. 
          It combines a React Vite frontend with a serverless backend on Cloudflare Workers, powered by D1 and Puppeteer scraping.
        </p>

        <div className="bg-muted rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What It Can Do</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Search and scrape lyrics from multiple sources</li>
            <li>Store and cache lyrics using Cloudflare D1</li>
            <li>Deploy for free using Cloudflare Pages + Workers</li>
            <li>Optimized for mobile and low bandwidth</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Contact & Source</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Github className="w-4 h-4" />
            <a
              href="https://github.com/your-github-repo"
              className="hover:underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:you@example.com"
              className="hover:underline text-sm"
            >
              you@example.com
            </a>
          </div>
        </div>

        <div className="pt-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}