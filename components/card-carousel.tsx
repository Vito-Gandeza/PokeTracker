'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface CardCarouselProps {
  limit?: number;
  autoScrollSpeed?: number; // in milliseconds
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

export default function CardCarousel({
  limit = 12,
  autoScrollSpeed = 30 // Lower value for smoother scrolling
}: CardCarouselProps) {
  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
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

  // Fetch cards from Supabase
  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      try {
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

        if (data && data.length > 0) {
          // Group cards to handle duplicates
          const groupedCards = groupCards(data);
          // Duplicate the cards to create an infinite loop effect
          const duplicatedCards = [...groupedCards, ...groupedCards];
          setCards(duplicatedCards);
        } else {
          // Fallback data if no cards are found
          const fallbackCards = generateFallbackCards().filter(card =>
            !['Common', 'Uncommon'].includes(card.rarity)
          );
          const groupedFallback = groupCards(fallbackCards);
          const duplicatedFallback = [...groupedFallback, ...groupedFallback];
          setCards(duplicatedFallback);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        // Provide fallback data on error
        const fallbackCards = generateFallbackCards().filter(card =>
          !['Common', 'Uncommon'].includes(card.rarity)
        );
        const groupedFallback = groupCards(fallbackCards);
        const duplicatedFallback = [...groupedFallback, ...groupedFallback];
        setCards(duplicatedFallback);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [limit]);

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }

      autoScrollRef.current = setInterval(() => {
        if (carouselRef.current) {
          // Continue scrolling even if user is interacting, but at a slower pace
          const scrollSpeed = isDragging ? 0.1 : 0.5;
          const newScrollLeft = carouselRef.current.scrollLeft + scrollSpeed;
          carouselRef.current.scrollLeft = newScrollLeft;

          // Reset to beginning when reaching the end for infinite scroll effect
          if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2 - 10) {
            carouselRef.current.scrollLeft = 0;
          }
        }
      }, 10); // Even smoother scrolling with smaller increments and faster interval
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
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
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
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Calculate visible dots for navigation
  const totalDots = Math.ceil(cards.length / 2 / 4); // Assuming 4 cards visible at a time
  const activeDot = Math.floor((carouselRef.current?.scrollLeft || 0) / (carouselRef.current?.clientWidth || 1));

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-lg mb-4">No cards available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory py-4"
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
            className="flex-none w-[220px] md:w-[250px] p-2 snap-start"
          >
            <Link href={`/shop/cards/${card.id}`}>
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="relative aspect-[2/3] w-full overflow-hidden p-4">
                  <Image
                    src={card.image_url || '/images/card-placeholder.png'}
                    alt={card.name}
                    fill
                    sizes="(max-width: 640px) 220px, 250px"
                    className="object-contain"
                  />
                  {card.quantity > 1 && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                      {card.quantity}
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                    {card.rarity}
                  </div>
                </div>
                <CardContent className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                  <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{card.set_name}</p>
                </CardContent>
                <CardFooter className="p-3 pt-0 bg-white/80 dark:bg-black/80">
                  <div className="text-sm font-bold">${card.price?.toFixed(2) || 'Price unavailable'}</div>
                </CardFooter>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-white dark:hover:bg-black z-10 shadow-md border-blue-200 dark:border-blue-800"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-white dark:hover:bg-black z-10 shadow-md border-blue-200 dark:border-blue-800"
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Navigation Dots */}
      <div className="flex justify-center mt-6 gap-1">
        {Array.from({ length: totalDots }).map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === activeDot ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-6' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            onClick={() => {
              if (carouselRef.current) {
                carouselRef.current.scrollLeft = index * carouselRef.current.clientWidth;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
