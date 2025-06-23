import { Routes, Route } from 'react-router-dom';
import { LyricsProvider } from '@/context/LyricsContext';
import Home from './pages/Home';
import Library from './pages/Library';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

function App() {
  return (
    <LyricsProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LyricsProvider>
  );
}

export default App;
