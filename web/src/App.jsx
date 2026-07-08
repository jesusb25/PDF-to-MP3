import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import { useTheme } from './hooks/useTheme.js'
import Home from './pages/Home.jsx'
import Mission from './pages/Mission.jsx'
import Demo from './pages/Demo.jsx'

export default function App() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar theme={theme} setTheme={setTheme} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
