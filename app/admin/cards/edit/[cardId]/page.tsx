'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface CardDetails {
  id: string;
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

interface GroupedCard {
  mainCard: CardDetails;
  variants: CardDetails[];
  stock: number;
}

export default function EditCardPage({ params }: { params: { cardId: string } }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupedCard, setGroupedCard] = useState<GroupedCard | null>(null);
  const [formData, setFormData] = useState<CardDetails | null>(null);
  const [conditions, setConditions] = useState<string[]>([
    'Mint', 'Near Mint', 'Excellent', 'Good', 'Played'
  ]);
  
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

  // Fetch card details
  useEffect(() => {
    async function fetchCardDetails() {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Fetch the main card
        const { data: mainCard, error: mainError } = await supabase
          .from('cards')
          .select('*')
          .eq('id', params.cardId)
          .single();

        if (mainError) {
          throw mainError;
        }

        if (!mainCard) {
          throw new Error('Card not found');
        }
        
        // Fetch all variants (cards with same name, set, number)
        const { data: variants, error: variantsError } = await supabase
          .from('cards')
          .select('*')
          .eq('name', mainCard.name)
          .eq('set_name', mainCard.set_name)
          .eq('card_number', mainCard.card_number);
          
        if (variantsError) {
          throw variantsError;
        }
        
        setGroupedCard({
          mainCard,
          variants: variants || [],
          stock: variants?.length || 0
        });
        
        setFormData(mainCard);
      } catch (error) {
        console.error('Error fetching card details:', error);
        toast({
          title: "Error",
          description: "Failed to load card details. Please try again.",
          variant: "destructive"
        });
        router.push('/admin/cards');
      } finally {
        setLoading(false);
      }
    }

    if (params.cardId) {
      fetchCardDetails();
    }
  }, [params.cardId, router, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle price change (ensure it's a valid number)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setFormData(prev => prev ? { ...prev, price: value } : null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      
      // Update the main card
      const { error } = await supabase
        .from('cards')
        .update({
          name: formData.name,
          set_name: formData.set_name,
          card_number: formData.card_number,
          rarity: formData.rarity,
          price: formData.price,
          condition: formData.condition,
          description: formData.description,
          seller_notes: formData.seller_notes
        })
        .eq('id', params.cardId);

      if (error) throw error;
      
      // Update all variants with common fields
      if (groupedCard?.variants && groupedCard.variants.length > 0) {
        const { error: variantsError } = await supabase
          .from('cards')
          .update({
            name: formData.name,
            set_name: formData.set_name,
            card_number: formData.card_number,
            rarity: formData.rarity,
            price: formData.price,
            description: formData.description,
          })
          .in('id', groupedCard.variants.map(v => v.id));
          
        if (variantsError) {
          console.error('Error updating variants:', variantsError);
        }
      }
      
      toast({
        title: "Success",
        description: "Card updated successfully",
      });
      
      // Redirect back to cards list
      router.push('/admin/cards');
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error",
        description: "Failed to update card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle card deletion
  const handleDeleteCard = async () => {
    if (!confirm('Are you sure you want to delete this card and all its variants? This action cannot be undone.')) return;
    
    try {
      const supabase = createClient();
      
      if (groupedCard?.variants && groupedCard.variants.length > 0) {
        // Delete all variants
        const { error: variantsError } = await supabase
          .from('cards')
          .delete()
          .in('id', groupedCard.variants.map(v => v.id));
          
        if (variantsError) {
          throw variantsError;
        }
      }
      
      toast({
        title: "Success",
        description: "Card and all variants deleted successfully",
      });
      
      // Redirect back to cards list
      router.push('/admin/cards');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle adding a variant
  const handleAddVariant = async () => {
    if (!formData) return;
    
    try {
      const supabase = createClient();
      
      // Create a new card with the same details
      const { error } = await supabase
        .from('cards')
        .insert({
          name: formData.name,
          set_name: formData.set_name,
          card_number: formData.card_number,
          rarity: formData.rarity,
          image_url: formData.image_url,
          price: formData.price,
          condition: formData.condition,
          description: formData.description,
          seller_notes: formData.seller_notes
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "New card variant added successfully",
      });
      
      // Refresh the page to show the new variant
      router.refresh();
    } catch (error) {
      console.error('Error adding variant:', error);
      toast({
        title: "Error",
        description: "Failed to add card variant. Please try again.",
        variant: "destructive"
      });
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
              <CardTitle>Edit Card</CardTitle>
              <CardDescription>
                Edit card details and manage variants
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleDeleteCard}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All Variants
              </Button>
              <Button 
                onClick={handleAddVariant}
                className="flex items-center gap-2"
              >
                Add Variant (+1 Stock)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading card details...</span>
            </div>
          ) : formData ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border">
                    {formData.image_url && (
                      <Image
                        src={formData.image_url}
                        alt={formData.name}
                        fill
                        className="object-contain"
                      />
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
                    />
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Stock Information</h3>
                    <p className="text-sm mb-2">
                      This card has <span className="font-bold">{groupedCard?.stock || 0}</span> variants in stock.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Each variant is a separate card with the same name, set, and number.
                      Use the "Add Variant" button to increase stock.
                    </p>
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
                    />
                  </div>
                </div>
              </div>
              
              {/* Variants List */}
              {groupedCard && groupedCard.variants.length > 1 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Card Variants ({groupedCard.variants.length})</h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                            ID
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Condition
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Seller Notes
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {groupedCard.variants.map((variant) => (
                          <tr key={variant.id} className={variant.id === params.cardId ? 'bg-blue-50' : ''}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                              {variant.id === params.cardId ? (
                                <span className="font-bold">{variant.id} (Current)</span>
                              ) : (
                                variant.id
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {variant.condition}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {variant.seller_notes || '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                              {variant.id !== params.cardId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/admin/cards/edit/${variant.id}`)}
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Card not found or failed to load.</p>
            </div>
          )}
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
            disabled={saving || !formData}
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
