'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface RelatedProduct {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  price: number;
  set_name?: string;
  card_number?: string;
  quantity?: number;
}

interface GroupedProduct extends RelatedProduct {
  quantity: number;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);

  // Group products by name, set, and card number to show quantity
  useEffect(() => {
    async function groupProducts() {
      const supabase = createClient();
      const productMap = new Map<string, GroupedProduct>();

      // First pass: group by name, set, and card number
      for (const product of products) {
        const key = `${product.name}-${product.set_name || ''}-${product.card_number || ''}`;

        if (!productMap.has(key)) {
          // Create a new entry with quantity 1
          productMap.set(key, { ...product, quantity: 1 });
        } else {
          // Increment quantity for existing entry
          const existing = productMap.get(key)!;
          existing.quantity += 1;
        }
      }

      // For each group, fetch the actual count from the database
      for (const [key, product] of productMap.entries()) {
        if (product.set_name && product.card_number) {
          try {
            const { count, error } = await supabase
              .from('cards')
              .select('*', { count: 'exact', head: true })
              .eq('name', product.name)
              .eq('set_name', product.set_name)
              .eq('card_number', product.card_number);

            if (!error && count) {
              product.quantity = count;
            }
          } catch (err) {
            console.error('Error fetching card count:', err);
          }
        }
      }

      setGroupedProducts(Array.from(productMap.values()));
    }

    groupProducts();
  }, [products]);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {groupedProducts.map((product) => (
          <Link key={product.id} href={`/shop/cards/${product.id}`}>
            <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                {product.quantity > 1 && (
                  <Badge className="absolute top-2 right-2 z-10 bg-green-600 hover:bg-green-700">
                    {product.quantity} in stock
                  </Badge>
                )}
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-contain"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{product.description || product.set_name}</p>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <div className="text-sm font-bold">${product.price.toFixed(2)}</div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
