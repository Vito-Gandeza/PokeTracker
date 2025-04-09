'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface CardDetails {
  name: string;
  set_name: string;
  card_number: string;
  rarity: string;
  image_url: string;
  price: number;
  condition: string;
  description?: string;
  seller_notes?: string;
}

export default function AddCardPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CardDetails>({
    name: '',
    set_name: '',
    card_number: '',
    rarity: '',
    image_url: '',
    price: 0,
    condition: 'Near Mint',
    description: '',
    seller_notes: ''
  });

  const [conditions, setConditions] = useState<string[]>([
    'Mint', 'Near Mint', 'Excellent', 'Good', 'Played'
  ]);

  const [quantity, setQuantity] = useState(1);

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isAdmin) {
      router.push('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive"
      });
    }
  }, [isAuthenticated, isAdmin, router, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle price change (ensure it's a valid number)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setFormData(prev => ({ ...prev, price: value }));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const supabase = createClient();

      // Create an array of cards based on quantity
      const cards = Array.from({ length: quantity }, () => ({
        name: formData.name,
        set_name: formData.set_name,
        card_number: formData.card_number,
        rarity: formData.rarity,
        image_url: formData.image_url,
        price: formData.price,
        condition: formData.condition,
        description: formData.description,
        seller_notes: formData.seller_notes
      }));

      // Insert all cards
      const { error } = await supabase
        .from('cards')
        .insert(cards);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${quantity} card${quantity > 1 ? 's' : ''} added successfully`,
      });

      // Redirect back to cards list
      router.push('/admin/cards');
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: "Error",
        description: "Failed to add card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Button
                variant="ghost"
                className="mb-2"
                onClick={() => router.push('/admin/cards')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cards
              </Button>
              <CardTitle>Add New Card</CardTitle>
              <CardDescription>
                Add a new card to your inventory
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border bg-muted">
                  {formData.image_url ? (
                    <Image
                      src={formData.image_url}
                      alt="Card preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm">Image preview</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Quantity</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    How many copies of this card do you want to add?
                  </p>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                </div>
              </div>

              <div className="md:w-2/3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Card Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Pikachu"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handlePriceChange}
                      className="mt-1"
                      placeholder="9.99"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="set_name">Set Name</Label>
                    <Input
                      id="set_name"
                      name="set_name"
                      value={formData.set_name}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Base Set"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="card_number">Card Number</Label>
                    <Input
                      id="card_number"
                      name="card_number"
                      value={formData.card_number}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="25/102"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rarity">Rarity</Label>
                    <Input
                      id="rarity"
                      name="rarity"
                      value={formData.rarity}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Common"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleSelectChange('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Card description or flavor text"
                  />
                </div>

                <div>
                  <Label htmlFor="seller_notes">Seller Notes</Label>
                  <Textarea
                    id="seller_notes"
                    name="seller_notes"
                    value={formData.seller_notes || ''}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Additional notes about condition, etc."
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/cards')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Add {quantity > 1 ? `${quantity} Cards` : 'Card'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
