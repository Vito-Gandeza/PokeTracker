'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { useCurrency } from '@/lib/currency-context';

interface CardProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rarity: string;
  set_name: string;
}

export default function CardProductGrid() {
  // Get currency context
  const { formatPrice } = useCurrency();

  const [cards, setCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching cards:', error);
      } else if (data) {
        setCards(data);
      }

      setLoading(false);
    }

    fetchCards();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8">Loading cards...</div>;
  }

  if (cards.length === 0) {
    return <div className="flex justify-center p-8">No cards available.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
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
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-1">{card.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{card.set_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{card.rarity}</p>
            </CardContent>
            <CardFooter className="p-3 pt-0">
              <div className="text-sm font-bold">{card.price ? formatPrice(card.price) : 'Price unavailable'}</div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
