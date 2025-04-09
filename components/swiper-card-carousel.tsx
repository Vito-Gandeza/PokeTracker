'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { useCurrency } from '@/lib/currency-context';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';
// Import required modules
import { Autoplay } from 'swiper/modules';

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

interface SwiperCardCarouselProps {
  limit?: number;
}

// Generate fallback cards when database is not available
function generateFallbackCards(): CardProduct[] {
  return [
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
    }
  ];
}

export default function SwiperCardCarousel({
  limit = 16
}: SwiperCardCarouselProps) {
  // Get currency context
  const { formatPrice } = useCurrency();

  const [cards, setCards] = useState<GroupedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<HTMLDivElement>(null);

  // Prevent text selection when dragging
  useEffect(() => {
    const swiperElement = swiperRef.current;

    const preventSelection = (e: MouseEvent) => {
      if (e.buttons === 1) { // Left mouse button is pressed
        e.preventDefault();
      }
    };

    swiperElement?.addEventListener('mousedown', (e) => {
      if (e.buttons === 1) {
        document.body.classList.add('no-select');
      }
    });

    document.addEventListener('mouseup', () => {
      document.body.classList.remove('no-select');
    });

    swiperElement?.addEventListener('mousemove', preventSelection);

    return () => {
      swiperElement?.removeEventListener('mousemove', preventSelection);
      document.body.classList.remove('no-select');
      document.removeEventListener('mouseup', () => {
        document.body.classList.remove('no-select');
      });
    };
  }, []);

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
          setCards(groupedCards);
        } else {
          // Fallback data if no cards are found
          const fallbackCards = generateFallbackCards().filter(card =>
            !['Common', 'Uncommon'].includes(card.rarity)
          );
          const groupedFallback = groupCards(fallbackCards);
          setCards(groupedFallback);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        // Provide fallback data on error
        const fallbackCards = generateFallbackCards().filter(card =>
          !['Common', 'Uncommon'].includes(card.rarity)
        );
        const groupedFallback = groupCards(fallbackCards);
        setCards(groupedFallback);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [limit]);

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

  // Create a duplicate array of cards for infinite loop effect
  // Using fewer duplicates to reduce load
  const duplicatedCards = [...cards, ...cards];

  return (
    <div className="relative w-full" ref={swiperRef}>
      <Swiper
        modules={[Autoplay]}
        spaceBetween={16}
        slidesPerView={4}
        breakpoints={{
          320: { slidesPerView: 1.5, spaceBetween: 12 },
          640: { slidesPerView: 2.5, spaceBetween: 14 },
          768: { slidesPerView: 3.5, spaceBetween: 16 },
          1024: { slidesPerView: 4.5, spaceBetween: 20 },
          1280: { slidesPerView: 5.5, spaceBetween: 24 },
        }}
        loop={true}
        speed={2500}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
        }}
        grabCursor={true}
        simulateTouch={true}
        allowTouchMove={true}
        touchEventsTarget="container"
        watchSlidesProgress={true}
        preventClicks={false}
        preventClicksPropagation={false}
        resistance={true}
        resistanceRatio={0.85}
        className="mySwiper"
      >
        {duplicatedCards.map((card, index) => (
          <SwiperSlide key={`${card.id}-${index}`}>
            <Link href={`/shop/cards/${card.id}`}>
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 rounded-xl" style={{ width: '220px', margin: '0 auto' }}>
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
                <CardContent className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                  <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{card.set_name}</p>
                </CardContent>
                <CardFooter className="p-2 pt-0 bg-white/80 dark:bg-black/80">
                  <div className="text-sm font-bold">{card.price ? formatPrice(card.price) : 'Price unavailable'}</div>
                </CardFooter>
              </Card>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
