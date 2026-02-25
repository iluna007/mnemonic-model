import './App.css'
import { NavBar } from './components/NavBar'
import { Routes, Route } from 'react-router-dom'
import { ViewerPage } from './pages/ViewerPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'

function App() {
  return (
    <div className="app-root">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ViewerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
