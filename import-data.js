// Import data to Supabase
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ3MjMwOCwiZXhwIjoyMDU5MDQ4MzA4fQ.UpqfFOgyzSLPrZDe_XQnYV6sUpx2G5EKAA86mD_c5Ns';

// Sample data to import
const sampleData = [
  {
    name: 'Charizard',
    set_name: 'Base Set',
    card_number: '4',
    rarity: 'Rare Holo',
    image_url: 'https://images.pokemontcg.io/base1/4_hires.png',
    price: 299.99,
    condition: 'Near Mint',
    description: 'Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
    seller_notes: 'Classic card from the original set'
  },
  {
    name: 'Pikachu',
    set_name: 'Base Set',
    card_number: '58',
    rarity: 'Common',
    image_url: 'https://images.pokemontcg.io/base1/58_hires.png',
    price: 24.99,
    condition: 'Excellent',
    description: 'When several of these Pokémon gather, their electricity can cause lightning storms.',
    seller_notes: 'The most recognizable Pokémon'
  }
];

// Function to import data to Supabase
async function importData() {
  try {
    console.log('Starting data import...');
    console.log('Using URL:', `${SUPABASE_URL}/rest/v1/cards`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sampleData)
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      console.log('Data imported successfully!');
    } else {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        console.error('Error importing data:', errorData);
      } catch (e) {
        console.error('Error response (not JSON):', errorText);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Import process completed');
}

// Run the import
importData();
