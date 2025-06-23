import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LyricsProvider } from '@/context/LyricsContext';
import Home from './Home';
import Library from './Library';
import About from './About';
import NotFound from './NotFound';
import Settings from './Settings';

function App() {
  return (
    <LyricsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LyricsProvider>
  );
}

export default App;
