'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import CardProductGrid from '@/components/card-product-grid';

interface CardSet {
  id: string;
  name: string;
  image_url: string;
  description: string;
}

const cardSets: Record<string, CardSet> = {
  'scarlet-violet-destined-rivals': {
    id: 'scarlet-violet-destined-rivals',
    name: 'Scarlet & Violet: Destined Rivals',
    image_url: '/images/sets/destined-rivals.jpg',
    description: 'Unleash Power & Prestige'
  },
  'scarlet-violet-journey-together': {
    id: 'scarlet-violet-journey-together',
    name: 'Scarlet & Violet: Journey Together',
    image_url: '/images/sets/journey-together.jpg',
    description: 'Bond Through Battle'
  },
  'scarlet-violet-surging-storm': {
    id: 'scarlet-violet-surging-storm',
    name: 'Scarlet & Violet: Surging Sparks',
    image_url: '/images/sets/surging-storm.jpg',
    description: 'Electrify Your Decck'
  },
  'scarlet-violet-prismatic-Evolutions': {
    id: 'scarlet-violet-prismatic-solutions',
    name: 'Scarlet & Violet: Prismatic Solutions',
    image_url: '/images/sets/prismatic-solutions.jpg',
    description: 'Shine Bright in Battle'
  }
};

export default function CardSetPage({ params }: { params: { setId: string } }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const setId = params.setId;
  const cardSet = cardSets[setId];

  useEffect(() => {
    async function fetchCards() {
      const supabase = createClient();
      
      // In a real app, you would filter by set name or ID
      // This is a simplified example
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
  }, [setId]);

  if (!cardSet) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Set not found</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[300px] w-full overflow-hidden">
          <Image
            src={cardSet.image_url}
            alt={cardSet.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">{cardSet.name}</h1>
          <p className="text-lg text-muted-foreground">{cardSet.description}</p>
        </div>
      </section>

      {/* Cards Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Cards in this set</h2>
        </div>
        <CardProductGrid />
      </section>
    </div>
  );
}
