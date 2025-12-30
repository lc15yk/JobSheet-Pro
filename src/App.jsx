import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import JobForm from './components/JobForm'
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
      <header className="app-header">
        <div className="header-content">
          <h1>JobSheet Pro</h1>
          <p className="subtitle">Professional job reports, simplified</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </button>
          )}
          <button
            className="settings-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <SubscriptionBanner
          onAccessChange={setHasAccess}
          onStatusChange={setSubscriptionStatus}
        />

        {showSettings ? (
          <Settings
            settings={companySettings}
            onSave={handleSaveSettings}
            onCancel={() => setShowSettings(false)}
          />
        ) : (
          <JobForm
            companySettings={companySettings}
            hasAccess={hasAccess}
            subscriptionStatus={subscriptionStatus}
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
