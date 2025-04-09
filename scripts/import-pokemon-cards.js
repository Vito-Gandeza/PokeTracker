// This script fetches cards from the Pokemon TCG API and adds them to the Supabase database
// Run with: node scripts/import-pokemon-cards.js

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

// Pokemon TCG API key
const POKEMON_TCG_API_KEY = 'd2cf1828-877c-4f8d-947c-7377dfb810be';

// Supabase configuration
const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch cards from Pokemon TCG API
async function fetchPokemonCards(setId, pageSize = 250, page = 1) {
  try {
    console.log(`Fetching page ${page} of set ${setId}...`);
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`, {
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

// Function to fetch all cards from a set (handling pagination)
async function fetchAllCardsFromSet(setId, pageSize = 250) {
  let allCards = [];
  let page = 1;
  let hasMoreCards = true;

  while (hasMoreCards) {
    const cards = await fetchPokemonCards(setId, pageSize, page);

    if (cards.length === 0) {
      hasMoreCards = false;
    } else {
      allCards = [...allCards, ...cards];
      console.log(`Fetched ${cards.length} cards from set ${setId}, page ${page}. Total: ${allCards.length}`);
      page++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // If we got fewer cards than the page size, we've reached the end
      if (cards.length < pageSize) {
        hasMoreCards = false;
      }
    }
  }

  return allCards;
}

// Function to transform Pokemon TCG API card to our database format
function transformCard(card) {
  // Generate a price based on rarity
  let basePrice = 1;
  if (card.rarity) {
    const rarityLower = card.rarity.toLowerCase();
    if (rarityLower.includes('common')) {
      basePrice = 1.99;
    } else if (rarityLower.includes('uncommon')) {
      basePrice = 3.99;
    } else if (rarityLower.includes('rare holo')) {
      basePrice = 15.99;
    } else if (rarityLower.includes('rare')) {
      basePrice = 9.99;
    } else if (rarityLower.includes('ultra rare') || rarityLower.includes('rare ultra')) {
      basePrice = 29.99;
    } else if (rarityLower.includes('secret') || rarityLower.includes('rare secret')) {
      basePrice = 49.99;
    } else if (rarityLower.includes('amazing')) {
      basePrice = 24.99;
    } else if (rarityLower.includes('promo')) {
      basePrice = 19.99;
    } else if (rarityLower.includes('radiant')) {
      basePrice = 34.99;
    } else if (rarityLower.includes('illustration rare')) {
      basePrice = 39.99;
    } else if (rarityLower.includes('special illustration')) {
      basePrice = 59.99;
    } else if (rarityLower.includes('hyper')) {
      basePrice = 69.99;
    } else if (rarityLower.includes('trainer gallery')) {
      basePrice = 44.99;
    } else {
      basePrice = 5.99;
    }
  }

  // Add some randomness to the price (±10%)
  const priceVariation = (Math.random() * 0.2) - 0.1;
  const price = basePrice * (1 + priceVariation);

  // Default condition is Near Mint
  const condition = 'Near Mint';

  // Create a description
  let description = card.flavorText || `${card.name} from the ${card.set.name} set`;
  if (card.abilities && card.abilities.length > 0) {
    const ability = card.abilities[0];
    description += ` Features the ${ability.name} ability: ${ability.text}`;
  }

  // Create seller notes
  let sellerNotes = `${condition} condition ${card.name} card from ${card.set.name}`;
  if (card.artist) {
    sellerNotes += ` Artwork by ${card.artist}.`;
  }

  return {
    name: card.name,
    set_name: card.set.name,
    card_number: card.number,
    rarity: card.rarity || 'Unknown',
    image_url: card.images.large,
    price: parseFloat(price.toFixed(2)),
    condition,
    description: description,
    seller_notes: sellerNotes
  };
}

// Function to insert cards into Supabase
async function insertCards(cards) {
  // Insert in batches to avoid request size limits
  const batchSize = 10; // Smaller batch size for more reliable inserts
  let successCount = 0;

  // Process cards to ensure price is a number, not a string
  const processedCards = cards.map(card => ({
    ...card,
    price: typeof card.price === 'string' ? parseFloat(card.price) : card.price
  }));

  for (let i = 0; i < processedCards.length; i += batchSize) {
    const batch = processedCards.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(processedCards.length/batchSize)} (${batch.length} cards)`);

    try {
      // Try to insert directly first
      const { data, error } = await supabase
        .from('cards')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);

        // If direct insert fails, try inserting one by one
        console.log('Trying individual inserts...');
        let individualSuccessCount = 0;

        for (const card of batch) {
          try {
            const { error: individualError } = await supabase
              .from('cards')
              .insert([card]);

            if (!individualError) {
              individualSuccessCount++;
            } else {
              console.log('Individual insert error:', individualError.message);
            }
          } catch (individualErr) {
            console.log('Individual insert exception:', individualErr.message);
          }

          // Small delay between individual inserts
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (individualSuccessCount > 0) {
          console.log(`Successfully inserted ${individualSuccessCount} cards individually`);
          successCount += individualSuccessCount;
        }
      } else {
        successCount += batch.length;
        console.log(`Successfully inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} cards)`);
      }

      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.error(`Exception inserting batch ${Math.floor(i/batchSize) + 1}:`, err);
    }
  }

  console.log(`Successfully inserted ${successCount} out of ${processedCards.length} cards`);
  return successCount > 0;
}

