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
import {
  ChevronDown,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronRight,
  ArrowUpDown,
  Star,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  created_at?: string;
}

interface GroupedCard extends CardProduct {
  quantity: number;
}

interface OrganizedCardCollectionProps {
  initialSetFilter?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  initialLimit?: number;
  groupBySet?: boolean;
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
      condition: 'Excellent',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-2',
      name: 'Charizard',
      image_url: 'https://images.pokemontcg.io/base1/4_hires.png',
      price: 299.99,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '4',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-3',
      name: 'Blastoise',
      image_url: 'https://images.pokemontcg.io/base1/2_hires.png',
      price: 180.50,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '2',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-4',
      name: 'Venusaur',
      image_url: 'https://images.pokemontcg.io/base1/15_hires.png',
      price: 165.75,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '15',
      condition: 'Excellent',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-5',
      name: 'Mewtwo',
      image_url: 'https://images.pokemontcg.io/base1/10_hires.png',
      price: 145.00,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '10',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-6',
      name: 'Jigglypuff',
      image_url: 'https://images.pokemontcg.io/base1/54_hires.png',
      price: 12.50,
      rarity: 'Common',
      set_name: 'Base Set',
      card_number: '54',
      condition: 'Mint',
      created_at: new Date().toISOString()
    },
    // Add some cards from different sets
    {
      id: 'fallback-7',
      name: 'Pikachu V',
      image_url: 'https://images.pokemontcg.io/swsh4/44_hires.png',
      price: 34.99,
      rarity: 'Ultra Rare',
      set_name: 'Vivid Voltage',
      card_number: '44',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-8',
      name: 'Charizard VMAX',
      image_url: 'https://images.pokemontcg.io/swsh3/20_hires.png',
      price: 199.99,
      rarity: 'Ultra Rare',
      set_name: 'Darkness Ablaze',
      card_number: '20',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-9',
      name: 'Mew VMAX',
      image_url: 'https://images.pokemontcg.io/swsh8/114_hires.png',
      price: 89.99,
      rarity: 'Ultra Rare',
      set_name: 'Fusion Strike',
      card_number: '114',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-10',
      name: 'Gengar VMAX',
      image_url: 'https://images.pokemontcg.io/swsh8/157_hires.png',
      price: 79.99,
      rarity: 'Ultra Rare',
      set_name: 'Fusion Strike',
      card_number: '157',
      condition: 'Near Mint',
      created_at: new Date().toISOString()
    }
  ];
}

// Helper function to get rarity color
function getRarityColor(rarity: string): string {
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('common')) return 'bg-gray-500';
  if (rarityLower.includes('uncommon')) return 'bg-green-500';
  if (rarityLower.includes('rare') && rarityLower.includes('holo')) return 'bg-yellow-500';
  if (rarityLower.includes('rare')) return 'bg-blue-500';
  if (rarityLower.includes('ultra')) return 'bg-purple-500';
  if (rarityLower.includes('secret')) return 'bg-red-500';
  if (rarityLower.includes('amazing')) return 'bg-pink-500';
  return 'bg-gray-500';
}



