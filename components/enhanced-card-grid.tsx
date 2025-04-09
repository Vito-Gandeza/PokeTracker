'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Search, Filter } from 'lucide-react';

interface CardProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rarity: string;
  set_name: string;
  card_number: string;
  condition: string;
  quantity?: number;
}

interface GroupedCard extends CardProduct {
  quantity: number;
}

interface EnhancedCardGridProps {
  initialSetFilter?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  limit?: number;
}

// Generate fallback cards when database is not available
function generateFallbackCards(): CardProduct[] {
  return [
    {
      id: 'fallback-1',
      name: 'Pikachu',
      image_url: 'https://images.pokemontcg.io/base1/58_hires.png',
      price: 24.99,
      rarity: 'Common',
      set_name: 'Base Set',
      card_number: '58',
      condition: 'Excellent'
    },
    {
      id: 'fallback-2',
      name: 'Charizard',
      image_url: 'https://images.pokemontcg.io/base1/4_hires.png',
      price: 299.99,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '4',
      condition: 'Near Mint'
    },
    {
      id: 'fallback-3',
      name: 'Blastoise',
      image_url: 'https://images.pokemontcg.io/base1/2_hires.png',
      price: 180.50,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '2',
      condition: 'Near Mint'
    },
    {
      id: 'fallback-4',
      name: 'Venusaur',
      image_url: 'https://images.pokemontcg.io/base1/15_hires.png',
      price: 165.75,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '15',
      condition: 'Excellent'
    },
    {
      id: 'fallback-5',
      name: 'Mewtwo',
      image_url: 'https://images.pokemontcg.io/base1/10_hires.png',
      price: 145.00,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '10',
      condition: 'Near Mint'
    },
    {
      id: 'fallback-6',
      name: 'Jigglypuff',
      image_url: 'https://images.pokemontcg.io/base1/54_hires.png',
      price: 12.50,
      rarity: 'Common',
      set_name: 'Base Set',
      card_number: '54',
      condition: 'Mint'
    }
  ];
}

export default function EnhancedCardGrid({
  initialSetFilter,
  showSearch = true,
  showFilters = true,
  limit = 24
}: EnhancedCardGridProps) {
  // Initialize with fallback data
  const fallbackCards = generateFallbackCards();
  const fallbackSets = [...new Set(fallbackCards.map(card => card.set_name))];
  const fallbackRarities = [...new Set(fallbackCards.map(card => card.rarity))];

  const [cards, setCards] = useState<CardProduct[]>(fallbackCards);
  const [loading, setLoading] = useState(false); // Start with loading false since we have fallback data
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [setFilter, setSetFilter] = useState(initialSetFilter || 'all');
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [availableSets, setAvailableSets] = useState<string[]>(fallbackSets);
  const [availableRarities, setAvailableRarities] = useState<string[]>(fallbackRarities);

  // Fetch cards from Supabase
  useEffect(() => {
    async function fetchCards() {
      console.log('Starting to fetch cards');
      setLoading(true);
      try {
        const supabase = createClient();

        let query = supabase
          .from('cards')
          .select('*');

        // Apply set filter if provided
        if (setFilter && setFilter !== 'all') {
          query = query.eq('set_name', setFilter);
        }

        // Apply search query if provided
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        // Apply rarity filters if selected
        if (rarityFilter.length > 0) {
          query = query.in('rarity', rarityFilter);
        }

        // Apply sorting
        switch (sortOption) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price', { ascending: false });
            break;
          case 'price-low':
            query = query.order('price', { ascending: true });
            break;
          case 'name-asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name-desc':
            query = query.order('name', { ascending: false });
            break;
        }

        // Apply limit
        query = query.limit(limit);

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setCards(data);

          // Extract unique sets and rarities for filters
          const sets = [...new Set(data.map(card => card.set_name))];
          const rarities = [...new Set(data.map(card => card.rarity))];

          setAvailableSets(sets);
          setAvailableRarities(rarities);
        } else {
          // Fallback data if no cards are found
          const fallbackCards = generateFallbackCards();
          setCards(fallbackCards);

          // Extract unique sets and rarities for filters from fallback data
          const sets = [...new Set(fallbackCards.map(card => card.set_name))];
          const rarities = [...new Set(fallbackCards.map(card => card.rarity))];

          setAvailableSets(sets);
          setAvailableRarities(rarities);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        // Provide fallback data on error
        const fallbackCards = generateFallbackCards();
        setCards(fallbackCards);

        // Extract unique sets and rarities for filters from fallback data
        const sets = [...new Set(fallbackCards.map(card => card.set_name))];
        const rarities = [...new Set(fallbackCards.map(card => card.rarity))];

        setAvailableSets(sets);
        setAvailableRarities(rarities);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [searchQuery, sortOption, setFilter, rarityFilter, limit]);



  // Group cards by name, set, and card number
  const groupedCards = useMemo(() => {
    const groupedMap = new Map<string, GroupedCard>();

    cards.forEach(card => {
      const key = `${card.name}-${card.set_name}-${card.card_number}`;

      if (groupedMap.has(key)) {
        const existingCard = groupedMap.get(key)!;
        existingCard.quantity += 1;
      } else {
        groupedMap.set(key, { ...card, quantity: 1 });
      }
    });

    return Array.from(groupedMap.values());
  }, [cards]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Toggle rarity filter
  const toggleRarityFilter = (rarity: string) => {
    setRarityFilter(prev =>
      prev.includes(rarity)
        ? prev.filter(r => r !== rarity)
        : [...prev, rarity]
    );
  };





  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (groupedCards.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-lg mb-4">No cards available matching your criteria.</p>
        {(searchQuery || setFilter || rarityFilter.length > 0) && (
          <Button onClick={() => {
            setSearchQuery('');
            setSetFilter('all');
            setRarityFilter([]);
          }}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {showSearch && (
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          )}

          {showFilters && (
            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>

              {availableSets.length > 0 && (
                <Select value={setFilter} onValueChange={setSetFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sets</SelectItem>
                    {availableSets.map(set => (
                      <SelectItem key={set} value={set}>{set}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {availableRarities.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Rarity
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {availableRarities.map(rarity => (
                      <DropdownMenuCheckboxItem
                        key={rarity}
                        checked={rarityFilter.includes(rarity)}
                        onCheckedChange={() => toggleRarityFilter(rarity)}
                      >
                        {rarity}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {groupedCards.map((card) => (
          <Link key={card.id} href={`/shop/cards/${card.id}`}>
            <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image
                  src={card.image_url || '/images/card-placeholder.png'}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-contain"
                />
                {card.quantity > 1 && (
                  <div className="absolute top-2 right-2 bg-black text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {card.quantity}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{card.set_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{card.rarity}</p>
                {card.condition && (
                  <p className="text-xs text-muted-foreground">{card.condition}</p>
                )}
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <div className="text-sm font-bold">${card.price?.toFixed(2) || 'Price unavailable'}</div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
