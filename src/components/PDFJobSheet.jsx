import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import './PDFJobSheet.css'

// Get next job number from localStorage
const getNextJobNumber = () => {
  const lastJobNumber = localStorage.getItem('lastJobNumber')
  if (!lastJobNumber) {
    return '00001'
  }
  const nextNumber = parseInt(lastJobNumber) + 1
  return nextNumber.toString().padStart(5, '0')
}

function PDFJobSheet({ companySettings, hasAccess = true, subscriptionStatus = null }) {

  const [formData, setFormData] = useState({
    // 2️⃣ THEIR DETAILS (Customer / Site)
    customerCompanyName: '',
    siteAddress: '',
    siteContactName: '',
    siteContactPhone: '',

    // 3️⃣ JOB DETAILS
    jobNumber: getNextJobNumber(),
    jobDate: new Date().toISOString().split('T')[0],
    engineerName: localStorage.getItem('engineerName') || '',
    jobType: 'Call-out', // Call-out / Service / Install

    // 4️⃣ WORK CARRIED OUT
    workCompleted: '',
    partsUsed: '',
    followUpRequired: 'No', // Yes / No

    // 5️⃣ SIGN-OFF
    customerName: '',
    dateSigned: new Date().toISOString().split('T')[0]
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [detailLevel, setDetailLevel] = useState('standard') // 'brief', 'standard', 'detailed'
  const [signatureData, setSignatureData] = useState(null) // Store signature as base64 image
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef(null)

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'engineerName') {
      localStorage.setItem('engineerName', value)
    }
  }

  // Generate AI-enhanced description for PDF (called during PDF generation)
  const generateAIDescriptionForPDF = async (inputText) => {
    if (!inputText.trim()) {
      return inputText
    }

    try {
      const prompt = `Site name: ${formData.customerCompanyName || 'N/A'}
Work performed: ${inputText}
Job type: ${formData.jobType}`

      // Determine sentence count based on detail level
      let sentenceGuidance = ''
      if (detailLevel === 'brief') {
        sentenceGuidance = 'Write 3-4 sentences maximum. Keep it concise and to the point.'
      } else if (detailLevel === 'standard') {
        sentenceGuidance = 'Write 5-7 sentences. Provide a good level of detail without being excessive.'
      } else if (detailLevel === 'detailed') {
        sentenceGuidance = 'Write 8-12 sentences. Provide comprehensive detail about all aspects of the work.'
      }

      const systemPrompt = `You are a professional job sheet writer for trades and engineers.

Your task is to turn short, basic, or poorly written notes into a clear, realistic, and professional job sheet.

${sentenceGuidance}

Write in plain English, as if a real engineer wrote it.
Keep the tone professional but natural — not robotic.

Always write job sheets in the third person using "Engineer" or "Operative".
Do not use "I", "we", or first-person language unless the user explicitly provides a name and asks for first-person wording.
Refer to "Engineer" only once at the start of the job sheet unless clarity requires otherwise.

Use "Engineer" as a proper noun. Do not use "the engineer" anywhere in the job sheet.

Avoid using unnecessary repetition of titles.

Always include, where relevant:
  • Reason for attendance
  • What was found
  • What action was taken
  • Whether the job was completed or left outstanding
  • Whether a return visit is required

If a device or part is mentioned, clearly name it.
If a replacement is mentioned, state that it was replaced.

Never state that parts were replaced unless the input explicitly says they were replaced.
Phrases such as "needs replacing", "requires replacement", or "to be replaced" mean the work has NOT been completed.

Do not invent:
  • Test readings or values
  • Certificates or compliance documents
  • Unsafe or legally sensitive statements

You may improve wording and structure, but you must not change the meaning of the input or assume work was completed unless it is clearly stated.

Avoid stating that a job is incomplete unless explicitly requested. Use neutral wording such as "a return visit will be required" instead.

Keep responses clear, concise, and suitable for invoices, reports, or client records.

Write the job sheet as a single paragraph. Do not use headings, bullet points, bold text, brackets, or special formatting.

IMPORTANT: You must write exactly the number of sentences specified above based on the detail level. Count your sentences carefully.`

      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const response = await fetch(`${backendUrl}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          detailLevel: detailLevel
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate description')
      }

      const data = await response.json()
      return data.report
    } catch (error) {
      console.error('AI Generation Error:', error)
      // Return original text if AI fails
      return inputText
    }
  }

  // Signature Pad Functions
  const startDrawing = (e) => {
    e.preventDefault() // Prevent scrolling on touch devices
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault() // Prevent scrolling on touch devices

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    // Save signature as base64
    const canvas = canvasRef.current
    if (canvas) {
      const signatureImage = canvas.toDataURL('image/png')
      setSignatureData(signatureImage)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    // Clear and reset to white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }

  const generatePDF = async (e) => {
    e.preventDefault()

    // Check subscription access
    if (!hasAccess) {
      if (subscriptionStatus?.noSubscription) {
        alert('🎁 Please start your free trial or subscribe to generate PDFs.\n\nClick "Start Free Trial" above to get 72 hours of unlimited access!')
      } else {
        alert('⚠️ Your subscription has expired. Please renew to continue generating PDFs.')
      }
      return
    }

    setIsGenerating(true)

    try {
      // Generate AI-enhanced work description
      const enhancedWorkDescription = await generateAIDescriptionForPDF(formData.workCompleted)

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let yPos = margin

      // Helper function to add watermark to current page
      const addWatermark = () => {
        try {
          // Create a semi-transparent watermark
          doc.setGState(new doc.GState({ opacity: 0.5 }))

          // Position watermark in bottom right
          const watermarkX = pageWidth - margin - 3
          const watermarkY = pageHeight - margin - 3

          // Add "JobSheet Pro." text - bold and prominent
          doc.setTextColor(0, 0, 0) // Black text
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('JobSheet Pro.', watermarkX, watermarkY, { align: 'right' })

          // Reset opacity and color
          doc.setGState(new doc.GState({ opacity: 1.0 }))
          doc.setTextColor(0, 0, 0)
        } catch (err) {
          console.error('Error adding watermark:', err)
        }
      }

      // Helper function to add text with word wrap
      const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)

        // Check if we need a new page
        if (yPos + (lines.length * fontSize * 0.5) > pageHeight - margin) {
          addWatermark() // Add watermark to current page before creating new page
          doc.addPage()
          yPos = margin
        }

        doc.text(lines, margin, yPos)
        yPos += lines.length * fontSize * 0.5 + 5
      }

      // ========================================
      // 1️⃣ YOUR DETAILS (Company Info at Top)
      // ========================================

      // Company Logo
      if (companySettings.logo) {
        try {
          doc.addImage(companySettings.logo, 'PNG', margin, yPos, 40, 20)
          yPos += 25
        } catch (err) {
          console.error('Error adding logo:', err)
        }
      }

      // Title - use company name if available, otherwise "JOB SHEET"
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const headerTitle = companySettings?.companyName || 'JOB SHEET'
      doc.text(headerTitle, pageWidth / 2, yPos, { align: 'center' })
      yPos += 12

      // Horizontal line
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10

      // ========================================
      // 2️⃣ THEIR DETAILS (Customer / Site)
      // ========================================
      addText('CUSTOMER / SITE DETAILS', 12, true)
      addText(`Customer / Company: ${formData.customerCompanyName || 'N/A'}`)
      addText(`Site Address: ${formData.siteAddress || 'N/A'}`)
      if (formData.siteContactName) {
        addText(`Site Contact: ${formData.siteContactName}`)
      }
      if (formData.siteContactPhone) {
        addText(`Site Phone: ${formData.siteContactPhone}`)
      }
      yPos += 5

      // ========================================
      // 3️⃣ JOB DETAILS
      // ========================================
      addText('JOB DETAILS', 12, true)
      addText(`Job Number: ${formData.jobNumber || 'N/A'}`)
      addText(`Job Date: ${formData.jobDate}`)
      addText(`Engineer Name: ${formData.engineerName || 'N/A'}`)
      addText(`Job Type: ${formData.jobType}`)
      yPos += 5

      // ========================================
      // 4️⃣ WORK CARRIED OUT
      // ========================================
      addText('WORK CARRIED OUT', 12, true)
      addText('Work Completed:', 10, true)
      addText(enhancedWorkDescription || 'No work description provided')
      yPos += 3

      if (formData.partsUsed) {
        addText('Parts Used:', 10, true)
        addText(formData.partsUsed)
        yPos += 3
      }

      addText(`Follow-up Required: ${formData.followUpRequired}`, 10, true)
      yPos += 10

      // ========================================
      // 5️⃣ SIGN-OFF
      // ========================================
      addText('SIGN-OFF', 12, true)
      addText(`Customer Name: ${formData.customerName || '___________________________'}`)
      yPos += 5

      // Signature - either drawn or line
      if (signatureData) {
        // Add drawn signature
        try {
          doc.addImage(signatureData, 'PNG', margin, yPos, 60, 20)
          yPos += 25
        } catch (err) {
          console.error('Error adding signature:', err)
          // Fallback to signature line
          doc.setLineWidth(0.5)
          doc.line(margin, yPos, margin + 80, yPos)
          yPos += 5
        }
      } else {
        // Signature line for physical signing
        doc.setLineWidth(0.5)
        doc.line(margin, yPos, margin + 80, yPos)
        yPos += 5
      }
      addText('Customer Signature', 9)
      yPos += 5
      addText(`Date Signed: ${formData.dateSigned}`, 10)

      // Footer
      const footerY = pageHeight - 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(128, 128, 128)
      if (companySettings.companyName) {
        doc.text(companySettings.companyName, pageWidth / 2, footerY, { align: 'center' })
      }
      if (companySettings.contactPhone || companySettings.contactEmail) {
        doc.text(
          `${companySettings.contactPhone || ''} | ${companySettings.contactEmail || ''}`,
          pageWidth / 2,
          footerY + 4,
          { align: 'center' }
        )
      }

      // Add watermark to the last page
      addWatermark()

      // Generate filename
      const fileName = `JobSheet_${formData.jobNumber || formData.jobDate}_${formData.customerCompanyName || 'Customer'}.pdf`
        .replace(/[^a-zA-Z0-9_-]/g, '_')

      // Get PDF as array buffer for better quality
      const pdfArrayBuffer = doc.output('arraybuffer')

      // Convert to base64 for storage
      const pdfBase64 = btoa(
        new Uint8Array(pdfArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`

      // Download the PDF
      doc.save(fileName)

      // Save to history with PDF data
      saveToHistory({
        type: 'pdf',
        title: `${formData.customerCompanyName || 'Customer'} - ${formData.jobNumber || formData.jobDate}`,
        content: enhancedWorkDescription,
        formData: formData,
        fileName: fileName,
        pdfData: pdfDataUrl // Store the PDF as base64
      })

      // Update last job number in localStorage (only if it's a valid 5-digit number)
      let nextJobNumber = formData.jobNumber
      if (formData.jobNumber && /^\d{5}$/.test(formData.jobNumber)) {
        localStorage.setItem('lastJobNumber', formData.jobNumber)
        // Calculate next job number
        const nextNum = parseInt(formData.jobNumber) + 1
        nextJobNumber = nextNum.toString().padStart(5, '0')
      } else {
        // If custom job number, get the next auto-increment number
        nextJobNumber = getNextJobNumber()
      }

      // Reset form with incremented job number for next job
      setFormData({
        customerCompanyName: '',
        siteAddress: '',
        siteContactName: '',
        siteContactPhone: '',
        jobNumber: nextJobNumber,
        jobDate: new Date().toISOString().split('T')[0],
        engineerName: localStorage.getItem('engineerName') || '',
        jobType: 'Call-out',
        workCompleted: '',
        partsUsed: '',
        followUpRequired: 'No',
        customerName: '',
        dateSigned: new Date().toISOString().split('T')[0]
      })

      // Clear signature
      setSignatureData(null)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      alert('✅ PDF generated successfully! Find it in Settings → Report History')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('❌ Failed to generate PDF. Please try again.')
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
    <div className="pdf-jobsheet-container">
      <form className="pdf-form" onSubmit={generatePDF}>
        {/* 2️⃣ THEIR DETAILS (Customer / Site) */}
        <div className="form-section">
          <h3 className="section-title">👥 Customer / Site Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerCompanyName">Customer / Company Name *</label>
              <input
                type="text"
                id="customerCompanyName"
                name="customerCompanyName"
                value={formData.customerCompanyName}
                onChange={handleInputChange}
                required
                placeholder="Enter customer or company name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="siteAddress">Site Address *</label>
              <input
                type="text"
                id="siteAddress"
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleInputChange}
                required
                placeholder="Enter site address"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="siteContactName">Site Contact Name (Optional)</label>
              <input
                type="text"
                id="siteContactName"
                name="siteContactName"
                value={formData.siteContactName}
                onChange={handleInputChange}
                placeholder="Enter site contact name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="siteContactPhone">Site Contact Phone (Optional)</label>
              <input
                type="tel"
                id="siteContactPhone"
                name="siteContactPhone"
                value={formData.siteContactPhone}
                onChange={handleInputChange}
                placeholder="e.g., 07123 456789"
              />
            </div>
          </div>
        </div>

        {/* 3️⃣ JOB DETAILS */}
        <div className="form-section">
          <h3 className="section-title">🔧 Job Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="jobNumber">
                Job Number *
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  (Auto-increments)
                </span>
              </label>
              <input
                type="text"
                id="jobNumber"
                name="jobNumber"
                value={formData.jobNumber}
                onChange={handleInputChange}
                required
                placeholder="Auto-generated"
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobDate">Job Date *</label>
              <input
                type="date"
                id="jobDate"
                name="jobDate"
                value={formData.jobDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="engineerName">Engineer Name *</label>
              <input
                type="text"
                id="engineerName"
                name="engineerName"
                value={formData.engineerName}
                onChange={handleInputChange}
                required
                placeholder="Enter engineer name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobType">Job Type *</label>
              <select
                id="jobType"
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                required
              >
                <option value="Call-out">Call-out</option>
                <option value="Service">Service</option>
                <option value="Install">Install</option>
                <option value="Remedials">Remedials</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4️⃣ WORK CARRIED OUT */}
        <div className="form-section">
          <h3 className="section-title">📝 Work Carried Out</h3>

          {/* Detail Level Selector */}
          <div className="form-group">
            <label>Report detail level</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="detailLevel"
                  value="brief"
                  checked={detailLevel === 'brief'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                />
                <span>Brief (2-3 sentences)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="detailLevel"
                  value="standard"
                  checked={detailLevel === 'standard'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                />
                <span>Standard (3-4 sentences)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="detailLevel"
                  value="detailed"
                  checked={detailLevel === 'detailed'}
                  onChange={(e) => setDetailLevel(e.target.value)}
                />
                <span>Detailed (5-7 sentences)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="workCompleted">
              Work Completed *
            </label>
            <textarea
              id="workCompleted"
              name="workCompleted"
              value={formData.workCompleted}
              onChange={handleInputChange}
              required
              rows="6"
              placeholder="Type your work description... It will be professionally formatted when generating the PDF"
              style={{
                fontSize: '16px',
                padding: '16px',
                lineHeight: '1.6',
                minHeight: '150px',
                resize: 'vertical'
              }}
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
              💡 Your description will be automatically enhanced and professionally formatted when you generate the PDF
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="partsUsed">Parts Used (Optional)</label>
            <textarea
              id="partsUsed"
              name="partsUsed"
              value={formData.partsUsed}
              onChange={handleInputChange}
              rows="3"
              placeholder="List any parts or materials used..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="followUpRequired">Follow-up Required *</label>
            <select
              id="followUpRequired"
              name="followUpRequired"
              value={formData.followUpRequired}
              onChange={handleInputChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {/* 5️⃣ SIGN-OFF */}
        <div className="form-section">
          <h3 className="section-title">✍️ Sign-Off</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                placeholder="Enter customer name for sign-off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateSigned">Date Signed *</label>
              <input
                type="date"
                id="dateSigned"
                name="dateSigned"
                value={formData.dateSigned}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="customerSignature">Customer Signature</label>
            <div className="signature-pad-container">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="signature-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="clear-signature-btn"
              >
                Clear Signature
              </button>
            </div>
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
              Draw signature above with mouse or finger. Leave blank for signature line in PDF.
            </small>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="generate-pdf-btn" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <span className="btn-icon">⏳</span>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">📄</span>
              <span>Generate PDF</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default PDFJobSheet

