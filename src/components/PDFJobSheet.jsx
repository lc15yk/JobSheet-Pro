import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import './PDFJobSheet.css'

// Trade-specific field configurations
const TRADE_FIELDS = {
  'fire-security': [
    { name: 'systemType', label: 'System Type', type: 'select', options: ['Fire Alarm System', 'Intruder Alarm', 'Emergency Lighting', 'Combined Fire & Intruder'], placeholder: 'Select system type' },
    { name: 'certificateType', label: 'Certificate Type', type: 'select', options: ['Maintenance Report', 'Installation Certificate', 'Commissioning Certificate', 'Service Report'], placeholder: 'Select certificate type' },
    { name: 'purposeOfVisit', label: 'Purpose of Visit', type: 'select', options: ['Annual Service', 'Periodic Check', 'Fault Call-out', 'Installation', 'Remedial Work'], placeholder: 'Select purpose' },
    { name: 'numberOfZones', label: 'Number of Zones', type: 'number', placeholder: 'e.g., 10' },
    { name: 'numberOfDetectors', label: 'Detectors Tested', type: 'number', placeholder: 'e.g., 25' },
    { name: 'numberOfSounders', label: 'Sounders Tested', type: 'number', placeholder: 'e.g., 8' },
    { name: 'controlPanelBattery', label: 'Control Panel Battery', type: 'select', options: ['OK', 'Replace Required', 'Replaced'], placeholder: 'Select status' },
    { name: 'standbyBatteryVoltage', label: 'Standby Battery Voltage', type: 'text', placeholder: 'e.g., 27.6V' },
    { name: 'systemCompliance', label: 'System Compliance', type: 'select', options: ['BS5839 Compliant', 'Non-Compliant', 'Remedial Work Required'], placeholder: 'Select compliance' },
    { name: 'certificateNumber', label: 'Certificate Number', type: 'text', placeholder: 'e.g., SF_FDA_416-02' }
  ],
  'cctv': [
    { name: 'numberOfCameras', label: 'Number of Cameras', type: 'number', placeholder: 'e.g., 8' },
    { name: 'recordingDeviceType', label: 'Recording Device Type', type: 'select', options: ['NVR', 'DVR', 'Cloud Storage'], placeholder: 'Select type' },
    { name: 'storageCapacity', label: 'Storage Capacity', type: 'text', placeholder: 'e.g., 2TB' },
    { name: 'cameraResolution', label: 'Camera Resolution', type: 'select', options: ['2MP', '4MP', '5MP', '8MP', '4K'], placeholder: 'Select resolution' },
    { name: 'remoteViewingStatus', label: 'Remote Viewing Status', type: 'select', options: ['Working', 'Not Working', 'Not Configured'], placeholder: 'Select status' }
  ],
  'hvac': [
    { name: 'unitType', label: 'Unit Type', type: 'select', options: ['Air Conditioning', 'Heating System', 'Ventilation System', 'Heat Pump', 'Chiller', 'AHU (Air Handling Unit)'], placeholder: 'Select type' },
    { name: 'serviceType', label: 'Service Type', type: 'select', options: ['Annual Service', 'Quarterly Service', 'Fault Repair', 'Installation', 'Gas Leak Check'], placeholder: 'Select service type' },
    { name: 'refrigerantType', label: 'Refrigerant Type', type: 'text', placeholder: 'e.g., R410A, R32, R134a' },
    { name: 'refrigerantPressure', label: 'Refrigerant Pressure', type: 'text', placeholder: 'e.g., High: 250 PSI, Low: 70 PSI' },
    { name: 'filterStatus', label: 'Filter Status', type: 'select', options: ['Clean', 'Replaced', 'Needs Replacement'], placeholder: 'Select status' },
    { name: 'temperatureDifferential', label: 'Temperature Differential', type: 'text', placeholder: 'e.g., 15°C' },
    { name: 'condensateDrain', label: 'Condensate Drain', type: 'select', options: ['Clear', 'Cleaned', 'Blocked - Cleared'], placeholder: 'Select status' },
    { name: 'electricalConnections', label: 'Electrical Connections', type: 'select', options: ['Secure', 'Tightened', 'Requires Attention'], placeholder: 'Select status' },
    { name: 'systemPressure', label: 'System Pressure', type: 'text', placeholder: 'e.g., 1.5 bar' },
    { name: 'fGasCompliance', label: 'F-Gas Compliance', type: 'select', options: ['Compliant', 'Non-Compliant', 'N/A'], placeholder: 'Select compliance' }
  ],
  'electrical': [
    { name: 'workType', label: 'Work Type', type: 'select', options: ['Installation', 'Testing & Inspection', 'Fault Finding', 'Maintenance', 'Remedial Work', 'Emergency Call-out'], placeholder: 'Select work type' },
    { name: 'boardType', label: 'Board/Panel Type', type: 'select', options: ['Distribution Board', 'Consumer Unit', 'Sub-Main', 'Motor Control Panel', 'Lighting Panel'], placeholder: 'Select type' },
    { name: 'numberOfCircuits', label: 'Number of Circuits', type: 'number', placeholder: 'e.g., 12' },
    { name: 'earthingSystem', label: 'Earthing System', type: 'select', options: ['TN-S', 'TN-C-S', 'TT', 'IT'], placeholder: 'Select system' },
    { name: 'earthLoopImpedance', label: 'Earth Loop Impedance (Zs)', type: 'text', placeholder: 'e.g., 0.35Ω' },
    { name: 'insulationResistance', label: 'Insulation Resistance', type: 'text', placeholder: 'e.g., >200MΩ' },
    { name: 'rcdTestResult', label: 'RCD Test Result', type: 'select', options: ['Pass', 'Fail', 'N/A'], placeholder: 'Select result' },
    { name: 'testResults', label: 'Overall Test Results', type: 'select', options: ['Pass', 'Fail', 'Remedial Work Required'], placeholder: 'Select result' },
    { name: 'certificateType', label: 'Certificate Type', type: 'select', options: ['EIC (Electrical Installation Certificate)', 'EICR (Condition Report)', 'Minor Works', 'None'], placeholder: 'Select certificate' },
    { name: 'certificateNumber', label: 'Certificate Number', type: 'text', placeholder: 'e.g., EICR-2024-001' }
  ],
  'plumbing': [
    { name: 'workType', label: 'Work Type', type: 'select', options: ['Boiler Service', 'Leak Repair', 'Installation', 'Drainage', 'Water System'], placeholder: 'Select type' },
    { name: 'boilerPressure', label: 'Boiler Pressure', type: 'text', placeholder: 'e.g., 1.5 bar' },
    { name: 'waterPressure', label: 'Water Pressure', type: 'text', placeholder: 'e.g., 3 bar' },
    { name: 'gasTestResult', label: 'Gas Test Result', type: 'select', options: ['Pass', 'Fail', 'N/A'], placeholder: 'Select result' },
    { name: 'safetyDevicesChecked', label: 'Safety Devices Checked', type: 'select', options: ['Yes', 'No', 'N/A'], placeholder: 'Select option' }
  ],
  'access-control': [
    { name: 'numberOfDoors', label: 'Number of Doors', type: 'number', placeholder: 'e.g., 5' },
    { name: 'readerType', label: 'Reader Type', type: 'select', options: ['Proximity Card', 'Biometric', 'Keypad', 'Mobile App'], placeholder: 'Select type' },
    { name: 'numberOfUsers', label: 'Number of Users', type: 'number', placeholder: 'e.g., 50' },
    { name: 'lockType', label: 'Lock Type', type: 'select', options: ['Magnetic Lock', 'Electric Strike', 'Motorized Lock', 'Smart Lock'], placeholder: 'Select type' },
    { name: 'systemIntegration', label: 'System Integration', type: 'select', options: ['Standalone', 'Integrated with CCTV', 'Integrated with Alarm', 'Full Integration'], placeholder: 'Select option' }
  ],
  'it-networking': [
    { name: 'networkType', label: 'Network Type', type: 'select', options: ['LAN', 'WAN', 'WiFi', 'Fiber Optic'], placeholder: 'Select type' },
    { name: 'numberOfPoints', label: 'Number of Network Points', type: 'number', placeholder: 'e.g., 20' },
    { name: 'switchModel', label: 'Switch/Router Model', type: 'text', placeholder: 'e.g., Cisco SG350-28' },
    { name: 'ipConfiguration', label: 'IP Configuration', type: 'text', placeholder: 'e.g., 192.168.1.0/24' },
    { name: 'networkSpeed', label: 'Network Speed', type: 'select', options: ['100 Mbps', '1 Gbps', '10 Gbps'], placeholder: 'Select speed' }
  ],
  'building-maintenance': [
    { name: 'maintenanceType', label: 'Maintenance Type', type: 'select', options: ['Preventive', 'Corrective', 'Emergency', 'Routine Inspection'], placeholder: 'Select type' },
    { name: 'areaInspected', label: 'Area Inspected', type: 'text', placeholder: 'e.g., Roof, HVAC Room, Electrical Room' },
    { name: 'equipmentCondition', label: 'Equipment Condition', type: 'select', options: ['Good', 'Fair', 'Poor', 'Requires Attention'], placeholder: 'Select condition' },
    { name: 'safetyHazards', label: 'Safety Hazards Identified', type: 'select', options: ['None', 'Minor', 'Major', 'Critical'], placeholder: 'Select option' },
    { name: 'nextInspectionDue', label: 'Next Inspection Due', type: 'date', placeholder: '' }
  ],
  'general': []
}

