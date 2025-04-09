import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample cards to add (using data from the Pokemon TCG API)
const sampleCards = [
  {
    name: "Ampharos",
    set_name: "Secret Wonders",
    card_number: "1",
    rarity: "Rare Holo",
    image_url: "https://images.pokemontcg.io/dp3/1_hires.png",
    price: 19.20,
    condition: "Near Mint",
    description: "The tip of its tail shines brightly. In the olden days, people sent signals using the tail's light.",
    seller_notes: "Beautiful holo card from the Diamond & Pearl era"
  },
  {
    name: "Aerodactyl",
    set_name: "Legend Maker",
    card_number: "1",
    rarity: "Rare Holo",
    image_url: "https://images.pokemontcg.io/ex12/1_hires.png",
    price: 26.66,
    condition: "Lightly Played",
    description: "A prehistoric Pokémon that roamed the skies in ancient times.",
    seller_notes: "Vintage card from the EX series"
  },
  {
    name: "Giovanni's Gyarados",
    set_name: "Gym Challenge",
    card_number: "5",
    rarity: "Rare Holo",
    image_url: "https://images.pokemontcg.io/gym2/5_hires.png",
    price: 135.00,
    condition: "Excellent",
    description: "Team Rocket's boss Giovanni's powerful Gyarados",
    seller_notes: "Rare Gym Challenge card, highly collectible"
  },
  {
    name: "Clefable",
    set_name: "Base Set 2",
    card_number: "5",
    rarity: "Rare Holo",
    image_url: "https://images.pokemontcg.io/base4/5_hires.png",
    price: 14.98,
    condition: "Near Mint",
    description: "A timid Fairy Pokémon that is rarely seen. It will run and hide the moment it senses people.",
    seller_notes: "Classic Base Set 2 card in great condition"
  }
]

async function seedCards() {
  try {
    // First, clear existing cards
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all cards

    if (deleteError) {
      console.error('Error deleting existing cards:', deleteError)
      return
    }

    // Insert the sample cards
    const { data, error } = await supabase
      .from('cards')
      .insert(sampleCards)
      .select()

    if (error) {
      console.error('Error inserting cards:', error)
      return
    }

    console.log('Successfully inserted cards:', data)
  } catch (err) {
    console.error('Error:', err)
  }
}

// Run the seeding function
seedCards() 