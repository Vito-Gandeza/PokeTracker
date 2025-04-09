// Check Supabase connection
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q';

// Function to check Supabase connection
async function checkConnection() {
  try {
    console.log('Checking Supabase connection...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?select=count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Connection successful! Data:', data);
    } else {
      const errorText = await response.text();
      console.error('Error connecting to Supabase:', errorText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('Check completed');
  process.exit(0); // Force exit
}

// Run the check
checkConnection();
