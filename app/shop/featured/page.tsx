'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import CardProductGrid from '@/components/card-product-grid';

export default function FeaturedCards() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[300px] w-full overflow-hidden">
          <Image
            src="/images/sets/destined-rivals.jpg"
            alt="Featured Pokemon Cards"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Featured Cards</h1>
          <p className="text-lg text-muted-foreground">Discover our selection of the most sought-after Pokemon cards</p>
        </div>
      </section>

      {/* Cards Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Scarlet & Violet: Destined Rivals</h2>
        </div>
        <CardProductGrid />
      </section>
    </div>
  );
}
