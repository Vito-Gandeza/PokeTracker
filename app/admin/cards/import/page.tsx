'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Download, Search, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: {
    symbol: string;
    logo: string;
  };
}

interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  number: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      trendPrice?: number;
    };
  };
  tcgplayer?: {
    prices?: any;
  };
  selected?: boolean;
}

export default function ImportCardsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // API key for Pokemon TCG API
  const apiKey = 'd2cf1828-877c-4f8d-947c-7377dfb810be';

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isAdmin) {
      router.push('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive"
      });
    }
  }, [isAuthenticated, isAdmin, router, toast]);

  // Fetch sets from Pokemon TCG API
  useEffect(() => {
    async function fetchSets() {
      setLoading(true);
      try {
        const response = await fetch('https://api.pokemontcg.io/v2/sets', {
          headers: {
            'X-Api-Key': apiKey
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sets');
        }

        const data = await response.json();
        // Sort sets by release date (newest first)
        const sortedSets = data.data.sort((a: PokemonSet, b: PokemonSet) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );

        setSets(sortedSets);
      } catch (error) {
        console.error('Error fetching sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Pokemon sets. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSets();
  }, [toast]);

  // Fetch cards from selected set
  const fetchCards = async () => {
    if (!selectedSet) return;

    setLoading(true);
    setCards([]);
    setFilteredCards([]);
    setSelectedCards([]);
    setSelectAll(false);

    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${selectedSet}`, {
        headers: {
          'X-Api-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      setCards(data.data);
      setFilteredCards(data.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error",
        description: "Failed to load cards from the selected set. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter cards based on search query
  useEffect(() => {
    if (cards.length === 0) return;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = cards.filter(card =>
        card.name.toLowerCase().includes(query) ||
        card.number.toLowerCase().includes(query) ||
        (card.rarity && card.rarity.toLowerCase().includes(query))
      );
      setFilteredCards(filtered);
    } else {
      setFilteredCards(cards);
    }
  }, [searchQuery, cards]);

  // Handle card selection
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(card => card.id));
    }
    setSelectAll(!selectAll);
  };

  // Calculate price based on rarity
  const calculatePrice = (card: PokemonCard) => {
    // Try to get price from cardmarket or tcgplayer
    if (card.cardmarket?.prices?.averageSellPrice) {
      return card.cardmarket.prices.averageSellPrice;
    }

    if (card.cardmarket?.prices?.trendPrice) {
      return card.cardmarket.prices.trendPrice;
    }

    // Fallback to rarity-based pricing
    const rarityPrices: { [key: string]: number } = {
      'Common': 0.99,
      'Uncommon': 1.99,
      'Rare': 3.99,
      'Rare Holo': 5.99,
      'Rare Ultra': 9.99,
      'Rare Holo EX': 14.99,
      'Rare Holo GX': 14.99,
      'Rare Holo V': 12.99,
      'Rare Holo VMAX': 19.99,
      'Rare BREAK': 7.99,
      'Rare Prism Star': 8.99,
      'Rare ACE': 9.99,
      'Rare Rainbow': 24.99,
      'Rare Secret': 29.99,
      'Rare Shiny': 19.99,
      'Rare Shiny GX': 29.99,
      'Rare Holo LV.X': 19.99,
      'LEGEND': 24.99,
      'Rare Prime': 9.99,
      'Amazing Rare': 14.99,
      'Rare Holo Star': 19.99,
      'Promo': 4.99,
      'Trainer Gallery Rare Holo': 9.99,
      'Radiant Rare': 12.99,
      'Illustration Rare': 14.99,
      'Special Illustration Rare': 29.99,
      'Hyper Rare': 24.99,
      'Trainer Gallery': 9.99
    };

    return rarityPrices[card.rarity] || 1.99;
  };

  // Import selected cards to Supabase
  const importCards = async () => {
    if (selectedCards.length === 0) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to import.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      const supabase = createClient();

      // Prepare cards for import
      const cardsToImport = selectedCards.map(cardId => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return null;

        return {
          name: card.name,
          set_name: card.set.name,
          card_number: card.number,
          rarity: card.rarity || 'Unknown',
          image_url: card.images.large,
          price: calculatePrice(card),
          condition: 'Near Mint',
          description: `${card.name} from the ${card.set.name} set.`,
          seller_notes: `${card.name} card in Near Mint condition from ${card.set.name} set.`
        };
      }).filter(Boolean);

      // Insert cards in batches of 10
      const batchSize = 10;
      let successCount = 0;

      for (let i = 0; i < cardsToImport.length; i += batchSize) {
        const batch = cardsToImport.slice(i, i + batchSize);

        const { error } = await supabase
          .from('cards')
          .insert(batch);

        if (error) {
          console.error('Error importing batch:', error);
        } else {
          successCount += batch.length;
        }

        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} of ${selectedCards.length} cards.`,
      });

      // Redirect back to cards list
      router.push('/admin/cards');
    } catch (error) {
      console.error('Error importing cards:', error);
      toast({
        title: "Error",
        description: "Failed to import cards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <Button
                variant="ghost"
                className="mb-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                onClick={() => router.push('/admin/cards')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cards
              </Button>
              <CardTitle className="text-blue-900">Import Cards from Pokemon TCG API</CardTitle>
              <CardDescription className="text-blue-700">
                Browse and import cards from the Pokemon TCG API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-gradient-to-b from-blue-50 to-white">
          <Tabs defaultValue="sets" className="space-y-4">
            <TabsList className="bg-blue-100">
              <TabsTrigger value="sets" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Browse Sets</TabsTrigger>
              <TabsTrigger value="cards" disabled={!selectedSet} className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Browse Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="sets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  <div className="col-span-full flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-blue-700">Loading sets...</span>
                  </div>
                ) : sets.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-blue-700">No sets found. Please try again.</p>
                  </div>
                ) : (
                  sets.map((set) => (
                    <Card
                      key={set.id}
                      className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedSet === set.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedSet(set.id)}
                      style={{ backgroundColor: selectedSet === set.id ? '#e6f0ff' : '#f0f7ff' }}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="w-12 h-12 relative bg-white rounded-full p-1 shadow-sm">
                            {set.images.symbol && (
                              <Image
                                src={set.images.symbol}
                                alt={`${set.name} symbol`}
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">{set.printedTotal} cards</Badge>
                        </div>
                        <h3 className="font-medium text-lg mb-1 text-blue-900">{set.name}</h3>
                        <p className="text-sm text-blue-700">{set.series}</p>
                        <p className="text-xs mt-2 text-blue-600">Released: {new Date(set.releaseDate).toLocaleDateString()}</p>
                      </div>
                      {selectedSet === set.id && (
                        <div className="bg-blue-500 text-white p-2 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchCards();
                            }}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Browse Cards
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="cards" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-500" />
                  <Input
                    placeholder="Search cards..."
                    className="pl-8 border-blue-200 focus-visible:ring-blue-400 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-blue-200">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    className="text-blue-500 border-blue-300 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="select-all" className="text-blue-800">Select All ({filteredCards.length})</Label>
                </div>

                <Button
                  onClick={importCards}
                  disabled={importing || selectedCards.length === 0}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Download className="h-4 w-4" />
                  Import Selected ({selectedCards.length})
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-blue-700">Loading cards...</span>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-blue-700">No cards found. Try adjusting your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCards.map((card) => (
                    <Card
                      key={card.id}
                      className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        selectedCards.includes(card.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => toggleCardSelection(card.id)}
                      style={{ backgroundColor: selectedCards.includes(card.id) ? '#e6f0ff' : '#f0f7ff' }}
                    >
                      <div className="relative">
                        {selectedCards.includes(card.id) && (
                          <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full p-1 shadow-md">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div className="relative aspect-[2/3] w-full overflow-hidden border-b border-blue-100">
                          <Image
                            src={card.images.large}
                            alt={card.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm mb-1 text-blue-900">{card.name}</h3>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-blue-700">{card.set.name} · #{card.number}</p>
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">{card.rarity || 'Unknown'}</Badge>
                        </div>
                        <p className="text-sm font-semibold mt-2 text-blue-800">${calculatePrice(card).toFixed(2)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between bg-blue-50 border-t border-blue-100">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/cards')}
            className="border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
          >
            Cancel
          </Button>

          {selectedSet && (
            <Button
              onClick={importCards}
              disabled={importing || selectedCards.length === 0}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Download className="h-4 w-4" />
              Import Selected ({selectedCards.length})
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