// Get all used job references from localStorage
const getUsedJobNumbers = () => {
  const used = localStorage.getItem('usedJobNumbers')
  return used ? JSON.parse(used) : []
}

// Save a used job reference
const saveUsedJobNumber = (jobNumber) => {
  const used = getUsedJobNumbers()
  if (!used.includes(jobNumber)) {
    used.push(jobNumber)
    used.sort() // Keep them sorted
    localStorage.setItem('usedJobNumbers', JSON.stringify(used))
  }
}

// Check if a job reference is already used
const isJobNumberUsed = (jobNumber) => {
  const used = getUsedJobNumbers()
  return used.includes(jobNumber)
}

// Get next available job reference from localStorage
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
    customerName: '',
    siteName: '',
    siteAddress: '',
    siteContactName: '',
    siteContactPhone: '',

    // 3️⃣ JOB DETAILS
    jobNumber: getNextJobNumber(),
    jobDate: new Date().toISOString().split('T')[0],
    timeIn: '',
    timeOut: '',
    engineerName: localStorage.getItem('engineerName') || '',
    jobType: 'Call-out', // Call-out / Service / Install

    // 3.5️⃣ TRADE-SPECIFIC FIELDS
    // Fire & Security
    certificateType: '',
    purposeOfVisit: '',
    numberOfZones: '',
    numberOfDetectors: '',
    numberOfSounders: '',
    controlPanelBattery: '',
    standbyBatteryVoltage: '',
    systemCompliance: '',
    certificateNumber: '',

    // CCTV
    numberOfCameras: '',
    recordingDeviceType: '',
    storageCapacity: '',
    cameraResolution: '',
    remoteViewingStatus: '',

    // HVAC
    unitType: '',
    serviceType: '',
    refrigerantType: '',
    refrigerantPressure: '',
    filterStatus: '',
    temperatureDifferential: '',
    condensateDrain: '',
    electricalConnections: '',
    systemPressure: '',
    fGasCompliance: '',

    // Electrical
    boardType: '',
    numberOfCircuits: '',
    earthingSystem: '',
    earthLoopImpedance: '',
    insulationResistance: '',
    rcdTestResult: '',
    testResults: '',
    certificateType: '',

    // Plumbing
    workType: '',
    boilerPressure: '',
    waterPressure: '',
    gasTestResult: '',
    safetyDevicesChecked: '',

    // Access Control
    numberOfDoors: '',
    readerType: '',
    numberOfUsers: '',
    lockType: '',
    systemIntegration: '',

    // IT & Networking
    networkType: '',
    numberOfPoints: '',
    switchModel: '',
    ipConfiguration: '',
    networkSpeed: '',

    // Building Maintenance
    maintenanceType: '',
    areaInspected: '',
    equipmentCondition: '',
    safetyHazards: '',
    nextInspectionDue: '',

    // Common system details (for all trades)
    systemType: '',
    systemPanelType: '',
    systemMake: '',
    systemModel: '',
    systemSerial: '',
    systemSerialNumber: '',
    systemInstallationDate: '',
    lastServiceDate: '',
    nextServiceDue: '',

    // Servicing-specific fields
    dateOfPreviousInspection: '',
    dateOfNextInspection: '',
    overallCondition: '', // Pass / Fail / N/A
    battery1AH: '',
    battery2AH: '',
    battery3AH: '',
    battery4AH: '',

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
  const [isEnhancing, setIsEnhancing] = useState(false) // Track AI enhancement state
  const canvasRef = useRef(null)

  // Custom fields state - load from localStorage on init
  const [customFields, setCustomFields] = useState(() => {
    const saved = localStorage.getItem('customFieldDefinitions')
    return saved ? JSON.parse(saved) : []
  })
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')

  // Save custom field definitions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customFieldDefinitions', JSON.stringify(customFields))
  }, [customFields])

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

    // Validate job reference if it's being changed
    if (name === 'jobNumber') {
      // Check if it's a valid 5-digit number
      if (value && /^\d{5}$/.test(value)) {
        // Check if this reference was already used
        if (isJobNumberUsed(value)) {
          alert(`⚠️ Job reference ${value} has already been used!\n\nPlease use a different reference to avoid duplicates.`)
          return // Don't update the field
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'engineerName') {
      localStorage.setItem('engineerName', value)
    }
  }

  // Custom field handlers
  const handleAddCustomField = () => {
    if (!newFieldName.trim()) {
      alert('Please enter a field name')
      return
    }

    const newField = {
      id: Date.now(),
      name: newFieldName.trim(),
      type: newFieldType,
      value: ''
    }

    setCustomFields(prev => [...prev, newField])
    setNewFieldName('')
    setNewFieldType('text')
    setShowAddFieldModal(false)
  }

  const handleRemoveCustomField = (fieldId) => {
    setCustomFields(prev => prev.filter(field => field.id !== fieldId))
  }

  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, value } : field
      )
    )
  }

  // Generate AI-enhanced description for PDF (called during PDF generation)
  const generateAIDescriptionForPDF = async (inputText) => {
    if (!inputText.trim()) {
      return inputText
    }

    try {
      // Build the prompt with detail level instruction (same as paragraph generator)
      let detailInstruction = ''
      if (detailLevel === 'brief') {
        detailInstruction = '\n\nWrite a BRIEF report - keep it short and to the point, around 2-3 sentences.'
      } else if (detailLevel === 'detailed') {
        detailInstruction = '\n\nWrite a DETAILED report - include more context and explanation, around 5-7 sentences.'
      } else {
        detailInstruction = '\n\nWrite a STANDARD report - clear and professional, around 3-4 sentences.'
      }

      const prompt = `Site name: ${formData.siteName || 'N/A'}
Customer: ${formData.customerName || 'N/A'}
Work performed: ${inputText}
Job type: ${formData.jobType}${detailInstruction}`

      // Use the EXACT same system prompt as paragraph generator
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

Write the job sheet as a single paragraph. Do not use headings, bullet points, bold text, brackets, or special formatting.`

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

  // Handle "Enhance" button click - enhance text in real-time
  const handleEnhanceText = async () => {
    if (!formData.workCompleted.trim()) {
      alert('⚠️ Please enter some work description first before enhancing.')
      return
    }

    // Check subscription access
    if (!hasAccess) {
      if (subscriptionStatus?.noSubscription) {
        alert('🎁 Please start your free trial or subscribe to use AI enhancement.\n\nClick "Start Free Trial" above to get 72 hours of unlimited access!')
      } else {
        alert('⚠️ Your subscription has expired. Please renew to use AI enhancement.')
      }
      return
    }

    setIsEnhancing(true)

    try {
      console.log('🔄 Starting enhancement...')
      console.log('Original text:', formData.workCompleted)

      const enhancedText = await generateAIDescriptionForPDF(formData.workCompleted)

      console.log('✅ Enhanced text:', enhancedText)

      // Update the form data with enhanced text
      setFormData({
        ...formData,
        workCompleted: enhancedText
      })

      // Show success message (removed alert to avoid interruption)
      console.log('✨ Text enhanced successfully!')
    } catch (error) {
      console.error('Enhancement Error:', error)
      alert('❌ Failed to enhance text. Please try again.')
    } finally {
      setIsEnhancing(false)
    }
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
      // Use the work description as-is (user can enhance it before generating)
      const workDescription = formData.workCompleted

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let yPos = margin

      // Color scheme
      const primaryColor = [180, 180, 180] // Light gray
      const lightGray = [245, 245, 245]
      const darkGray = [80, 80, 80]
      const borderColor = [200, 200, 200]

      // Helper function to add watermark to current page
      const addWatermark = () => {
        try {
          // Save current state
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber

          // Create semi-transparent watermark
          doc.setGState(new doc.GState({ opacity: 0.1 }))

          // Center watermark diagonally
          doc.setFontSize(50)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(150, 150, 150)

          // Rotate and position watermark in center
          const centerX = pageWidth / 2
          const centerY = pageHeight / 2

          doc.text('JobSheet Pro', centerX, centerY, {
            align: 'center',
            angle: 45
          })

          // Reset opacity and color
          doc.setGState(new doc.GState({ opacity: 1.0 }))
          doc.setTextColor(0, 0, 0)
        } catch (err) {
          console.error('Error adding watermark:', err)
        }
      }

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace = 20) => {
        if (yPos + requiredSpace > pageHeight - margin - 10) {
          doc.addPage()
          addWatermark() // Add watermark to new page
          yPos = margin
          return true
        }
        return false
      }

      // Helper function to draw a field (label + value)
      const drawField = (label, value, width = null) => {
        const fieldWidth = width || (pageWidth - 2 * margin)
        const fieldHeight = 9 // Reduced from 12

        checkNewPage(fieldHeight)

        // Label background
        doc.setFillColor(...lightGray)
        doc.rect(margin, yPos, fieldWidth, fieldHeight, 'F')

        // Border
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, fieldWidth, fieldHeight)

        // Label text
        doc.setFontSize(7) // Reduced from 8
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...darkGray)
        doc.text(label, margin + 2, yPos + 3)

        // Value text
        doc.setFontSize(9) // Reduced from 10
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(value || '', margin + 2, yPos + 7)

        yPos += fieldHeight
      }

      // Helper function to draw two fields side by side
      const drawFieldPair = (label1, value1, label2, value2) => {
        const fieldWidth = (pageWidth - 2 * margin) / 2
        const fieldHeight = 9 // Reduced from 12

        checkNewPage(fieldHeight)

        // Left field
        doc.setFillColor(...lightGray)
        doc.rect(margin, yPos, fieldWidth, fieldHeight, 'F')
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, fieldWidth, fieldHeight)

        doc.setFontSize(7) // Reduced from 8
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...darkGray)
        doc.text(label1, margin + 2, yPos + 3)

        doc.setFontSize(9) // Reduced from 10
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(value1 || '', margin + 2, yPos + 7)

        // Right field
        const rightX = margin + fieldWidth
        doc.setFillColor(...lightGray)
        doc.rect(rightX, yPos, fieldWidth, fieldHeight, 'F')
        doc.setDrawColor(...borderColor)
        doc.rect(rightX, yPos, fieldWidth, fieldHeight)

        doc.setFontSize(7) // Reduced from 8
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...darkGray)
        doc.text(label2, rightX + 2, yPos + 3)

        doc.setFontSize(9) // Reduced from 10
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(value2 || '', rightX + 2, yPos + 7)

        yPos += fieldHeight
      }

      // Helper function to draw one box with 4 sections divided by vertical lines
      const drawFieldQuad = (label1, value1, label2, value2, label3, value3, label4, value4) => {
        const totalWidth = pageWidth - 2 * margin
        const sectionWidth = totalWidth / 4
        const fieldHeight = 10

        checkNewPage(fieldHeight)

        // Draw the main box background
        doc.setFillColor(...lightGray)
        doc.rect(margin, yPos, totalWidth, fieldHeight, 'F')

        // Draw the outer border
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, totalWidth, fieldHeight)

        // Draw vertical dividers between sections
        for (let i = 1; i < 4; i++) {
          const dividerX = margin + (sectionWidth * i)
          doc.line(dividerX, yPos, dividerX, yPos + fieldHeight)
        }

        // Add content to each section
        const fields = [
          { label: label1, value: value1, x: margin },
          { label: label2, value: value2, x: margin + sectionWidth },
          { label: label3, value: value3, x: margin + sectionWidth * 2 },
          { label: label4, value: value4, x: margin + sectionWidth * 3 }
        ]

        fields.forEach(field => {
          // Label
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...darkGray)
          doc.text(field.label, field.x + 2, yPos + 3.5)

          // Value
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(field.value || 'N/A', field.x + 2, yPos + 7.5)
        })

        yPos += fieldHeight
      }

      // Helper function to draw section header
      const drawSectionHeader = (title) => {
        checkNewPage(8)

        yPos += 0.5 // Minimal gap before section header

        doc.setFillColor(...primaryColor)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F') // Reduced from 8

        doc.setFontSize(9) // Reduced from 11
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(40, 40, 40)
        doc.text(title, margin + 3, yPos + 4.5)

        yPos += 6 // Reduced from 8
      }

      // Helper function to draw multi-line text area
      const drawTextArea = (text, minHeight = 20) => { // Reduced from 30
        checkNewPage(minHeight)

        const boxWidth = pageWidth - 2 * margin
        doc.setFontSize(9) // Reduced from 10
        doc.setFont('helvetica', 'normal')

        const lines = doc.splitTextToSize(text || '', boxWidth - 6)
        const lineHeight = 4 // Reduced from 5
        const textHeight = Math.max(lines.length * lineHeight + 6, minHeight) // Reduced padding from 8 to 6

        // DISABLED: Keep everything on 1 page
        // if (yPos + textHeight > pageHeight - margin - 10) {
        //   doc.addPage()
        //   yPos = margin
        // }

        // Draw box with light background
        doc.setFillColor(255, 255, 255)
        doc.rect(margin, yPos, boxWidth, textHeight, 'F')

        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, boxWidth, textHeight)

        // Add text
        doc.setTextColor(0, 0, 0)
        doc.text(lines, margin + 3, yPos + 5) // Reduced from 6

        yPos += textHeight
      }

      // ========================================
      // HEADER
      // ========================================

      // Add watermark to first page
      addWatermark()

      // No background bar - clean white header

      // Company details (top left corner)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      let leftY = margin + 5

      if (companySettings.companyName) {
        doc.text(companySettings.companyName, margin, leftY)
        leftY += 4
      }

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)

      if (companySettings.companyAddress) {
        doc.text(companySettings.companyAddress, margin, leftY)
        leftY += 3.5
      }
      if (companySettings.companyLocation) {
        doc.text(companySettings.companyLocation, margin, leftY)
        leftY += 3.5
      }
      if (companySettings.contactPhone) {
        doc.text(`Tel: ${companySettings.contactPhone}`, margin, leftY)
        leftY += 3.5
      }
      if (companySettings.contactEmail) {
        doc.text(companySettings.contactEmail, margin, leftY)
        leftY += 3.5
      }

      // Company Logo (top right corner)
      if (companySettings.logo) {
        try {
          const logoSize = 20
          doc.addImage(companySettings.logo, 'PNG', pageWidth - margin - logoSize, margin + 2, logoSize, logoSize)
        } catch (err) {
          console.error('Error adding logo:', err)
        }
      }

      // Document Title removed - start content directly
      yPos = Math.max(leftY + 5, margin + 30)

      // ========================================
      // JOB INFORMATION
      // ========================================
      drawSectionHeader('Job Information')

      drawFieldPair('Job Reference', formData.jobNumber || 'N/A', 'Date', formData.jobDate)
      drawFieldPair('Time In', formData.timeIn || 'N/A', 'Time Out', formData.timeOut || 'N/A')
      drawFieldPair('Job Type', formData.jobType, 'Engineer', formData.engineerName || 'N/A')

      // ========================================
      // SITE DETAILS
      // ========================================
      drawSectionHeader('Site Details')

      drawFieldPair('Customer Name', formData.customerName || 'N/A', 'Site Name', formData.siteName || 'N/A')
      drawFieldPair('Site Address', formData.siteAddress || 'N/A', 'Contact Phone', formData.siteContactPhone || 'N/A')

      // ========================================
      // SYSTEM DETAILS (if any system info provided)
      // ========================================
      if (formData.systemType || formData.systemPanelType || formData.systemSerialNumber || formData.systemInstallationDate) {
        drawSectionHeader('System Details')

        // Collect filled system fields
        const systemFields = []
        if (formData.systemType && formData.systemType.trim()) {
          systemFields.push({ label: 'System Type', value: formData.systemType })
        }
        if (formData.systemPanelType && formData.systemPanelType.trim()) {
          systemFields.push({ label: 'Panel Type', value: formData.systemPanelType })
        }
        if (formData.systemSerialNumber && formData.systemSerialNumber.trim()) {
          systemFields.push({ label: 'Serial Number', value: formData.systemSerialNumber })
        }
        if (formData.systemInstallationDate && formData.systemInstallationDate.trim()) {
          systemFields.push({ label: 'Installation Date', value: formData.systemInstallationDate })
        }

        // Display system fields in pairs (2 per row)
        for (let i = 0; i < systemFields.length; i += 2) {
          const field1 = systemFields[i]
          const field2 = systemFields[i + 1]

          if (field2) {
            // Draw two fields side by side
            drawFieldPair(field1.label, field1.value, field2.label, field2.value)
          } else {
            // Draw single field if it's the last one and odd
            drawField(field1.label, field1.value)
          }
        }
      }

      // ========================================
      // CUSTOM FIELDS (if any)
      // ========================================
      if (customFields.length > 0) {
        const filledCustomFields = customFields.filter(field => field.value && field.value.trim())

        if (filledCustomFields.length > 0) {
          drawSectionHeader('Additional Details')

          // Display custom fields in pairs (2 per row)
          for (let i = 0; i < filledCustomFields.length; i += 2) {
            const field1 = filledCustomFields[i]
            const field2 = filledCustomFields[i + 1]

            if (field2) {
              // Draw two fields side by side
              drawFieldPair(field1.name, field1.value, field2.name, field2.value)
            } else {
              // Draw single field if it's the last one and odd
              drawField(field1.name, field1.value)
            }
          }
        }
      }

      // ========================================
      // SERVICING DETAILS (only for Service job type)
      // ========================================
      if (formData.jobType === 'Service') {
        drawSectionHeader('Servicing Details')

        if (formData.dateOfPreviousInspection || formData.dateOfNextInspection) {
          drawFieldPair(
            'Previous Inspection',
            formData.dateOfPreviousInspection || 'N/A',
            'Next Inspection',
            formData.dateOfNextInspection || 'N/A'
          )
        }

        // Battery readings - display as 2x2 grid
        if (formData.battery1AH || formData.battery2AH || formData.battery3AH || formData.battery4AH) {
          drawFieldPair(
            'Battery 1 AH',
            formData.battery1AH || 'N/A',
            'Battery 2 AH',
            formData.battery2AH || 'N/A'
          )
          drawFieldPair(
            'Battery 3 AH',
            formData.battery3AH || 'N/A',
            'Battery 4 AH',
            formData.battery4AH || 'N/A'
          )
        }

        // Overall Condition - at the end
        if (formData.overallCondition) {
          drawField('Overall Condition of System', formData.overallCondition)
        }
      }

      // ========================================
      // TRADE-SPECIFIC DETAILS - Coming Soon
      // ========================================
      // Trade-specific fields will be added in future updates

      // ========================================
      // WORK DESCRIPTION
      // ========================================
      drawSectionHeader('Work Carried Out')
      drawTextArea(workDescription || 'No work description provided', 30) // Reduced from 50

      // ========================================
      // PARTS USED (if any)
      // ========================================
      if (formData.partsUsed && formData.partsUsed.trim()) {
        drawSectionHeader('Parts & Materials Used')
        drawTextArea(formData.partsUsed, 15) // Reduced from 25
      }

      // ========================================
      // FOLLOW-UP
      // ========================================
      drawSectionHeader('Follow-Up')
      drawField('Follow-up Required', formData.followUpRequired)

      // ========================================
      // SIGNATURES
      // ========================================
      drawSectionHeader('Sign-Off')

      checkNewPage(25) // Reduced from 50

      const sigBoxHeight = 20 // Reduced from 30
      const sigBoxWidth = (pageWidth - 2 * margin - 4) / 2

      // Customer signature box
      doc.setFillColor(...lightGray)
      doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight, 'F')
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight)

      doc.setFontSize(7) // Reduced from 8
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Customer Signature', margin + 2, yPos + 3)

      // Add signature or name
      if (signatureData) {
        try {
          doc.addImage(signatureData, 'PNG', margin + 5, yPos + 7, 40, 10) // Reduced size
        } catch (err) {
          console.error('Error adding signature:', err)
          doc.setFontSize(9) // Reduced from 10
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(formData.customerName || '', margin + 3, yPos + 13)
        }
      } else {
        doc.setFontSize(9) // Reduced from 10
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(formData.customerName || '', margin + 3, yPos + 13)
      }

      // Engineer signature box
      const rightBoxX = margin + sigBoxWidth + 4
      doc.setFillColor(...lightGray)
      doc.rect(rightBoxX, yPos, sigBoxWidth, sigBoxHeight, 'F')
      doc.setDrawColor(...borderColor)
      doc.rect(rightBoxX, yPos, sigBoxWidth, sigBoxHeight)

      doc.setFontSize(7) // Reduced from 8
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Engineer', rightBoxX + 2, yPos + 3)

      doc.setFontSize(9) // Reduced from 10
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formData.engineerName || '', rightBoxX + 3, yPos + 13)

      yPos += sigBoxHeight + 2

      // Date fields
      doc.setFillColor(...lightGray)
      doc.rect(margin, yPos, sigBoxWidth, 10, 'F')
      doc.setDrawColor(...borderColor)
      doc.rect(margin, yPos, sigBoxWidth, 10)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Date', margin + 2, yPos + 4)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formData.dateSigned, margin + 2, yPos + 8)

      doc.setFillColor(...lightGray)
      doc.rect(rightBoxX, yPos, sigBoxWidth, 10, 'F')
      doc.setDrawColor(...borderColor)
      doc.rect(rightBoxX, yPos, sigBoxWidth, 10)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Date', rightBoxX + 2, yPos + 4)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(formData.dateSigned, rightBoxX + 2, yPos + 8)

      // Footer
      yPos = pageHeight - 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(120, 120, 120)
      doc.text('Generated by JobSheet Pro', pageWidth / 2, yPos, { align: 'center' })

      // Generate filename
      const fileName = `JobSheet_${formData.jobNumber || formData.jobDate}_${formData.siteName || formData.customerName || 'Customer'}.pdf`
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
        title: `${formData.siteName || formData.customerName || 'Customer'} - ${formData.jobNumber || formData.jobDate}`,
        content: workDescription,
        formData: formData,
        fileName: fileName,
        pdfData: pdfDataUrl // Store the PDF as base64
      })

      // Update last job reference in localStorage (only if it's a valid 5-digit number)
      let nextJobNumber = formData.jobNumber
      if (formData.jobNumber && /^\d{5}$/.test(formData.jobNumber)) {
        // Save this job reference as used
        saveUsedJobNumber(formData.jobNumber)

        localStorage.setItem('lastJobNumber', formData.jobNumber)
        // Calculate next job reference
        const nextNum = parseInt(formData.jobNumber) + 1
        nextJobNumber = nextNum.toString().padStart(5, '0')
      } else {
        // If custom job reference, get the next auto-increment number
        nextJobNumber = getNextJobNumber()
      }

      // Reset form with incremented job reference for next job
      setFormData({
        customerName: '',
        siteName: '',
        siteAddress: '',
        siteContactName: '',
        siteContactPhone: '',
        systemType: '',
        systemPanelType: '',
        systemSerialNumber: '',
        systemInstallationDate: '',
        jobNumber: nextJobNumber,
        jobDate: new Date().toISOString().split('T')[0],
        timeIn: '',
        timeOut: '',
        engineerName: localStorage.getItem('engineerName') || '',
        jobType: 'Call-out',
        dateOfPreviousInspection: '',
        dateOfNextInspection: '',
        overallCondition: '',
        battery1AH: '',
        battery2AH: '',
        battery3AH: '',
        battery4AH: '',
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

      // Clear custom field values but keep the field definitions
      setCustomFields(prev => prev.map(field => ({ ...field, value: '' })))

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
    <div className="pdf-jobsheet-container" style={{ position: 'relative' }}>
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
      <form className="pdf-form" onSubmit={generatePDF}>
        {/* 2️⃣ THEIR DETAILS (Customer / Site) */}
        <div className="form-section">
          <h3 className="section-title">👥 Customer / Site Details</h3>
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
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="siteName">Site Name *</label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={formData.siteName}
                onChange={handleInputChange}
                required
                placeholder="Enter site/company name"
              />
            </div>
          </div>
          <div className="form-row">
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
            <div className="form-group">
              <label htmlFor="siteContactPhone">Site Contact Phone</label>
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

        {/* 2.5️⃣ SYSTEM DETAILS */}
        <div className="form-section">
          <h3 className="section-title">⚙️ System Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="systemType">System Type (Optional)</label>
              <input
                type="text"
                id="systemType"
                name="systemType"
                value={formData.systemType}
                onChange={handleInputChange}
                placeholder="e.g., Fire Alarm System to BS5839"
              />
            </div>
            <div className="form-group">
              <label htmlFor="systemPanelType">Panel Type (Optional)</label>
              <input
                type="text"
                id="systemPanelType"
                name="systemPanelType"
                value={formData.systemPanelType}
                onChange={handleInputChange}
                placeholder="e.g., CTec"
              />
            </div>
            <div className="form-group">
              <label htmlFor="systemSerialNumber">Serial Number (Optional)</label>
              <input
                type="text"
                id="systemSerialNumber"
                name="systemSerialNumber"
                value={formData.systemSerialNumber}
                onChange={handleInputChange}
                placeholder="e.g., 730210"
              />
            </div>
            <div className="form-group">
              <label htmlFor="systemInstallationDate">Installation Date (Optional)</label>
              <input
                type="text"
                id="systemInstallationDate"
                name="systemInstallationDate"
                value={formData.systemInstallationDate}
                onChange={handleInputChange}
                placeholder="e.g., 15/02/2019"
              />
            </div>
          </div>
        </div>

        {/* CUSTOM FIELDS */}
        <div className="form-section">
          <h3 className="section-title">Custom Fields</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
            Add your own custom fields that will appear on the PDF report
          </p>

          {/* Add Field Button */}
          <button
            type="button"
            onClick={() => setShowAddFieldModal(true)}
            className="btn-secondary"
            style={{
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Add Custom Field
          </button>

          {/* Custom Fields List */}
          {customFields.length > 0 && (
            <div className="form-row" style={{ flexDirection: 'column', gap: '0' }}>
              {customFields.map(field => (
                <div key={field.id} className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor={`custom-field-${field.id}`}>
                    {field.name}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <input
                      type={field.type}
                      id={`custom-field-${field.id}`}
                      name={`custom-field-${field.id}`}
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      placeholder={`Enter ${field.name.toLowerCase()}`}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      style={{
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        minWidth: '44px',
                        minHeight: '44px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove field"
                      aria-label="Remove field"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customFields.length === 0 && (
            <p style={{
              fontSize: '0.85rem',
              color: '#999',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px'
            }}>
              No custom fields added yet. Click "Add Custom Field" to create one.
            </p>
          )}
        </div>

        {/* Add Field Modal */}
        {showAddFieldModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 'clamp(20px, 5vw, 30px)',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginTop: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Add Custom Field</h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Field Name *
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g., Panel Type, Battery Voltage"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Field Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFieldModal(false)
                    setNewFieldName('')
                    setNewFieldType('text')
                  }}
                  className="btn-secondary"
                  style={{
                    flex: '1 1 120px',
                    minHeight: '44px',
                    fontSize: '16px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="btn-primary"
                  style={{
                    flex: '1 1 120px',
                    minHeight: '44px',
                    fontSize: '16px'
                  }}
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ JOB DETAILS */}
        <div className="form-section">
          <h3 className="section-title">🔧 Job Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="jobNumber">
                Job Reference *
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
              <label htmlFor="timeIn">Time In</label>
              <input
                type="time"
                id="timeIn"
                name="timeIn"
                value={formData.timeIn}
                onChange={handleInputChange}
                placeholder="e.g., 09:00"
              />
            </div>
            <div className="form-group">
              <label htmlFor="timeOut">Time Out</label>
              <input
                type="time"
                id="timeOut"
                name="timeOut"
                value={formData.timeOut}
                onChange={handleInputChange}
                placeholder="e.g., 17:00"
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

        {/* Servicing-Specific Fields (only show when Job Type is "Service") */}
        {formData.jobType === 'Service' && (
          <div className="form-section">
            <h3 className="section-title">🔧 Servicing Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfPreviousInspection">Date of Previous Inspection</label>
                <input
                  type="text"
                  id="dateOfPreviousInspection"
                  name="dateOfPreviousInspection"
                  value={formData.dateOfPreviousInspection}
                  onChange={handleInputChange}
                  placeholder="e.g., 15/01/2024"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateOfNextInspection">Date of Next Inspection</label>
                <input
                  type="text"
                  id="dateOfNextInspection"
                  name="dateOfNextInspection"
                  value={formData.dateOfNextInspection}
                  onChange={handleInputChange}
                  placeholder="e.g., 15/01/2025"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="overallCondition">Overall Condition of System</label>
                <select
                  id="overallCondition"
                  name="overallCondition"
                  value={formData.overallCondition}
                  onChange={handleInputChange}
                >
                  <option value="">Select condition...</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="battery1AH">Battery 1 AH</label>
                <input
                  type="text"
                  id="battery1AH"
                  name="battery1AH"
                  value={formData.battery1AH}
                  onChange={handleInputChange}
                  placeholder="e.g., 12AH"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="battery2AH">Battery 2 AH</label>
                <input
                  type="text"
                  id="battery2AH"
                  name="battery2AH"
                  value={formData.battery2AH}
                  onChange={handleInputChange}
                  placeholder="e.g., 12AH"
                />
              </div>
              <div className="form-group">
                <label htmlFor="battery3AH">Battery 3 AH</label>
                <input
                  type="text"
                  id="battery3AH"
                  name="battery3AH"
                  value={formData.battery3AH}
                  onChange={handleInputChange}
                  placeholder="e.g., 12AH"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="battery4AH">Battery 4 AH</label>
                <input
                  type="text"
                  id="battery4AH"
                  name="battery4AH"
                  value={formData.battery4AH}
                  onChange={handleInputChange}
                  placeholder="e.g., 12AH"
                />
              </div>
            </div>
          </div>
        )}

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
              placeholder="Type your work description... Click 'Enhance with AI' to professionally format it"
              style={{
                fontSize: '16px',
                padding: '16px',
                lineHeight: '1.6',
                minHeight: '150px',
                resize: 'vertical'
              }}
            />
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleEnhanceText}
                disabled={isEnhancing || !formData.workCompleted.trim()}
                style={{
                  padding: '12px 40px',
                  width: '100%',
                  maxWidth: '400px',
                  background: isEnhancing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isEnhancing || !formData.workCompleted.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isEnhancing ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></span>
                    Enhancing...
                  </>
                ) : (
                  <>
                    Enhance
                  </>
                )}
              </button>
              <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
                Click to professionally format your description
              </small>
            </div>
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