export default function OrganizedCardCollection({
  initialSetFilter,
  showSearch = true,
  showFilters = true,
  initialLimit = 50,
  groupBySet = false
}: OrganizedCardCollectionProps) {
  // State for pagination
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Initialize with fallback data
  const fallbackCards = generateFallbackCards();
  const fallbackSets = [...new Set(fallbackCards.map(card => card.set_name))];
  const fallbackRarities = [...new Set(fallbackCards.map(card => card.rarity))];

  const [cards, setCards] = useState<CardProduct[]>(fallbackCards);
  const [loading, setLoading] = useState(false); // Start with loading false since we have fallback data
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('set-name');
  const [setFilter, setSetFilter] = useState(initialSetFilter || 'all');
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [availableSets, setAvailableSets] = useState<string[]>(fallbackSets);
  const [availableRarities, setAvailableRarities] = useState<string[]>(fallbackRarities);
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});

  // Fetch all available sets first
  useEffect(() => {
    let isMounted = true;

    async function fetchAllSets() {
      try {
        const supabase = createClient();

        // Get all unique set names
        const { data, error } = await supabase
          .from('cards')
          .select('set_name')
          .order('set_name');

        if (error) throw error;

        if (isMounted && data) {
          // Extract unique set names
          const uniqueSets = [...new Set(data.map(card => card.set_name))];
          setAvailableSets(uniqueSets);
          console.log(`OrganizedCardCollection: Found ${uniqueSets.length} unique sets`);
        }
      } catch (err) {
        console.error('Error fetching sets:', err);
      }
    }

    fetchAllSets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch cards from Supabase with improved error handling and state management
  useEffect(() => {
    // Track component mount state
    let isMounted = true;

    // Show loading state only if we don't have cards yet
    if (cards.length === 0) {
      setLoading(true);
    }

    async function fetchCards() {
      console.log('OrganizedCardCollection: Fetching cards with filters:', {
        searchQuery, sortOption, setFilter,
        rarityFilter: rarityFilter.length > 0 ? rarityFilter : 'all'
      });

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
          case 'set-name':
            query = query.order('set_name', { ascending: true }).order('card_number', { ascending: true });
            break;
          case 'rarity':
            query = query.order('rarity', { ascending: false }).order('name', { ascending: true });
            break;
        }

        // Apply limit with +1 to check if there are more items, but only if not in groupBySet mode
        if (!groupBySet) {
          query = query.limit(limit + 1);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (isMounted && data && data.length > 0) {
          console.log(`OrganizedCardCollection: Successfully fetched ${data.length} cards`);

          // Check if there are more items (only if not in groupBySet mode)
          let cardsToDisplay = data;
          if (!groupBySet) {
            const hasMoreItems = data.length > limit;
            setHasMore(hasMoreItems);

            // Remove the extra item we fetched to check for more
            cardsToDisplay = hasMoreItems ? data.slice(0, limit) : data;
          }
          setCards(cardsToDisplay);

          // Extract unique rarities for filters
          const rarities = [...new Set(data.map(card => card.rarity))];
          setAvailableRarities(rarities);

          // Initialize expanded state for all sets
          const initialExpandedState: Record<string, boolean> = {};
          availableSets.forEach(set => {
            initialExpandedState[set] = true; // Start with all expanded
          });
          setExpandedSets(initialExpandedState);
        } else if (isMounted) {
          // Fallback data if no cards are found
          console.log('OrganizedCardCollection: No cards found, using fallback data');
          const fallbackCards = generateFallbackCards();
          setCards(fallbackCards);

          // Extract unique rarities for filters from fallback data
          const rarities = [...new Set(fallbackCards.map(card => card.rarity))];
          setAvailableRarities(rarities);

          // Initialize expanded state for all sets
          const initialExpandedState: Record<string, boolean> = {};
          availableSets.forEach(set => {
            initialExpandedState[set] = true; // Start with all expanded
          });
          setExpandedSets(initialExpandedState);
        }
      } catch (err) {
        console.error('OrganizedCardCollection: Error fetching cards:', err);

        // Only use fallback data if we don't have any cards yet and component is still mounted
        if (isMounted && cards.length === 0) {
          console.log('OrganizedCardCollection: Using fallback data due to error');
          const fallbackCards = generateFallbackCards();
          setCards(fallbackCards);

          // Extract unique rarities for filters from fallback data
          const rarities = [...new Set(fallbackCards.map(card => card.rarity))];
          setAvailableRarities(rarities);

          // Initialize expanded state for all sets
          const initialExpandedState: Record<string, boolean> = {};
          availableSets.forEach(set => {
            initialExpandedState[set] = true; // Start with all expanded
          });
          setExpandedSets(initialExpandedState);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    fetchCards();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [searchQuery, sortOption, setFilter, rarityFilter, limit, groupBySet]);

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

  // Group cards by set
  const cardsBySet = useMemo(() => {
    const setMap = new Map<string, GroupedCard[]>();

    groupedCards.forEach(card => {
      if (!setMap.has(card.set_name)) {
        setMap.set(card.set_name, []);
      }
      setMap.get(card.set_name)!.push(card);
    });

    // Sort sets alphabetically
    return new Map([...setMap.entries()].sort());
  }, [groupedCards]);

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

  // Toggle set expansion
  const toggleSetExpansion = (setName: string) => {
    setExpandedSets(prev => ({
      ...prev,
      [setName]: !prev[setName]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSetFilter('all');
    setRarityFilter([]);
    setSortOption('set-name');
    setLimit(initialLimit);
  };

  // Load more cards
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setLimit(prevLimit => prevLimit + initialLimit);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading cards...</p>
      </div>
    );
  }

  if (groupedCards.length === 0) {
    return (
      <div className="flex flex-col items-center p-12 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="relative w-24 h-24 mb-6 opacity-50">
          <Image
            src="/images/card-placeholder.png"
            alt="No cards found"
            fill
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">No cards found</h3>
        <p className="text-lg mb-6 text-center text-gray-600 dark:text-gray-400">No cards available matching your criteria.</p>
        {(searchQuery || setFilter !== 'all' || rarityFilter.length > 0) && (
          <Button
            onClick={clearFilters}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      {(showSearch || showFilters) && (
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-5 shadow-sm border border-blue-100 dark:border-blue-900/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {showSearch && (
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search cards by name..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 bg-white/90 dark:bg-gray-900/90 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
                />
              </div>
            )}

            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-[180px] bg-white/90 dark:bg-gray-900/90 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-blue-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set-name">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span>By Set & Number</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    <SelectItem value="rarity">By Rarity</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {availableSets.length > 0 && (
                  <Select value={setFilter} onValueChange={(value) => {
                    setSetFilter(value);
                    setLimit(initialLimit); // Reset limit when changing set
                  }}>
                    <SelectTrigger className="w-[180px] bg-white/90 dark:bg-gray-900/90 border-blue-200 dark:border-blue-800">
                      <SelectValue placeholder="Filter by Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sets</SelectItem>
                      {availableSets.sort().map(set => (
                        <SelectItem key={set} value={set}>{set}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {availableRarities.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 border-blue-200 dark:border-blue-800">
                        <Star className="h-4 w-4 text-yellow-500" />
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
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${getRarityColor(rarity)}`}></div>
                            {rarity}
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {(searchQuery || setFilter !== 'all' || rarityFilter.length > 0) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Active filters display */}
          {(searchQuery || setFilter !== 'all' || rarityFilter.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <div className="text-xs text-muted-foreground mr-2 flex items-center">
                <Filter className="h-3 w-3 mr-1" /> Active filters:
              </div>

              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                  Search: {searchQuery}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}

              {setFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                  Set: {setFilter}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => setSetFilter('all')}
                  />
                </Badge>
              )}

              {rarityFilter.map(rarity => (
                <Badge key={rarity} variant="secondary" className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                  <div className={`h-2 w-2 rounded-full ${getRarityColor(rarity)}`}></div>
                  {rarity}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => toggleRarityFilter(rarity)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card Display */}
      {groupBySet ? (
        // Display cards grouped by set
        <div className="space-y-8">
          {Array.from(cardsBySet.entries()).map(([setName, setCards]) => (
            <div key={setName} className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800">
              <Collapsible
                open={expandedSets[setName]}
                onOpenChange={() => toggleSetExpansion(setName)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                        <Image
                          src={setCards[0]?.image_url || '/images/card-placeholder.png'}
                          alt={setName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{setName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-normal">{setCards.length} cards</Badge>
                          {setCards.some(card => card.rarity.toLowerCase().includes('rare')) && (
                            <Badge variant="outline" className="text-xs font-normal bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">Contains Rare Cards</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${expandedSets[setName] ? 'rotate-90' : ''}`} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {setCards.map((card, index) => (
                        <Link key={card.id} href={`/shop/cards/${card.id}`}>
                          <Card
                            className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 animate-fadeIn"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 p-2">
                              <Image
                                src={card.image_url || '/images/card-placeholder.png'}
                                alt={card.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                className="object-contain"
                              />
                              {card.quantity > 1 && (
                                <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                                  {card.quantity}
                                </div>
                              )}
                              <div className={`absolute bottom-2 right-2 ${getRarityColor(card.rarity)} text-white text-xs font-bold px-2 py-1 rounded-md shadow-md`}>
                                {card.rarity}
                              </div>
                            </div>
                            <CardContent className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                              <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
                              <p className="text-xs text-muted-foreground">#{card.card_number}</p>
                              {card.condition && (
                                <p className="text-xs text-muted-foreground">{card.condition}</p>
                              )}
                            </CardContent>
                            <CardFooter className="p-3 pt-0 bg-white/80 dark:bg-black/80">
                              <div className="text-sm font-bold">${card.price?.toFixed(2) || 'Price unavailable'}</div>
                            </CardFooter>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      ) : (
        // Display all cards in a grid
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {groupedCards.map((card, index) => (
              <Link key={card.id} href={`/shop/cards/${card.id}`}>
                <Card
                  className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 p-2">
                    <Image
                      src={card.image_url || '/images/card-placeholder.png'}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-contain"
                    />
                    {card.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                        {card.quantity}
                      </div>
                    )}
                    <div className={`absolute bottom-2 right-2 ${getRarityColor(card.rarity)} text-white text-xs font-bold px-2 py-1 rounded-md shadow-md`}>
                      {card.rarity}
                    </div>
                  </div>
                  <CardContent className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                    <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground line-clamp-1">{card.set_name}</p>
                      <p className="text-xs text-muted-foreground">#{card.card_number}</p>
                    </div>
                    {card.condition && (
                      <p className="text-xs text-muted-foreground">{card.condition}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 pt-0 bg-white/80 dark:bg-black/80">
                    <div className="text-sm font-bold">${card.price?.toFixed(2) || 'Price unavailable'}</div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Loading...
                  </>
                ) : (
                  'Load More Cards'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
