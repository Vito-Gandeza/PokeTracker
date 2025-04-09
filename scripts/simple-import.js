// This script fetches cards from the Pokemon TCG API and adds them to the Supabase database
// Run with: node scripts/simple-import.js

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q';
const supabase = createClient(supabaseUrl, supabaseKey);

// Pokemon TCG API key
const POKEMON_TCG_API_KEY = 'd2cf1828-877c-4f8d-947c-7377dfb810be';

// Function to fetch cards from Pokemon TCG API
async function fetchPokemonCards(setId, pageSize = 20) {
  try {
    console.log(`Fetching cards from set: ${setId}...`);
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=${pageSize}`, {
      headers: {
        'X-Api-Key': POKEMON_TCG_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Pokemon cards:', error);
    return [];
  }
}

// Function to transform Pokemon TCG API card to our database format
function transformCard(card) {
  // Generate a random price between $1 and $100 based on rarity
  let basePrice = 5;
  if (card.rarity) {
    switch (card.rarity.toLowerCase()) {
      case 'common':
        basePrice = 1;
        break;
      case 'uncommon':
        basePrice = 3;
        break;
      case 'rare':
        basePrice = 10;
        break;
      case 'rare holo':
        basePrice = 15;
        break;
      case 'rare ultra':
      case 'ultra rare':
        basePrice = 30;
        break;
      case 'rare secret':
      case 'secret rare':
        basePrice = 50;
        break;
      default:
        basePrice = 5;
    }
  }
  
  // Add some randomness to the price
  const price = basePrice + Math.random() * basePrice;
  
  // Generate random condition
  const conditions = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Played'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    name: card.name,
    set_name: card.set.name,
    card_number: card.number,
    rarity: card.rarity || 'Unknown',
    image_url: card.images.large,
    price: parseFloat(price.toFixed(2)),
    condition,
    description: card.flavorText || `${card.name} from the ${card.set.name} set`,
    seller_notes: `${condition} condition ${card.name} card from ${card.set.name}`
  };
}

// Function to insert cards into Supabase
async function insertCards(cards) {
  try {
    console.log(`Inserting ${cards.length} cards...`);
    
    // Insert cards in batches of 10
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(cards.length/batchSize)}...`);
      
      const { data, error } = await supabase
        .from('cards')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting cards:', error);
      } else {
        successCount += batch.length;
        console.log(`Successfully inserted batch ${Math.floor(i/batchSize) + 1}`);
      }
      
      // Add a delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Successfully inserted ${successCount} out of ${cards.length} cards`);
    return successCount > 0;
  } catch (error) {
    console.error('Error inserting cards:', error);
    return false;
  }
}

// Main function to import cards
async function importCards() {
  console.log('Starting Pokemon card import...');

  // List of sets to import
  const sets = [
    'sv5', // Scarlet & Violet: Temporal Forces
    'sv4', // Scarlet & Violet: Paradox Rift
    'sv3', // Scarlet & Violet: Obsidian Flames
    'sv2', // Scarlet & Violet: Paldea Evolved
    'sv1', // Scarlet & Violet Base Set
    'swsh12', // Crown Zenith
    'swsh11', // Silver Tempest
    'swsh10', // Lost Origin
  ];

  for (const setId of sets) {
    try {
      const cards = await fetchPokemonCards(setId, 20); // Fetch 20 cards per set
      
      if (cards.length > 0) {
        console.log(`Found ${cards.length} cards in set ${setId}`);
        const transformedCards = cards.map(transformCard);
        await insertCards(transformedCards);
      }
      
      // Add a delay between sets
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing set ${setId}:`, error);
    }
  }

  console.log('Pokemon card import completed');
}

// Run the import
importCards().catch(console.error);
