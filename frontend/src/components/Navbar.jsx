import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  const linkClass = (path) =>
    `px-4 py-2 ${pathname === path ? 'text-primary font-bold' : 'text-muted-foreground'}`

  return (
    <nav className="w-full flex justify-between items-center px-6 py-3 bg-background shadow-sm sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold">LyricsLib</Link>
      <div className="flex gap-4">
        <Link to="/" className={linkClass('/')}>Home</Link>
        <Link to="/about" className={linkClass('/about')}>About</Link>
      </div>
    </nav>
  )
}