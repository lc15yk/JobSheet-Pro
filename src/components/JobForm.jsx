import { useState } from 'react'
import { metaPixelEvents } from '../lib/metaPixel'
import './JobForm.css'

function JobForm({ companySettings, hasAccess = true, subscriptionStatus = null, viewMode = 'paragraph' }) {
  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    siteName: '',
    systemType: '',
    engineerName: localStorage.getItem('engineerName') || '',
    jobDate: new Date().toISOString().split('T')[0],
    timeArrival: '',
    timeDeparture: ''
  })

  const [workDescription, setWorkDescription] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [detailLevel, setDetailLevel] = useState('standard') // 'brief', 'standard', 'detailed'

  const [generatedReport, setGeneratedReport] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'engineerName') {
      localStorage.setItem('engineerName', value)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport)
    alert('✅ Report copied to clipboard!')
  }

  const generateReport = async (e) => {
    e.preventDefault()

    // Check subscription access
    if (!hasAccess) {
      // Show different message based on subscription status
      if (subscriptionStatus?.noSubscription) {
        alert('🎁 Please start your free trial or subscribe to generate reports.\n\nClick "Start Free Trial" above to get 72 hours of unlimited access!')
      } else {
        alert('⚠️ Your subscription has expired. Please renew to continue generating reports.')
      }
      return
    }

    // API key is pre-configured, no need to check

    if (!workDescription.trim()) {
      alert('⚠️ Please describe the work performed')
      return
    }

    setIsGenerating(true)

    try {
      // Build the prompt with detail level instruction
      let detailInstruction = ''
      if (detailLevel === 'brief') {
        detailInstruction = '\n\nWrite a BRIEF report - keep it short and to the point, around 2-3 sentences.'
      } else if (detailLevel === 'detailed') {
        detailInstruction = '\n\nWrite a DETAILED report - include more context and explanation, around 5-7 sentences.'
      } else {
        detailInstruction = '\n\nWrite a STANDARD report - clear and professional, around 3-4 sentences.'
      }

      const prompt = `Site name: ${formData.siteName}
Work performed: ${workDescription}
${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}${detailInstruction}`

      const systemPrompt = `You are a professional job sheet writer for trades and engineers.

Your task is to turn short, basic, or poorly written notes into a clear, realistic, and professional job sheet.

Write in plain English, as if a real engineer wrote it.
Keep the tone professional but natural — not robotic.

Always write job sheets in the third person using "Engineer" or "Operative".
Do not use "I", "we", or first-person language unless the user explicitly provides a name and asks for first-person wording.
Refer to "Engineer" only once at the start of the job sheet unless clarity requires otherwise.

Use "Engineer" as a proper noun. Do not use "the engineer" anywhere in the job sheet.

Avoid using unnecessary repetition of titles.

Always include, where relevant:
	•	Reason for attendance
	•	What was found
	•	What action was taken
	•	Whether the job was completed or left outstanding
	•	Whether a return visit is required

If a device or part is mentioned, clearly name it.
If a replacement is mentioned, state that it was replaced.

Never state that parts were replaced unless the input explicitly says they were replaced.
Phrases such as "needs replacing", "requires replacement", or "to be replaced" mean the work has NOT been completed.

Do not invent:
	•	Test readings or values
	•	Certificates or compliance documents
	•	Unsafe or legally sensitive statements

You may improve wording and structure, but you must not change the meaning of the input or assume work was completed unless it is clearly stated.

Avoid stating that a job is incomplete unless explicitly requested. Use neutral wording such as "a return visit will be required" instead.

Keep responses clear, concise, and suitable for invoices, reports, or client records.

Write the job sheet as a single paragraph. Do not use headings, bullet points, bold text, brackets, or special formatting.`

      // Call our backend instead of OpenAI directly
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const response = await fetch(`${backendUrl}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          detailLevel
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const data = await response.json()
      setGeneratedReport(data.report)

      // Track report generation
      metaPixelEvents.generateReport()

      // Save to history
      saveToHistory({
        type: 'paragraph',
        title: formData.siteName || 'Untitled Report',
        content: data.report,
        formData: formData
      })
    } catch (error) {
      console.error('Report Generation Error:', error)
      alert(`❌ Failed to generate report: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveToHistory = (reportData) => {
    const history = JSON.parse(localStorage.getItem('reportHistory') || '[]')
    const newReport = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...reportData
    }
    history.unshift(newReport) // Add to beginning
    // Keep only last 50 reports
    const trimmedHistory = history.slice(0, 50)
    localStorage.setItem('reportHistory', JSON.stringify(trimmedHistory))
  }



  return (
    <div className="job-form-container" style={{ position: 'relative' }}>
      {/* Disable form if no access */}
      {!hasAccess && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          borderRadius: '12px',
          pointerEvents: 'all'
        }} />
      )}
      <form className="job-form" onSubmit={generateReport}>
        {/* Work Description */}
        <div className="work-details">
          <div className="form-group">
            <label htmlFor="work-description">Describe the work performed</label>
            <textarea
              id="work-description"
              name="workDescription"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows="8"
              placeholder="Include keywords in your short description..."
              required
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck="true"
              inputMode="text"
              style={{
                fontSize: '16px',
                padding: '16px',
                lineHeight: '1.6',
                minHeight: '200px',
                resize: 'vertical',
                WebkitUserSelect: 'text',
                userSelect: 'text'
              }}
            />
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label htmlFor="additional-notes">Additional notes (optional)</label>
            <textarea
              id="additional-notes"
              name="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows="6"
              placeholder="Any additional information, recommendations, or follow-up required..."
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck="true"
              inputMode="text"
              style={{
                fontSize: '16px',
                padding: '16px',
                lineHeight: '1.6',
                minHeight: '150px',
                resize: 'vertical',
                WebkitUserSelect: 'text',
                userSelect: 'text'
              }}
            />
          </div>

          {/* Detail Level */}
          <div className="form-group">
            <label>Report detail level</label>
            <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
              <label className="radio-label" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="detailLevel"
                  value="brief"
                  checked={detailLevel === 'brief'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>Brief (2-3 sentences)</span>
              </label>
              <label className="radio-label" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="detailLevel"
                  value="standard"
                  checked={detailLevel === 'standard'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>Standard (3-4 sentences)</span>
              </label>
              <label className="radio-label" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="detailLevel"
                  value="detailed"
                  checked={detailLevel === 'detailed'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>Detailed (5-7 sentences)</span>
              </label>
            </div>
          </div>
        </div>

        <button type="submit" className="generate-btn" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <span className="btn-icon">⏳</span>
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">✨</span>
              <span>Generate Report</span>
            </>
          )}
        </button>
      </form>

      {/* Generated Report Output */}
      {generatedReport && (
        <div className="report-output">
          <div className="report-header">
            <h3>Your Professional Report</h3>
            <button onClick={copyToClipboard} className="copy-btn">
              📋 Copy to Clipboard
            </button>
          </div>
          <div className="report-content">
            {generatedReport}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobForm

