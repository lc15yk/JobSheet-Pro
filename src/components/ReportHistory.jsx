import { useState, useEffect } from 'react'
import './ReportHistory.css'

function ReportHistory() {
  const [reports, setReports] = useState([])
  const [expandedReport, setExpandedReport] = useState(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    const savedReports = localStorage.getItem('reportHistory')
    if (savedReports) {
      const parsed = JSON.parse(savedReports)
      // Filter out reports older than 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const validReports = parsed.filter(report => report.timestamp > sevenDaysAgo)
      
      // Sort by newest first
      validReports.sort((a, b) => b.timestamp - a.timestamp)
      
      setReports(validReports)
      
      // Update localStorage if we filtered any out
      if (validReports.length !== parsed.length) {
        localStorage.setItem('reportHistory', JSON.stringify(validReports))
      }
    }
  }

  const deleteReport = (id) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const updatedReports = reports.filter(report => report.id !== id)
      setReports(updatedReports)
      localStorage.setItem('reportHistory', JSON.stringify(updatedReports))
    }
  }

  const clearAllReports = () => {
    if (confirm('Are you sure you want to delete all saved reports?')) {
      setReports([])
      localStorage.removeItem('reportHistory')
    }
  }

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content)
    alert('✅ Report copied to clipboard!')
  }

  const sharePDF = async (report) => {
    if (!report.pdfData) {
      alert('❌ PDF data not available')
      return
    }

    try {
      // Convert base64 data URL to binary
      const base64Data = report.pdfData.split(',')[1]
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Create blob with explicit PDF MIME type
      const blob = new Blob([bytes], { type: 'application/pdf' })

      // Create file from blob with .pdf extension
      const fileName = report.fileName || 'JobSheet.pdf'
      const file = new File([blob], fileName, {
        type: 'application/pdf',
        lastModified: new Date().getTime()
      })

      // Check if Web Share API is supported and can share files
      if (navigator.share) {
        // Try to share the file
        try {
          await navigator.share({
            files: [file],
            title: report.title || 'Job Sheet',
            text: 'Job Sheet PDF Report'
          })
          console.log('PDF shared successfully')
        } catch (shareError) {
          // If share was cancelled or failed, fall back to download
          if (shareError.name !== 'AbortError') {
            console.log('Share failed, falling back to download')
            downloadPDFFallback(report)
          }
        }
      } else {
        // Browser doesn't support share, download instead
        console.log('Share not supported, downloading instead')
        downloadPDFFallback(report)
      }
    } catch (error) {
      console.error('Error preparing PDF for sharing:', error)
      alert('❌ Error sharing PDF. Please try again.')
    }
  }

  const downloadPDFFallback = (report) => {
    const link = document.createElement('a')
    link.href = report.pdfData
    link.download = report.fileName || 'JobSheet.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = (timestamp) => {
    const expiryDate = timestamp + (7 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000))
    return daysLeft
  }

  return (
    <div className="report-history-container">
      <div className="history-header">
        <div>
          <h2>📚 Report History</h2>
          <p className="history-subtitle">Your reports are saved for 7 days</p>
        </div>
        {reports.length > 0 && (
          <button onClick={clearAllReports} className="clear-all-btn">
            🗑️ Clear All
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No saved reports yet</h3>
          <p>Generate your first report and it will appear here</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <div className="report-info">
                  <span className="report-type-badge">
                    {report.type === 'pdf' ? '📋 PDF' : '📄 Paragraph'}
                  </span>
                  <h3>{report.title}</h3>
                  <p className="report-meta">
                    {formatDate(report.timestamp)} • Expires in {getDaysRemaining(report.timestamp)} days
                  </p>
                </div>
                <div className="report-actions">
                  {report.type === 'pdf' && report.pdfData ? (
                    <>
                      <button onClick={() => sharePDF(report)} className="share-btn">
                        📤 Share
                      </button>
                      <button
                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                        className="view-btn"
                      >
                        {expandedReport === report.id ? '▲ Hide' : '▼ Preview'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                        className="view-btn"
                      >
                        {expandedReport === report.id ? '▲ Hide' : '▼ View'}
                      </button>
                      <button onClick={() => copyToClipboard(report.content)} className="copy-btn">
                        📋 Copy
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteReport(report.id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>

              {expandedReport === report.id && (
                <div className="report-content-preview">
                  {report.type === 'pdf' && report.pdfData ? (
                    <iframe
                      src={report.pdfData}
                      className="pdf-preview"
                      title="PDF Preview"
                    />
                  ) : (
                    <pre>{report.content}</pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReportHistory

