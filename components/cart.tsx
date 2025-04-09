'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Minus, ShoppingCart, LogIn, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useCurrency } from '@/lib/currency-context';

interface StockInfo {
  [key: string]: {
    available: number;
    name: string;
    overLimit: boolean;
  };
}

export default function Cart() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  // Get currency context
  const { formatPrice } = useCurrency();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [stockError, setStockError] = useState<string | null>(null);

  // Check stock availability for all items in cart
  useEffect(() => {
    async function checkStock() {
      if (items.length === 0) return;

      const supabase = createClient();
      const newStockInfo: StockInfo = {};
      let hasStockIssue = false;

      for (const item of items) {
        try {
          // Get the card details to check stock
          const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('id', item.id)
            .single();

          if (error) {
            console.error('Error fetching card details:', error);
            continue;
          }

          // Count how many of this card are available
          const { count, error: countError } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('name', data.name)
            .eq('set_name', data.set_name)
            .eq('card_number', data.card_number);

          if (countError) {
            console.error('Error counting cards:', countError);
            continue;
          }

          const available = count || 0;
          const overLimit = item.quantity > available;

          if (overLimit) {
            hasStockIssue = true;
          }

          newStockInfo[item.id] = {
            available,
            name: data.name,
            overLimit
          };
        } catch (err) {
          console.error('Error checking stock for item:', item.id, err);
        }
      }

      setStockInfo(newStockInfo);

      if (hasStockIssue) {
        setStockError('Some items exceed available stock. Please adjust quantities.');
      } else {
        setStockError(null);
      }
    }

    checkStock();
  }, [items]);

  // Handle quantity update with stock check
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }

    const stockItem = stockInfo[id];
    if (stockItem && newQuantity > stockItem.available) {
      // Show error or alert that quantity exceeds stock
      alert(`Sorry, only ${stockItem.available} of ${stockItem.name} available in stock.`);
      // Update to maximum available instead
      updateQuantity(id, stockItem.available);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!isAuthenticated) return;

    // Check if any items exceed stock limits
    const hasStockIssues = Object.values(stockInfo).some(item => item.overLimit);
    if (hasStockIssues) {
      alert('Please adjust quantities for items that exceed available stock.');
      return;
    }

    // Redirect to checkout page using Next.js router to preserve state
    router.push('/checkout');
  };

  if (isCheckingOut) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {checkoutComplete ? 'Order Complete!' : 'Processing Order...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkoutComplete ? (
            <p>Thank you for your purchase! Your order has been placed successfully.</p>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Cart</CardTitle>
      </CardHeader>
      {stockError && (
        <div className="px-6 pt-2">
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <div className="text-sm">{stockError}</div>
          </div>
        </div>
      )}
      <CardContent className="space-y-4">
        {items.map((item) => {
          const itemStock = stockInfo[item.id];
          const isOverLimit = itemStock?.overLimit;

          return (
            <div key={item.id} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <div className="relative h-16 w-16 overflow-hidden rounded">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                  {itemStock && (
                    <p className={`text-xs ${isOverLimit ? 'text-red-500 font-semibold' : 'text-green-600'}`}>
                      {isOverLimit
                        ? `Only ${itemStock.available} in stock`
                        : `${itemStock.available} available`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className={`w-8 text-center ${isOverLimit ? 'text-red-500 font-bold' : ''}`}>
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={itemStock && item.quantity >= itemStock.available}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex justify-between w-full">
          <span className="font-medium">Total:</span>
          <span className="font-bold">{formatPrice(totalPrice)}</span>
        </div>
        {isAuthenticated ? (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleCheckout}
            disabled={items.length === 0 || Object.values(stockInfo).some(item => item.overLimit)}
          >
            {Object.values(stockInfo).some(item => item.overLimit)
              ? 'Adjust Quantities to Checkout'
              : 'Proceed to Checkout'}
          </Button>
        ) : (
          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Login to Checkout
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
