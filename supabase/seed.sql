-- Initial seed file for the database
-- This is just an empty placeholder and can be modified later

-- Example schema initialization
-- CREATE TABLE IF NOT EXISTS public.cards (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name TEXT NOT NULL,
--   set TEXT NOT NULL,
--   rarity TEXT,
--   image_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Example data
-- INSERT INTO public.cards (name, set, rarity, image_url)
-- VALUES 
--   ('Charizard', 'Base', 'Rare', 'https://example.com/charizard.jpg'),
--   ('Pikachu', 'Base', 'Common', 'https://example.com/pikachu.jpg'); 

-- Seed file for the Pokemon Collector database

-- Sample Pokemon cards
INSERT INTO public.cards (id, name, set_name, set_code, card_number, rarity, image_url)
VALUES 
  (uuid_generate_v4(), 'Charizard', 'Base Set', 'base1', '4', 'Rare Holo', 'https://images.pokemontcg.io/base1/4.png'),
  (uuid_generate_v4(), 'Pikachu', 'Base Set', 'base1', '58', 'Common', 'https://images.pokemontcg.io/base1/58.png'),
  (uuid_generate_v4(), 'Blastoise', 'Base Set', 'base1', '2', 'Rare Holo', 'https://images.pokemontcg.io/base1/2.png'),
  (uuid_generate_v4(), 'Venusaur', 'Base Set', 'base1', '15', 'Rare Holo', 'https://images.pokemontcg.io/base1/15.png'),
  (uuid_generate_v4(), 'Mewtwo', 'Base Set', 'base1', '10', 'Rare Holo', 'https://images.pokemontcg.io/base1/10.png'),
  (uuid_generate_v4(), 'Charizard V', 'Sword & Shield', 'swsh1', '25', 'Ultra Rare', 'https://images.pokemontcg.io/swsh1/25.png'),
  (uuid_generate_v4(), 'Pikachu VMAX', 'Vivid Voltage', 'swsh4', '44', 'Ultra Rare', 'https://images.pokemontcg.io/swsh4/44.png'),
  (uuid_generate_v4(), 'Lugia V', 'Silver Tempest', 'swsh12', '186', 'Ultra Rare', 'https://images.pokemontcg.io/swsh12/186.png'),
  (uuid_generate_v4(), 'Mewtwo VSTAR', 'Pokémon GO', 'pgo', '31', 'Rainbow Rare', 'https://images.pokemontcg.io/pgo/31.png'),
  (uuid_generate_v4(), 'Umbreon VMAX', 'Evolving Skies', 'swsh7', '95', 'Alternate Art', 'https://images.pokemontcg.io/swsh7/95.png');

-- Note: Additional code would be added here to create test users and collections
-- But in this system, we use Supabase auth, so users will be created through the UI 