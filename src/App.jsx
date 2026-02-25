import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { NavBar } from './components/NavBar'
import { Routes, Route } from 'react-router-dom'
import { ViewerPage } from './pages/ViewerPage'
import { GalleryPage } from './pages/GalleryPage'
import { MyModelsPage } from './pages/MyModelsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'

function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <NavBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ViewerPage />} />
            <Route path="/view/:modelId" element={<ViewerPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/models" element={<MyModelsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
