-- Insert sample cards
INSERT INTO public.cards (name, description, image_url, rarity, price) VALUES
    ('Pikachu', 'The iconic electric mouse Pokémon', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', 'Common', 10.00),
    ('Charizard', 'A powerful fire/flying type Pokémon', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png', 'Rare', 50.00),
    ('Mewtwo', 'A powerful psychic type Pokémon', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', 'Legendary', 100.00),
    ('Eevee', 'A normal type Pokémon with multiple evolutions', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png', 'Uncommon', 25.00),
    ('Snorlax', 'A sleepy normal type Pokémon', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png', 'Rare', 40.00);

-- Insert sample announcements
INSERT INTO public.announcements (title, content) VALUES
    ('Welcome to PokeCollect!', 'Welcome to our new Pokémon card collection platform! Start collecting your favorite Pokémon cards today.'),
    ('New Cards Added', 'We have added new rare Pokémon cards to our collection. Check them out!'),
    ('Maintenance Notice', 'The platform will be undergoing maintenance on Saturday at 2 AM UTC. We apologize for any inconvenience.'); 