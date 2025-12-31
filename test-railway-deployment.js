// Test script for Railway deployment
const API_URL = 'https://jobsheet-pro-production.up.railway.app';

const testData = {
  customerName: "Test Customer",
  address: "123 Test Street",
  postcode: "TE5 T12",
  phoneNumber: "01234567890",
  emailAddress: "test@example.com",
  jobDescription: "Test job for deployment verification",
  materialsUsed: "Test materials",
  laborCost: 100,
  materialsCost: 50,
  totalCost: 150
};

async function testDeployment() {
  console.log('🚀 Testing Railway Deployment...\n');
  
  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await fetch(API_URL);
    const healthText = await healthResponse.text();
    console.log('✅ Health check:', healthText);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }
  
  // Test 2: PDF Generation
  console.log('\n2️⃣ Testing PDF generation...');
  try {
    const response = await fetch(`${API_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDF generation failed:', response.status, errorText);
      return;
    }
    
    const blob = await response.blob();
    console.log('✅ PDF generated successfully!');
    console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${blob.type}`);
    
    // Save the PDF
    const fs = require('fs');
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('test-output.pdf', buffer);
    console.log('   Saved to: test-output.pdf');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
  }
}

testDeployment();

