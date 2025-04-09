'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/lib/currency-context';

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

interface EnhancedCardCarouselProps {
  limit?: number;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
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
      condition: 'Near Mint'
    },
    {
      id: 'fallback-8',
      name: 'Charizard VMAX',
      image_url: 'https://images.pokemontcg.io/swsh3/20_hires.png',
      price: 199.99,
      rarity: 'Ultra Rare',
      set_name: 'Darkness Ablaze',
      card_number: '20',
      condition: 'Near Mint'
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

export default function EnhancedCardCarousel({
  limit = 16,
  title = "Featured Pokémon Cards",
  subtitle = "Explore our collection of rare and unique cards",
  viewAllLink = "/shop/all-cards",
  viewAllText = "View All Cards"
}: EnhancedCardCarouselProps) {
  // Get currency context
  const { formatPrice } = useCurrency();

  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Group cards by name, set, and card number
  const groupCards = (cards: CardProduct[]) => {
    const groupedMap = new Map<string, CardProduct & { quantity: number }>();

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
  };

  // Fetch cards from Supabase with better error handling and state management
  useEffect(() => {
    // Track component mount state to prevent state updates after unmount
    let isMounted = true;

    // Show fallback data immediately to improve perceived performance
    const fallbackCards = generateFallbackCards().filter(card =>
      !['Common', 'Uncommon'].includes(card.rarity)
    );
    const groupedFallback = groupCards(fallbackCards);
    const duplicatedFallback = [...groupedFallback, ...groupedFallback, ...groupedFallback];

    // Only set loading to true if we don't have cards yet
    if (cards.length === 0) {
      setCards(duplicatedFallback);
      setLoading(true);
    }

    async function fetchCards() {
      try {
        console.log('EnhancedCardCarousel: Fetching cards from Supabase');
        const supabase = createClient();

        // Filter out common and uncommon cards
        let query = supabase
          .from('cards')
          .select('*')
          .not('rarity', 'in', '("Common","Uncommon")')
          .order('created_at', { ascending: false })
          .limit(limit * 2); // Fetch more to account for filtering

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (isMounted && data && data.length > 0) {
          console.log(`EnhancedCardCarousel: Successfully fetched ${data.length} cards`);
          // Group cards to handle duplicates
          const groupedCards = groupCards(data);
          // Duplicate the cards to create an infinite loop effect
          const duplicatedCards = [...groupedCards, ...groupedCards, ...groupedCards];
          setCards(duplicatedCards);
        } else if (isMounted && (!data || data.length === 0)) {
          console.log('EnhancedCardCarousel: No cards found, using fallback data');
          // Keep using fallback data if already set
          if (cards.length === 0) {
            setCards(duplicatedFallback);
          }
        }
      } catch (err) {
        console.error('EnhancedCardCarousel: Error fetching cards:', err);
        // Keep using fallback data if already set
        if (isMounted && cards.length === 0) {
          setCards(duplicatedFallback);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCards();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [limit]);

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }

      autoScrollRef.current = setInterval(() => {
        if (carouselRef.current && !isDragging) {
          const scrollSpeed = 0.5;
          const newScrollLeft = carouselRef.current.scrollLeft + scrollSpeed;
          carouselRef.current.scrollLeft = newScrollLeft;

          // Reset to beginning when reaching the end for infinite scroll effect
          if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 3 - 10) {
            carouselRef.current.scrollLeft = 0;
          }
        }
      }, 10); // Smooth scrolling with small increments
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isDragging]);

  // Handle mouse/touch interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
    document.body.classList.add('no-select'); // Prevent text selection while dragging
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('no-select');
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.classList.remove('no-select');
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Navigation controls
  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -500,
        behavior: 'smooth'
      });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 500,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center p-12 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="relative w-24 h-24 mb-6 opacity-50">
          <Image
            src="/images/card-placeholder.png"
            alt="No cards found"
            fill
            sizes="96px"
            className="object-contain"
          />
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">No cards found</h3>
        <p className="text-lg mb-6 text-center text-gray-600 dark:text-gray-400">No cards available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Link href={viewAllLink} className="mt-2 md:mt-0">
          <Button
            variant="outline"
            className="border-blue-400 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 hover:scale-105"
          >
            {viewAllText}
          </Button>
        </Link>
      </div>

      {/* Main Carousel */}
      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 border border-blue-100 dark:border-blue-900/50 shadow-sm">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide py-4 px-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {cards.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              className="flex-none w-[220px] md:w-[240px] p-2"
              onMouseEnter={() => setHoveredCard(`${card.id}-${index}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Link href={`/shop/cards/${card.id}`}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card
                    className={`h-full overflow-hidden transition-all duration-300 hover:shadow-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 rounded-xl ${
                      hoveredCard === `${card.id}-${index}` ? 'scale-105 shadow-xl' : ''
                    }`}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden p-3">
                      <motion.div
                        animate={{
                          rotateY: hoveredCard === `${card.id}-${index}` ? 5 : 0,
                          rotateX: hoveredCard === `${card.id}-${index}` ? -5 : 0,
                          scale: hoveredCard === `${card.id}-${index}` ? 1.05 : 1
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ width: '100%', height: '100%', position: 'relative' }}
                      >
                        <Image
                          src={card.image_url || '/images/card-placeholder.png'}
                          alt={card.name}
                          fill
                          sizes="(max-width: 640px) 220px, 240px"
                          className="object-contain"
                          priority={index < 5}
                        />
                      </motion.div>

                      {card.quantity > 1 && (
                        <Badge className="absolute top-2 right-2 bg-black/80 text-white font-bold rounded-full h-6 w-6 flex items-center justify-center p-0 shadow-md">
                          {card.quantity}
                        </Badge>
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
                    </CardContent>

                    <CardFooter className="p-3 pt-0 bg-white/80 dark:bg-black/80">
                      <div className="text-sm font-bold">{card.price ? formatPrice(card.price) : 'Price unavailable'}</div>
                      {hoveredCard === `${card.id}-${index}` && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto"
                        >
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-2 bg-blue-500/90 text-white border-0 hover:bg-blue-600">
                            <Star className="h-3 w-3 mr-1" /> View
                          </Button>
                        </motion.div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              </Link>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black z-10 shadow-md border-blue-200 dark:border-blue-800 h-10 w-10"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black z-10 shadow-md border-blue-200 dark:border-blue-800 h-10 w-10"
          onClick={scrollNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
