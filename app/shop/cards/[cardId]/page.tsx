'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Share2, LogIn } from 'lucide-react';
import RelatedProducts from '@/components/related-products';

interface CardDetails {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  rarity: string;
  image_url: string;
  price: number;
  condition: string;
  description: string;
  seller_notes: string;
}

interface CardAttack {
  name: string;
  damage: string;
  description: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
}

// Generate fallback cards when database is not available
function generateFallbackCards(): CardDetails[] {
  return [
    {
      id: 'fallback-1',
      name: 'Pikachu',
      image_url: 'https://images.pokemontcg.io/base1/58_hires.png',
      price: 24.99,
      rarity: 'Common',
      set_name: 'Base Set',
      card_number: '58',
      condition: 'Excellent',
      description: 'When several of these Pokémon gather, their electricity can build and cause lightning storms.',
      seller_notes: 'Classic Pikachu card from the original Base Set. In excellent condition with minimal edge wear.'
    },
    {
      id: 'fallback-2',
      name: 'Charizard',
      image_url: 'https://images.pokemontcg.io/base1/4_hires.png',
      price: 299.99,
      rarity: 'Rare Holo',
      set_name: 'Base Set',
      card_number: '4',
      condition: 'Near Mint',
      description: 'Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
      seller_notes: 'Highly sought-after Charizard from Base Set. Near mint condition with beautiful holo pattern.'
    }
  ];
}

// Generate fallback related products
function generateFallbackRelatedProducts(): RelatedProduct[] {
  return [
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

export default function CardDetailPage({ params }: { params: { cardId: string } }) {
  // Initialize states
  const [card, setCard] = useState<CardDetails | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);

  // Fetch card details
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // Immediately show fallback data to prevent blank screen
    const showFallbackData = () => {
      if (!isMounted) return;

      const fallbackCards = generateFallbackCards();
      const fallbackRelated = generateFallbackRelatedProducts();

      // If it's a fallback ID, find the matching card
      if (params.cardId.startsWith('fallback-')) {
        const fallbackCard = fallbackCards.find(card => card.id === params.cardId) || fallbackCards[0];
        setCard(fallbackCard);
      } else {
        // For real IDs, use a fallback but with the correct ID
        const fallbackCard = { ...fallbackCards[0], id: params.cardId };
        setCard(fallbackCard);
      }

      setRelatedProducts(fallbackRelated);
      setLoading(false);
    };

    // Show fallback data immediately
    showFallbackData();

    async function fetchRealCardData() {
      try {
        console.log('Fetching real card data for ID:', params.cardId);
        const supabase = createClient();

        // Attempt to fetch the real card data
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('id', params.cardId)
          .single();

        if (error) {
          console.log('Error fetching card:', error.message);
          return; // Keep using fallback data
        }

        if (isMounted && data) {
          console.log('Successfully fetched real card data, replacing fallback');
          setCard(data);

          // Fetch related products (other cards from the same set or similar rarity)
          const { data: relatedData, error: relatedError } = await supabase
            .from('cards')
            .select('*')
            .neq('id', params.cardId)
            .eq('set_name', data.set_name)
            .limit(6);

          if (!relatedError && relatedData && relatedData.length > 0) {
            console.log('Successfully fetched related cards:', relatedData.length);
            setRelatedProducts(relatedData);
          }
        }
      } catch (err) {
        console.error('Error fetching real card data:', err);
        // Keep using fallback data
      }
    }

    // Only try to fetch real data if it's not a fallback ID
    if (!params.cardId.startsWith('fallback-')) {
      fetchRealCardData();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [params.cardId]);



  // State for available stock
  const [availableStock, setAvailableStock] = useState(1);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Get card quantity by counting cards with same name, set, and number
  useEffect(() => {
    if (card) {
      async function getCardQuantity() {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('name', card.name)
          .eq('set_name', card.set_name)
          .eq('card_number', card.card_number);

        if (!error && count) {
          setQuantity(count);
          setAvailableStock(count);
          // Reset selected quantity if it's more than available stock
          if (selectedQuantity > count) {
            setSelectedQuantity(1);
          }
        }
      }

      getCardQuantity();
    }
  }, [card, selectedQuantity]);



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>{error || 'Card not found'}</p>
      </div>
    );
  }



  const handleAddToCart = () => {
    if (card) {
      // Check if we have enough stock
      if (selectedQuantity <= availableStock) {
        addItem({
          id: card.id,
          name: card.name,
          price: card.price,
          image_url: card.image_url || '/images/card-placeholder.png',
          quantity: selectedQuantity,
          condition: card.condition || 'Unknown'
        });

        // Show a success message or toast notification here
        alert(`Added ${selectedQuantity} ${card.name} to cart`);
      } else {
        // Show an error message
        alert(`Sorry, only ${availableStock} in stock`);
      }
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= availableStock) {
      setSelectedQuantity(value);
    }
  };

  // Increment quantity
  const incrementQuantity = () => {
    if (selectedQuantity < availableStock) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  };

  // Decrement quantity
  const decrementQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card Image */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-[350px] aspect-[2/3]">
            <Image
              src={card.image_url || '/images/card-placeholder.png'}
              alt={card.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Card Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-normal">{card.set_name}</Badge>
            {card.card_number && <Badge variant="outline" className="text-xs font-normal">#{card.card_number}</Badge>}
            <Badge variant="outline" className="text-xs font-normal capitalize">{card.rarity}</Badge>
          </div>
          <h1 className="text-2xl font-bold mb-2">{card.name}</h1>
          <p className="text-sm mb-2">{card.condition || 'Mint'}</p>
          <div className="text-2xl font-bold mb-6">${card.price?.toFixed(2) || 'Price unavailable'}</div>

          {/* Stock Information */}
          <div className="mb-4">
            <p className="text-sm text-green-600 mb-2">
              Available: <span className="font-semibold">{availableStock}</span> in stock
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center mb-4">
              <span className="mr-2">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={decrementQuantity}
                  className="px-3 py-1 border-r hover:bg-gray-100"
                  disabled={selectedQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={availableStock}
                  value={selectedQuantity}
                  onChange={handleQuantityChange}
                  className="w-12 text-center py-1"
                />
                <button
                  onClick={incrementQuantity}
                  className="px-3 py-1 border-l hover:bg-gray-100"
                  disabled={selectedQuantity >= availableStock}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              className="w-full mb-4 flex items-center justify-center gap-2"
              onClick={handleAddToCart}
              disabled={availableStock === 0}
            >
              <ShoppingCart className="h-5 w-5" />
              {availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          ) : (
            <Button
              asChild
              className="w-full mb-4 flex items-center justify-center gap-2"
            >
              <Link href="/login">
                <LogIn className="h-5 w-5" />
                Login to Add to Cart
              </Link>
            </Button>
          )}

          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Card Type / HP / Stage/Water / 70 / Basic</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <div className="font-medium">Attack 1 [1] Determine</div>
                  <div className="text-muted-foreground">During your opponent's next turn, whenever they flip a coin, treat it as tails.</div>
                </li>
                <li>
                  <div className="font-medium">Attack 2 [W] Water Gun [10]</div>
                  <div className="text-muted-foreground"></div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Weakness / Resistance / Retreat Cost/Lv.2 / None / 1</h3>
            </div>
            <div>
              <h3 className="font-medium mb-2">Artist / Rarity</h3>
              <p className="text-sm">Mitsuhiro Arita</p>
            </div>
          </div>
        </div>

        {/* Cart is now shown in the header */}
      </div>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
