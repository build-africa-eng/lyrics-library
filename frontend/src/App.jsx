// src/App.jsx
import { LyricsProvider } from './context/LyricsContext';
import { Routes, Route } from 'react-router-dom';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Library from '@/pages/Library';

export default function App() {
  return (
    <LyricsProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </LyricsProvider>
  );
}