'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Edit, Trash2, Filter, RefreshCw, Download, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface CardProduct {
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
  stock?: number;
}

interface GroupedCard extends CardProduct {
  stock: number;
  variants: CardProduct[];
}

export default function AdminCardsPage() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<GroupedCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GroupedCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sets, setSets] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [rarities, setRarities] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cardsPerPage = 20;

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

  // Fetch cards from Supabase
  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('cards')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          // Group cards by name, set, and card number
          const groupedCards: { [key: string]: GroupedCard } = {};

          data.forEach((card: CardProduct) => {
            const key = `${card.name}-${card.set_name}-${card.card_number}`;

            if (!groupedCards[key]) {
              groupedCards[key] = {
                ...card,
                stock: 1,
                variants: [card]
              };
            } else {
              groupedCards[key].stock += 1;
              groupedCards[key].variants.push(card);
            }
          });

          // Convert to array
          const cardsArray = Object.values(groupedCards);

          // Extract unique sets and rarities
          const uniqueSets = [...new Set(cardsArray.map(card => card.set_name))].sort();
          const uniqueRarities = [...new Set(cardsArray.map(card => card.rarity))].sort();

          setSets(uniqueSets);
          setRarities(uniqueRarities);
          setCards(cardsArray);
          setFilteredCards(cardsArray);
          setTotalPages(Math.ceil(cardsArray.length / cardsPerPage));
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
        toast({
          title: "Error",
          description: "Failed to load cards. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [toast]);

  // Filter and sort cards
  useEffect(() => {
    let result = [...cards];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(card =>
        card.name.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query) ||
        card.card_number.toLowerCase().includes(query)
      );
    }

    // Filter by set
    if (selectedSet !== 'all') {
      result = result.filter(card => card.set_name === selectedSet);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      result = result.filter(card => card.rarity === selectedRarity);
    }

    // Sort cards
    switch (sortOrder) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        result.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        result.sort((a, b) => b.stock - a.stock);
        break;
      default:
        break;
    }

    setFilteredCards(result);
    setTotalPages(Math.ceil(result.length / cardsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [cards, searchQuery, selectedSet, selectedRarity, sortOrder]);

  // Get current page of cards
  const getCurrentPageCards = () => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return filteredCards.slice(startIndex, endIndex);
  };

  // Handle card deletion
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      // Update the UI
      setCards(prevCards => {
        const updatedCards = prevCards.map(card => {
          if (card.variants.some(v => v.id === cardId)) {
            // Remove the variant
            const updatedVariants = card.variants.filter(v => v.id !== cardId);

            if (updatedVariants.length === 0) {
              // If no variants left, remove the card entirely
              return null;
            }

            return {
              ...card,
              stock: updatedVariants.length,
              variants: updatedVariants
            };
          }
          return card;
        }).filter(Boolean) as GroupedCard[];

        return updatedCards;
      });

      toast({
        title: "Success",
        description: "Card deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle card edit (redirect to edit page)
  const handleEditCard = (cardId: string) => {
    router.push(`/admin/cards/edit/${cardId}`);
  };

  // Handle adding a new card (redirect to add page)
  const handleAddCard = () => {
    router.push('/admin/cards/add');
  };

  // Handle importing cards from API (redirect to import page)
  const handleImportCards = () => {
    router.push('/admin/cards/import');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Card Management</CardTitle>
              <CardDescription>Manage your Pokémon card inventory</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddCard} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
              <Button onClick={handleImportCards} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Import from API
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-2">
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={selectedSet} onValueChange={setSelectedSet}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sets</SelectItem>
                    {sets.map((set) => (
                      <SelectItem key={set} value={set}>{set}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {rarities.map((rarity) => (
                      <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                    <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                    <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading cards...</span>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No cards found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {getCurrentPageCards().map((card) => (
                  <Card key={card.id} className="overflow-hidden">
                    <div className="flex h-full">
                      <div className="w-1/3 relative">
                        <Image
                          src={card.image_url}
                          alt={card.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="w-2/3 flex flex-col">
                        <CardHeader className="p-3 pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{card.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {card.set_name} · #{card.card_number}
                              </CardDescription>
                            </div>
                            <Badge variant={card.stock > 0 ? "default" : "destructive"} className="ml-2">
                              {card.stock} in stock
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-2 text-sm flex-grow">
                          <p><span className="font-semibold">Rarity:</span> {card.rarity}</p>
                          <p><span className="font-semibold">Price:</span> ${card.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {card.description || "No description available"}
                          </p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleEditCard(card.id)}
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredCards.length > 0 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(filteredCards.length, (currentPage - 1) * cardsPerPage + 1)} to {Math.min(currentPage * cardsPerPage, filteredCards.length)} of {filteredCards.length} cards
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}