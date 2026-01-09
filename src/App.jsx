import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import JobForm from './components/JobForm'
import PDFJobSheet from './components/PDFJobSheet'
import Settings from './components/Settings'
import Login from './components/Login'
import Signup from './components/Signup'
import ResetPassword from './components/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import SubscriptionBanner from './components/SubscriptionBanner'
import { supabase } from './lib/supabase'

// Admin email - only this user can see Settings
const ADMIN_EMAIL = 'lewisgeorgecopestake@gmail.com'

function MainApp() {
  const [showSettings, setShowSettings] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState('paragraph') // 'paragraph' or 'pdf'
  const [companySettings, setCompanySettings] = useState(() => {
    const saved = localStorage.getItem('companySettings')
    return saved ? JSON.parse(saved) : {
      companyName: '',
      contactEmail: '',
      contactPhone: '',
      logo: null,
      openaiApiKey: '' // OpenAI API key - user needs to add their own
    }
  })

  // Apply saved theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    const savedColor = localStorage.getItem('colorScheme') || 'purple'
    const root = document.documentElement
    root.setAttribute('data-theme', savedTheme)
    root.setAttribute('data-color', savedColor)
  }, [])

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

  const handleSaveSettings = (settings) => {
    setCompanySettings(settings)
    localStorage.setItem('companySettings', JSON.stringify(settings))
    setShowSettings(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="app">
      {!showSettings && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1>JobSheet Pro</h1>
              <select
                className="view-mode-dropdown"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                style={{ display: 'block', minWidth: '150px' }}
              >
                <option value="paragraph">📄 Paragraph</option>
                <option value="pdf">📋 PDF</option>
              </select>
            </div>
            <p className="subtitle">Professional job reports, simplified</p>
          </div>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>
      )}

      <main className="app-main">
        {!showSettings && (
          <SubscriptionBanner
            onAccessChange={setHasAccess}
            onStatusChange={setSubscriptionStatus}
          />
        )}

        {showSettings ? (
          <Settings
            settings={companySettings}
            onSave={handleSaveSettings}
            onCancel={() => setShowSettings(false)}
            onLogout={handleLogout}
            isAdmin={isAdmin}
          />
        ) : viewMode === 'pdf' ? (
          <PDFJobSheet
            companySettings={companySettings}
            hasAccess={hasAccess}
            subscriptionStatus={subscriptionStatus}
          />
        ) : (
          <JobForm
            companySettings={companySettings}
            hasAccess={hasAccess}
            subscriptionStatus={subscriptionStatus}
            viewMode={viewMode}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Built for engineers who value their time</p>
      </footer>
    </div>
  )
}

function App() {
  useEffect(() => {
    // Handle auth state changes (including email confirmation redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('✅ User authenticated:', session?.user?.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
