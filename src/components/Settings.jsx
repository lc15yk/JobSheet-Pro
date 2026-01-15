import { useState, useEffect } from 'react'
import { supabase, checkSubscription } from '../lib/supabase'
import { metaPixelEvents } from '../lib/metaPixel'
import './Settings.css'
import ReportHistory from './ReportHistory'
import SubscriptionBanner from './SubscriptionBanner'

function Settings({ settings, onSave, onCancel, onLogout, isAdmin, onAccessChange, onStatusChange }) {
  const [formData, setFormData] = useState(settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [currentScreen, setCurrentScreen] = useState('menu') // 'menu', 'account', 'subscription', 'company', 'appearance', 'ai', 'history'
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Track when user views subscription page
  useEffect(() => {
    if (currentScreen === 'subscription') {
      metaPixelEvents.viewSubscription()
    }
  }, [currentScreen])

  // Appearance settings
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })
  const [colorScheme, setColorScheme] = useState(() => {
    return localStorage.getItem('colorScheme') || 'purple'
  })

  useEffect(() => {
    loadUserAndSubscription()
    applyTheme(theme, colorScheme)
  }, [])

  const applyTheme = (selectedTheme, selectedColor) => {
    const root = document.documentElement
    root.setAttribute('data-theme', selectedTheme)
    root.setAttribute('data-color', selectedColor)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme, colorScheme)
  }

  const handleColorChange = (newColor) => {
    setColorScheme(newColor)
    localStorage.setItem('colorScheme', newColor)
    applyTheme(theme, newColor)
  }

  const loadUserAndSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const subData = await checkSubscription(user.id)
        setSubscription(subData)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }


  const handleManageSubscription = async () => {
    if (!user) {
      alert('User not found. Please log in again.')
      return
    }

    console.log('Subscription data:', subscription)
    console.log('Customer ID:', subscription?.subscriptionData?.stripe_customer_id)

    if (!subscription?.subscriptionData?.stripe_customer_id) {
      alert('No active subscription found. Please subscribe first.')
      return
    }

    try {
      setLoading(true)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const url = `${backendUrl}/create-portal-session`

      console.log('Calling backend URL:', url)
      console.log('With customer ID:', subscription.subscriptionData.stripe_customer_id)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: subscription.subscriptionData.stripe_customer_id,
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error:', errorData)
        throw new Error(`Backend error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('Portal session data:', data)

      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        throw new Error('No portal URL returned from server')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert(`Error opening subscription management: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Main menu screen
  if (currentScreen === 'menu') {
    return (
      <div className="settings">
        <div className="settings-header">
          <button type="button" className="back-button" onClick={onCancel}>
            ✕ Close
          </button>
          <h2>Settings</h2>
        </div>
        <p className="settings-subtitle">Manage your account and preferences</p>

        <div className="settings-menu">
          <button type="button" className="menu-button" onClick={() => setCurrentScreen('account')}>
            Account <span className="arrow">›</span>
          </button>
          <button type="button" className="menu-button" onClick={() => setCurrentScreen('subscription')}>
            Subscription <span className="arrow">›</span>
          </button>
          <button type="button" className="menu-button" onClick={() => setCurrentScreen('company')}>
            Company <span className="arrow">›</span>
          </button>
          <button type="button" className="menu-button" onClick={() => setCurrentScreen('history')}>
            Report History <span className="arrow">›</span>
          </button>
          {isAdmin && (
            <button type="button" className="menu-button" onClick={() => setCurrentScreen('ai')}>
              AI <span className="arrow">›</span>
            </button>
          )}
          <button type="button" className="menu-button" onClick={() => setCurrentScreen('appearance')}>
            Display <span className="arrow">›</span>
          </button>
          <button type="button" className="menu-button logout-button" onClick={onLogout}>
            Logout <span className="arrow">›</span>
          </button>
        </div>
      </div>
    )
  }

  // Individual screens with back button
  const screenTitles = {
    account: 'Account',
    subscription: 'Subscription',
    company: 'Company Settings',
    history: 'Report History',
    appearance: 'Display & Appearance'
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button type="button" className="back-button" onClick={() => setCurrentScreen('menu')}>
          ‹ Settings
        </button>
        <h2>{screenTitles[currentScreen]}</h2>
      </div>

      {currentScreen === 'account' && (
        <div className="settings-screen">
          <div className="info-card">
            <div className="info-header">
              <h4>Your Account</h4>
              <p className="status-text">Manage your account information</p>
            </div>
            <div className="info-details">
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">User ID</span>
                <span className="detail-value">{user?.id?.substring(0, 8)}...</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account created</span>
                <span className="detail-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <p className="coming-soon">More account settings coming soon!</p>
        </div>
      )}

      {currentScreen === 'company' && (
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Trade / Industry</label>
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              border: '2px dashed var(--border-color)',
              background: 'var(--bg-secondary)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: 'var(--accent-color)',
                fontWeight: '600',
                marginBottom: '5px'
              }}>
                Coming Soon! 🚀
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-tertiary)'
              }}>
                Trade-specific fields are currently in development
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g., ABC HVAC Services"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="companyAddress"
              value={formData.companyAddress || ''}
              onChange={handleChange}
              placeholder="e.g., 22 Hosie Rigg"
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="companyLocation"
              value={formData.companyLocation || ''}
              onChange={handleChange}
              placeholder="e.g., Edinburgh, EH15 3RX"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="contact@company.com"
              />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Logo (Optional)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="file-input" />
            {formData.logo && (
              <div className="logo-preview">
                <img src={formData.logo} alt="Company logo" />
              </div>
            )}
          </div>

          <div className="settings-actions">
            <button type="submit" className="save-btn">Save Settings</button>
            <button type="button" onClick={() => setCurrentScreen('menu')} className="cancel-btn">Cancel</button>
          </div>
        </form>
      )}

      {currentScreen === 'subscription' && (
        <div className="settings-screen">
          <SubscriptionBanner
            onAccessChange={onAccessChange}
            onStatusChange={onStatusChange}
            showBanner={true}
          />

          {subscription?.isPaidActive && (
            <div className="subscription-info">
              <div className="info-card active-subscription">
                <div className="info-header">
                  <h4>Active Subscription</h4>
                  <p className="status-text">Your subscription is active</p>
                </div>
                <div className="info-details">
                  <div className="detail-row">
                    <span className="detail-label">Plan</span>
                    <span className="detail-value">JobSheet Pro - £9.99/month</span>
                  </div>
                  {subscription.subscriptionEnd && (
                    <div className="detail-row">
                      <span className="detail-label">Next billing date</span>
                      <span className="detail-value">
                        {new Date(subscription.subscriptionEnd).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="subscription-actions">
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  Subscription Management
                </h4>
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  className="manage-subscription-btn"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </button>
                <p className="manage-description">
                  Click above to access the Stripe Customer Portal where you can:
                  <br />
                  • Cancel your subscription
                  <br />
                  • Update payment method
                  <br />
                  • View billing history & invoices
                  <br />
                  • Update billing information
                </p>
              </div>
            </div>
          )}

          {subscription?.isTrialActive && (
            <div className="subscription-info">
              <div className="info-card trial-subscription">
                <div className="info-header">
                  <h4>Free Trial Active</h4>
                  <p className="status-text">You're currently on a free trial</p>
                </div>
                <div className="info-details">
                  {subscription.trialEnd && (
                    <div className="detail-row">
                      <span className="detail-label">Trial ends</span>
                      <span className="detail-value">
                        {new Date(subscription.trialEnd).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{user?.email}</span>
                  </div>
                </div>
              </div>
              <p className="trial-note">Subscribe before your trial ends to continue using JobSheet Pro</p>
            </div>
          )}

          {subscription?.noSubscription && (
            <div className="subscription-info">
              <div className="info-card no-subscription">
                <div className="info-header">
                  <h4>No Active Subscription</h4>
                  <p className="status-text">Start your free trial to get started</p>
                </div>
              </div>
            </div>
          )}

          {!subscription?.isPaidActive && !subscription?.isTrialActive && !subscription?.noSubscription && (
            <div className="subscription-info">
              <div className="info-card expired-subscription">
                <div className="info-header">
                  <h4>Subscription Expired</h4>
                  <p className="status-text">Subscribe to continue using JobSheet Pro</p>
                </div>
              </div>
            </div>
          )}


        </div>
      )}

      {currentScreen === 'ai' && (
        <div className="settings-screen">
          <h2>AI Configuration</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>OpenAI API Key</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="openaiApiKey"
                  value={formData.openaiApiKey || ''}
                  onChange={handleChange}
                  placeholder="sk-..."
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="toggle-btn"
                  style={{ padding: '10px 15px' }}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <small style={{ color: '#999', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>OpenAI Dashboard</a>
              </small>
            </div>

            <div className="ai-settings-section">
              <h3>AI Report Generation</h3>
              <p className="ai-description">
                <strong>AI is enabled and ready to use!</strong><br/>
                Powered by OpenAI GPT-4 - generate professional reports instantly.
              </p>
              <div className="ai-status">
                <span className="status-badge">Active</span>
                <span className="status-text">AI reports are enabled for all users</span>
              </div>
            </div>

            <div className="settings-actions">
              <button type="submit" className="save-btn">Save Settings</button>
              <button type="button" onClick={() => setCurrentScreen('menu')} className="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {currentScreen === 'appearance' && (
        <div className="settings-screen">
          <div className="appearance-section">
            <h3>Theme</h3>
            <p className="section-description">Choose between light and dark mode</p>
            <div className="theme-options">
              <button
                type="button"
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="theme-preview dark-preview">
                  <div className="preview-header"></div>
                  <div className="preview-content"></div>
                </div>
                <span className="theme-name">Dark</span>
              </button>
              <button
                type="button"
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="theme-preview light-preview">
                  <div className="preview-header"></div>
                  <div className="preview-content"></div>
                </div>
                <span className="theme-name">Light</span>
              </button>
            </div>
          </div>

          <div className="appearance-section">
            <h3>Color Scheme</h3>
            <p className="section-description">Select your preferred color palette</p>
            <div className="color-options">
              <button
                type="button"
                className={`color-option ${colorScheme === 'purple' ? 'active' : ''}`}
                onClick={() => handleColorChange('purple')}
              >
                <div className="color-preview">
                  <span className="color-dot" style={{ background: '#667eea' }}></span>
                  <span className="color-dot" style={{ background: '#764ba2' }}></span>
                </div>
                <span className="color-name">Purple (Default)</span>
              </button>
              <button
                type="button"
                className={`color-option ${colorScheme === 'blue' ? 'active' : ''}`}
                onClick={() => handleColorChange('blue')}
              >
                <div className="color-preview">
                  <span className="color-dot" style={{ background: '#3b82f6' }}></span>
                  <span className="color-dot" style={{ background: '#1d4ed8' }}></span>
                </div>
                <span className="color-name">Blue</span>
              </button>
              <button
                type="button"
                className={`color-option ${colorScheme === 'green' ? 'active' : ''}`}
                onClick={() => handleColorChange('green')}
              >
                <div className="color-preview">
                  <span className="color-dot" style={{ background: '#10b981' }}></span>
                  <span className="color-dot" style={{ background: '#059669' }}></span>
                </div>
                <span className="color-name">Green</span>
              </button>
              <button
                type="button"
                className={`color-option ${colorScheme === 'amber' ? 'active' : ''}`}
                onClick={() => handleColorChange('amber')}
              >
                <div className="color-preview">
                  <span className="color-dot" style={{ background: '#f59e0b' }}></span>
                  <span className="color-dot" style={{ background: '#d97706' }}></span>
                </div>
                <span className="color-name">Amber</span>
              </button>
              <button
                type="button"
                className={`color-option ${colorScheme === 'red' ? 'active' : ''}`}
                onClick={() => handleColorChange('red')}
              >
                <div className="color-preview">
                  <span className="color-dot" style={{ background: '#ef4444' }}></span>
                  <span className="color-dot" style={{ background: '#dc2626' }}></span>
                </div>
                <span className="color-name">Red</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'history' && (
        <div className="settings-screen">
          <div className="history-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Auto-Delete Notice</h4>
              <p>Reports are automatically deleted after 7 days to save storage space. Make sure to download or copy any reports you need to keep.</p>
            </div>
          </div>
          <ReportHistory />
        </div>
      )}
    </div>
  )
}

export default Settings

