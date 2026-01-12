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
      // Extract base64 data (remove the data:application/pdf;base64, prefix)
      const base64Data = report.pdfData.includes(',')
        ? report.pdfData.split(',')[1]
        : report.pdfData

      // Decode base64 to binary
      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Create a proper PDF blob
      const pdfBlob = new Blob([bytes.buffer], {
        type: 'application/pdf'
      })

      // Create file with proper name and extension
      const fileName = (report.fileName || 'JobSheet.pdf').endsWith('.pdf')
        ? report.fileName || 'JobSheet.pdf'
        : `${report.fileName || 'JobSheet'}.pdf`

      const pdfFile = new File([pdfBlob], fileName, {
        type: 'application/pdf',
        lastModified: Date.now()
      })

      // Use Web Share API if available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'JobSheet Pro',
          text: report.title || 'Job Sheet PDF',
          url: 'https://jobsheet.pro'
        })
      } else {
        // Fallback: download the file
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error sharing PDF:', error)
      alert('❌ Error sharing PDF. Please try again.')
    }
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

