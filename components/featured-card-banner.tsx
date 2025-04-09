'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FeaturedCardBannerProps {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export default function FeaturedCardBanner({ title, subtitle, imageUrl }: FeaturedCardBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg mb-8">
      <div className="relative h-[300px] w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="text-sm uppercase tracking-wider mb-1">POKEMON TCG</div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
        <p className="text-lg mb-4">{subtitle}</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
          <Link href="/shop/featured">View Products</Link>
        </Button>
      </div>
    </div>
  );
}
