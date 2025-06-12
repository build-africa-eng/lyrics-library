import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; // Import the new layout
import Home from './pages/Home';
import Library from '@/pages/Library';
import Settings from '@/components/Settings';
import NotFound from '@/pages/NotFound';
import About from '@/pages/About';
// ... import other components

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes inside AppLayout will share the same Header and structure */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/About" element={<About />} />
        </Route>
        
        {/* A route for a page that SHOULDN'T have the main layout, like a 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;