// Main function to import cards
async function importCards() {
  console.log('Starting Pokemon card import...');

  // List of sets to import - focusing on the requested sets
  const sets = [
    // Scarlet & Violet sets
    'sv8', // Surging Sparks
    'sv9', // Journey Together
    'sv8pt5', // Prismatic Evolutions
    'sv7', // Stellar Crown
    'sv6pt5', // Twilight Masquerade
    'sv6', // Temporal Forces
    'sv5', // Paldean Fates
    'sv4pt5', // Paradox Rift

    // Sword & Shield sets
    'swsh12', // Crown Zenith
    'swsh12pt5', // Pokemon GO
  ];

  // Target number of cards per set
  const targetCardsPerSet = 50; // Import 50 cards from each set
  let totalCardsImported = 0;

  // Process sets in order
  for (const setId of sets) {
    console.log(`\n=== Processing set: ${setId} ===`);
    try {
      // Fetch all cards from the set
      const cards = await fetchAllCardsFromSet(setId);

      if (cards.length > 0) {
        console.log(`Found ${cards.length} cards in set ${setId}`);

        // Transform cards and add duplicates for some cards
        const transformedCards = [];

        for (const card of cards) {
          // Transform the card
          const transformedCard = transformCard(card);

          // For certain rarities, create duplicates with different conditions
          if (['Common', 'Uncommon'].includes(card.rarity)) {
            // Create 2-4 duplicates for common/uncommon cards
            const duplicateCount = Math.floor(Math.random() * 3) + 2;

            for (let i = 0; i < duplicateCount; i++) {
              // Vary the condition and price slightly for duplicates
              const conditions = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Played'];
              const condition = conditions[Math.floor(Math.random() * conditions.length)];
              const priceVariation = (Math.random() * 0.4) - 0.2; // -20% to +20%

              transformedCards.push({
                ...transformedCard,
                condition,
                price: Math.max(0.99, transformedCard.price * (1 + priceVariation)).toFixed(2)
              });
            }
          } else if (['Rare', 'Rare Holo'].includes(card.rarity)) {
            // Create 1-2 duplicates for rare cards
            const duplicateCount = Math.floor(Math.random() * 2) + 1;

            for (let i = 0; i < duplicateCount; i++) {
              // Better conditions for rare cards
              const conditions = ['Mint', 'Near Mint', 'Excellent'];
              const condition = conditions[Math.floor(Math.random() * conditions.length)];
              const priceVariation = (Math.random() * 0.3) - 0.1; // -10% to +20%

              transformedCards.push({
                ...transformedCard,
                condition,
                price: Math.max(0.99, transformedCard.price * (1 + priceVariation)).toFixed(2)
              });
            }
          } else {
            // For ultra rares, just add the card once (no duplicates)
            transformedCards.push(transformedCard);
          }
        }

        console.log(`Created ${transformedCards.length} cards (with duplicates) from set ${setId}`);

        // Calculate how many cards to import from this set (target 50 per set)
        const cardsToImport = Math.min(transformedCards.length, targetCardsPerSet);
        const selectedCards = transformedCards.slice(0, cardsToImport);

        // Insert the cards
        const success = await insertCards(selectedCards);
        if (success) {
          totalCardsImported += cardsToImport;
          console.log(`Imported ${cardsToImport} cards from set ${setId}. Total imported: ${totalCardsImported}`);
        }
      } else {
        console.log(`No cards found for set ${setId}, skipping...`);
      }

      // Add a delay between sets to avoid rate limiting
      console.log(`Waiting before processing next set...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing set ${setId}:`, error);
      // Continue with the next set even if this one fails
    }
  }

  console.log(`\nPokemon card import completed. Total cards imported: ${totalCardsImported}`);
}

// Run the import
importCards().catch(console.error);
