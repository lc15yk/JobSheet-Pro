import { useState } from 'react'
import './Settings.css'

function Settings({ settings, onSave, onCancel }) {
  const [formData, setFormData] = useState(settings)
  const [showApiKey, setShowApiKey] = useState(false)

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

  return (
    <div className="settings">
      <h2>Company Settings</h2>
      <p className="settings-subtitle">Customize your company branding for reports</p>

      <form onSubmit={handleSubmit} className="settings-form">
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
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="file-input"
          />
          {formData.logo && (
            <div className="logo-preview">
              <img src={formData.logo} alt="Company logo" />
            </div>
          )}
        </div>

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
              {showApiKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <small style={{ color: '#999', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>OpenAI Dashboard</a>
          </small>
        </div>

        <div className="ai-settings-section">
          <h3>✨ AI Report Generation</h3>
          <p className="ai-description">
            <strong>✅ AI is enabled and ready to use!</strong><br/>
            Powered by OpenAI GPT-4 - generate professional reports instantly.
          </p>
          <div className="ai-status">
            <span className="status-badge">🟢 Active</span>
            <span className="status-text">AI reports are enabled for all users</span>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="save-btn">
            💾 Save Settings
          </button>
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings

