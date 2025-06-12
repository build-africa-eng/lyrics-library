import Header from '@/components/Header';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    // Main container for the entire app view
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      {/* The Header is sticky at the top */}
      <Header />
      
      {/* This div holds the main page content */}
      {/* The pt-16 (padding-top: 4rem) prevents content from hiding under the sticky header */}
      <div className="pt-20"> 
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Outlet is where your page components (Home, Library, Settings) will be rendered by the router */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}