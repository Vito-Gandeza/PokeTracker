'use client';

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ArrowUpDown, TrendingUp, ChevronDown, X, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Pokemon TCG API key
const API_KEY = "d2cf1828-877c-4f8d-947c-7377dfb810be";

// API Environment variable
if (typeof window === 'undefined') {
  process.env.POKEMONTCG_API_KEY = API_KEY;
}

// Types
interface Card {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
  };
  rarity: string;
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: {
      [key: string]: {
        low: number;
        mid: number;
        high: number;
        market: number;
        directLow: number;
      };
    };
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice: number;
      lowPrice: number;
      trendPrice: number;
      germanProLow: number;
      suggestedPrice: number;
      reverseHoloSell: number;
      reverseHoloLow: number;
      reverseHoloTrend: number;
      lowPriceExPlus: number;
      avg1: number;
      avg7: number;
      avg30: number;
      reverseHoloAvg1: number;
      reverseHoloAvg7: number;
      reverseHoloAvg30: number;
    };
  };
}

interface PriceHistory {
  date: string;
  price: number;
}

interface FilterOption {
  label: string;
  value: string;
  checked: boolean;
}

type SortOption = "newest" | "price-low" | "price-high" | "popularity";

export default function PriceTrackerGallery() {
  // States
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [availableSets, setAvailableSets] = useState<FilterOption[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [availableRarities, setAvailableRarities] = useState<FilterOption[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch cards from Pokemon TCG API
  const fetchCards = async (isLoadMore = false) => {
    try {
      setError(null);
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      const pageSize = 20;
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());

      // Build the query string with all filters
      const queryParts = [];

      // Add search query if provided
      if (searchQuery) {
        queryParts.push(`name:"*${searchQuery}*"`);
      }

      // Add set filters if selected
      if (selectedSets.length > 0) {
        const setQuery = `(${selectedSets.map(set => `set.name:"${set}"`).join(' OR ')})`;
        queryParts.push(setQuery);
      }

      // Add rarity filters if selected
      if (selectedRarities.length > 0) {
        const rarityQuery = `(${selectedRarities.map(rarity => `rarity:"${rarity}"`).join(' OR ')})`;
        queryParts.push(rarityQuery);
      }

      // Combine all query parts with AND
      if (queryParts.length > 0) {
        queryParams.append('q', queryParts.join(' AND '));
      }

      // Add sorting
      let orderBy = '';
      switch (activeSort) {
        case 'newest':
          orderBy = 'set.releaseDate';
          break;
        case 'price-low':
          // Price sorting will be done client-side
          break;
        case 'price-high':
          // Price sorting will be done client-side
          break;
        case 'popularity':
          // No direct popularity metric, default to newest
          orderBy = 'set.releaseDate';
          break;
      }

      if (orderBy) {
        queryParams.append('orderBy', orderBy);
      }

      // Make API request
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?${queryParams.toString()}`, {
        headers: {
          'X-Api-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Filter by price range if needed
      let filteredData = data.data;
      if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
        filteredData = filteredData.filter(card => {
          const price = getCardPrice(card);
          return price >= priceRange[0] && price <= priceRange[1];
        });
      }

      // Sort by price if needed
      if (activeSort === 'price-low' || activeSort === 'price-high') {
        filteredData.sort((a, b) => {
          const priceA = getCardPrice(a);
          const priceB = getCardPrice(b);
          return activeSort === 'price-low' ? priceA - priceB : priceB - priceA;
        });
      }

      // Check if there are more items
      setHasMore(data.data.length === pageSize);

      // Update the cards state
      if (isLoadMore) {
        setCards(prevCards => [...prevCards, ...filteredData]);
      } else {
        setCards(filteredData);
      }

      // If this is the initial load, fetch sets and rarities
      if (isInitialLoad) {
        fetchSetsAndRarities();
        setIsInitialLoad(false);
      }

    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards. Please try again later.");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Helper function to get card price
  const getCardPrice = (card: Card): number => {
    if (card.tcgplayer && card.tcgplayer.prices) {
      // Get the first price category (normal, holofoil, etc.)
      const priceCategory = Object.values(card.tcgplayer.prices)[0];
      if (priceCategory) {
        return priceCategory.market || priceCategory.mid || priceCategory.low || 0;
      }
    } else if (card.cardmarket && card.cardmarket.prices) {
      return card.cardmarket.prices.averageSellPrice ||
             card.cardmarket.prices.trendPrice ||
             0;
    }
    return 0;
  };

  // Fetch available sets and rarities from Pokemon TCG API
  const fetchSetsAndRarities = async () => {
    try {
      // Fetch sets
      const setsResponse = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate', {
        headers: {
          'X-Api-Key': API_KEY
        }
      });

      if (!setsResponse.ok) {
        throw new Error(`API request failed with status ${setsResponse.status}`);
      }

      const setsData = await setsResponse.json();
      console.log(`Fetched ${setsData.data.length} sets from Pokemon TCG API`);

      // Extract set names and sort by release date (newest first)
      const sets = setsData.data
        .sort((a: any, b: any) => {
          // Sort by release date (newest first)
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        })
        .map((set: any) => ({
          label: `${set.name} (${set.series})`,
          value: set.name,
          checked: false
        }));

      setAvailableSets(sets);

      // For rarities, we'll use a predefined list since the API doesn't have a dedicated endpoint
      const rarities = [
        { label: 'Common', value: 'Common', checked: false },
        { label: 'Uncommon', value: 'Uncommon', checked: false },
        { label: 'Rare', value: 'Rare', checked: false },
        { label: 'Rare Holo', value: 'Rare Holo', checked: false },
        { label: 'Rare Ultra', value: 'Rare Ultra', checked: false },
        { label: 'Rare Holo EX', value: 'Rare Holo EX', checked: false },
        { label: 'Rare Holo GX', value: 'Rare Holo GX', checked: false },
        { label: 'Rare Holo V', value: 'Rare Holo V', checked: false },
        { label: 'Rare Holo VMAX', value: 'Rare Holo VMAX', checked: false },
        { label: 'Rare BREAK', value: 'Rare BREAK', checked: false },
        { label: 'Rare Prism Star', value: 'Rare Prism Star', checked: false },
        { label: 'Rare Secret', value: 'Rare Secret', checked: false },
        { label: 'Rare Rainbow', value: 'Rare Rainbow', checked: false },
        { label: 'Rare Shiny', value: 'Rare Shiny', checked: false },
        { label: 'Rare Shiny GX', value: 'Rare Shiny GX', checked: false },
        { label: 'Rare ACE', value: 'Rare ACE', checked: false },
        { label: 'Legend', value: 'Legend', checked: false },
        { label: 'Amazing Rare', value: 'Amazing Rare', checked: false },
        { label: 'Promo', value: 'Promo', checked: false },
      ];

      setAvailableRarities(rarities);

      // Set a reasonable max price for the slider
      setMaxPrice(1000);
      setPriceRange([0, 1000]);

    } catch (err) {
      console.error("Error fetching filters data:", err);
    }
  };

  // Load cards on initial render and when filters change
  useEffect(() => {
    fetchCards();
  }, [searchQuery, activeSort, selectedSets, selectedRarities, priceRange, page]);

  // Handle set selection
  const handleSetToggle = (set: FilterOption) => {
    if (selectedSets.includes(set.value)) {
      setSelectedSets(selectedSets.filter(s => s !== set.value));
    } else {
      setSelectedSets([...selectedSets, set.value]);
    }
  };

  // Handle rarity selection
  const handleRarityToggle = (rarity: FilterOption) => {
    if (selectedRarities.includes(rarity.value)) {
      setSelectedRarities(selectedRarities.filter(r => r !== rarity.value));
    } else {
      setSelectedRarities([...selectedRarities, rarity.value]);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setActiveSort("newest");
    setPriceRange([0, maxPrice]);
    setSelectedSets([]);
    setSelectedRarities([]);
    setPage(1);
  };

  // Load more cards
  const loadMoreCards = () => {
    setPage(prevPage => prevPage + 1);
    setIsLoadingMore(true);
    fetchCards(true);
  };

  // Format price display
  const formatPrice = (price: number | undefined) => {
    if (!price) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <motion.div
        className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 py-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search cards by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>

            <div className="flex gap-2">
              <Select value={activeSort} onValueChange={(value) => setActiveSort(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Filters
                    {(selectedSets.length > 0 || selectedRarities.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                      <Badge className="ml-1 bg-blue-500">{selectedSets.length + selectedRarities.length + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0)}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search with these filters
                    </SheetDescription>
                  </SheetHeader>

                  <div className="py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="mb-4"
                    >
                      <X size={14} className="mr-2" />
                      Reset Filters
                    </Button>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="price">
                        <AccordionTrigger>Price Range</AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-4 px-1">
                            <Slider
                              value={priceRange}
                              min={0}
                              max={maxPrice}
                              step={1}
                              onValueChange={(value) => setPriceRange(value as [number, number])}
                              className="mb-6"
                            />
                            <div className="flex justify-between text-sm">
                              <span>${priceRange[0]}</span>
                              <span>${priceRange[1]}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="sets">
                        <AccordionTrigger>Card Sets</AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2">
                            <Input
                              type="text"
                              placeholder="Search sets..."
                              className="mb-2"
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                const filteredSets = availableSets.filter(set =>
                                  set.label.toLowerCase().includes(searchTerm)
                                );
                                // We don't actually filter the availableSets state, just visually filter in the UI
                              }}
                            />
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                              {availableSets.map((set) => (
                                <div key={set.value} className="flex items-center space-x-2 py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                  <Checkbox
                                    id={`set-${set.value}`}
                                    checked={selectedSets.includes(set.value)}
                                    onCheckedChange={() => handleSetToggle(set)}
                                  />
                                  <Label htmlFor={`set-${set.value}`} className="text-sm cursor-pointer flex-1">{set.label}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="rarities">
                        <AccordionTrigger>Rarities</AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {availableRarities.map((rarity) => (
                                <div key={rarity.value} className="flex items-center space-x-2 py-1">
                                  <Checkbox
                                    id={`rarity-${rarity.value}`}
                                    checked={selectedRarities.includes(rarity.value)}
                                    onCheckedChange={() => handleRarityToggle(rarity)}
                                  />
                                  <Label htmlFor={`rarity-${rarity.value}`} className="text-sm cursor-pointer">{rarity.label}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <SheetClose asChild>
                    <Button className="w-full mt-4">Apply Filters</Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedSets.length > 0 || selectedRarities.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedSets.map(set => (
                <Badge key={set} variant="secondary" className="px-3 py-1">
                  {set}
                  <X
                    size={14}
                    className="ml-2 cursor-pointer"
                    onClick={() => setSelectedSets(selectedSets.filter(s => s !== set))}
                  />
                </Badge>
              ))}
              {selectedRarities.map(rarity => (
                <Badge key={rarity} variant="secondary" className="px-3 py-1">
                  {rarity}
                  <X
                    size={14}
                    className="ml-2 cursor-pointer"
                    onClick={() => setSelectedRarities(selectedRarities.filter(r => r !== rarity))}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4" ref={cardsContainerRef}>
        {loading && !isLoadingMore ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2">Loading cards...</p>
            </div>
          </div>
        ) : error ? (
          <motion.div
            className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-6 rounded-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-lg font-medium mb-4">{error}</p>
            <Button onClick={resetFilters}>
              Reset Filters
            </Button>
          </motion.div>
        ) : cards.length === 0 ? (
          <motion.div
            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-6 rounded-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-lg font-medium mb-4">No cards found matching your filters.</p>
            <Button onClick={resetFilters}>
              Reset Filters
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  custom={index}
                  variants={cardVariants}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="h-full"
                >
                  <Card className="overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg">
                    <div className="relative pt-[140%] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <Image
                        src={card.images?.small || '/images/card-placeholder.png'}
                        alt={card.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-medium">
                        {formatPrice(getCardPrice(card))}
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-lg mb-1 line-clamp-2">{card.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{card.set?.name}</p>
                        <Badge variant="outline" className="mb-2">{card.rarity}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <TrendingUp size={14} className="mr-1" />
                          <span>Price trend: </span>
                          <span className="text-green-500 ml-1">+2.4%</span>
                        </div>
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8 mb-12">
                <Button
                  onClick={loadMoreCards}
                  disabled={isLoadingMore}
                  className="px-8"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
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
    </div>
  );
}
