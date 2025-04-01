"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card as CardUI } from "@/components/ui/card"
import * as PokemonTCG from "pokemon-tcg-sdk-typescript"

// API key configuration (in production, use environment variables)
const API_KEY = "d2cf1828-877c-4f8d-947c-7377dfb810be"

// Filter types
type FilterOption = {
  label: string
  value: string
  checked: boolean
}

// Sorting options
type SortOption = "new" | "price-ascending" | "price-descending" | "rating"

// Helper type for card pricing
interface CardPrice {
  low?: number
  mid?: number
  high?: number
  market?: number
  directLow?: number
}

// API Environment variable
if (typeof window === 'undefined') {
  process.env.POKEMONTCG_API_KEY = API_KEY
}

export default function PokemonBrowseGallery() {
  // States
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSort, setActiveSort] = useState<SortOption>("new")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [sets, setSets] = useState<FilterOption[]>([])
  const [selectedTypes, setSelectedTypes] = useState<FilterOption[]>([
    { label: "Pokemon", value: "pokemon", checked: true },
    { label: "Packs", value: "packs", checked: false },
    { label: "Sets", value: "sets", checked: false },
  ])
  const [selectedCollections, setSelectedCollections] = useState<FilterOption[]>([
    { label: "151 Collection", value: "151", checked: false },
    { label: "Prismatic Evolutions", value: "prismatic-evolutions", checked: false },
  ])
  const [selectedFeatures, setSelectedFeatures] = useState<FilterOption[]>([
    { label: "Label", value: "label", checked: false },
    { label: "Comic", value: "comic", checked: false },
    { label: "Original Illustration", value: "original-illustration", checked: false },
    { label: "Multicolor", value: "multicolor", checked: false },
    { label: "Box Set", value: "box-set", checked: false },
    { label: "Donruss", value: "donruss", checked: false },
    { label: "Prizm", value: "prizm", checked: false },
  ])

  // Function to fetch sets from the API
  const fetchSets = async () => {
    try {
      const response = await fetch('https://api.pokemontcg.io/v2/sets', {
        headers: {
          'X-Api-Key': API_KEY
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sets: ${response.status}`)
      }
      
      const data = await response.json()
      
      return data.data.map((set: any) => ({
        label: set.name,
        value: set.id,
        checked: false
      }))
    } catch (err) {
      console.error("Error fetching sets:", err)
      throw err
    }
  }

  // Function to fetch cards from the API
  const fetchCards = async (params: Record<string, any>) => {
    try {
      const queryParams = new URLSearchParams()
      
      // Add all params to query string
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value))
      })
      
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?${queryParams.toString()}`, {
        headers: {
          'X-Api-Key': API_KEY
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data
    } catch (err) {
      console.error("Error fetching cards:", err)
      throw err
    }
  }

  // Fetch cards and sets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch sets if we don't have them yet
        if (sets.length === 0) {
          const fetchedSets = await fetchSets()
          setSets(fetchedSets)
        }
        
        // Build query parameters
        let queryString = ""
        let params: Record<string, any> = {
          pageSize: 20 // Reduced for faster loading
        }
                
        // Add search query if present
        if (searchQuery) {
          queryString += `name:"${searchQuery}*"`
        }

        // Get selected sets
        const selectedSetIds = sets.filter(set => set.checked).map(set => set.value)
        if (selectedSetIds.length > 0) {
          const setQuery = `set.id:(${selectedSetIds.join(' OR ')})`
          queryString = queryString ? `${queryString} ${setQuery}` : setQuery
        }

        // Handle collections like "151 Collection"
        const selected151 = selectedCollections.find(c => c.value === "151")?.checked
        if (selected151) {
          const collectionQuery = 'set.name:151'
          queryString = queryString ? `${queryString} ${collectionQuery}` : collectionQuery
        }
        
        // Handle Prismatic Evolutions
        const selectedPrismatic = selectedCollections.find(c => c.value === "prismatic-evolutions")?.checked
        if (selectedPrismatic) {
          const prismaticQuery = 'set.name:"Prismatic Evolutions"'
          queryString = queryString ? `${queryString} ${prismaticQuery}` : prismaticQuery
        }

        if (queryString) {
          params.q = queryString
        }

        // Fetch the cards with our params
        const fetchedCards = await fetchCards(params)
        setCards(fetchedCards)
        setLoading(false)
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(`Failed to load Pokemon cards: ${err.message}`)
        setLoading(false)
      }
    }

    loadData()
  }, [searchQuery, selectedCollections, sets])

  // Filter cards based on price range
  const filteredCards = cards.filter(card => {
    // Check if card has price data
    let hasPrice = false
    let price = 0
    
    if (card.tcgplayer && card.tcgplayer.prices) {
      // Get the lowest price from normal, holofoil, reverseHolofoil, etc.
      const prices = Object.values(card.tcgplayer.prices) as CardPrice[]
      if (prices.length > 0) {
        price = Math.min(...prices.map(p => p.market || p.mid || p.low || 0).filter(p => p > 0))
        hasPrice = price > 0
      }
    } else if (card.cardmarket && card.cardmarket.prices) {
      price = card.cardmarket.prices.averageSellPrice || 
              card.cardmarket.prices.trendPrice || 
              0
      hasPrice = price > 0
    }
    
    return !hasPrice || (price >= priceRange[0] && price <= priceRange[1])
  })

  // Sort cards based on the active sort
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (activeSort === "new") {
      return 0 // Assume API already returns by newest
    }
    
    // Get prices for comparison
    const getPriceForCard = (card: any): number => {
      if (card.tcgplayer && card.tcgplayer.prices) {
        const prices = Object.values(card.tcgplayer.prices) as CardPrice[]
        if (prices.length > 0) {
          return Math.min(...prices.map(p => p.market || p.mid || p.low || 0).filter(p => p > 0)) || 0
        }
      } else if (card.cardmarket && card.cardmarket.prices) {
        return card.cardmarket.prices.averageSellPrice || 
               card.cardmarket.prices.trendPrice || 
               0
      }
      return 0
    }
    
    const priceA = getPriceForCard(a)
    const priceB = getPriceForCard(b)
    
    if (activeSort === "price-ascending") {
      return priceA - priceB
    } else if (activeSort === "price-descending") {
      return priceB - priceA
    }
    
    return 0 // Default case
  })

  // Toggle filter function
  const toggleFilter = <T extends FilterOption>(
    filters: T[],
    value: string,
    setFilters: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setFilters(
      filters.map(filter =>
        filter.value === value ? { ...filter, checked: !filter.checked } : filter
      )
    )
  }

  // Handle price range change
  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = parseInt(e.target.value) || 0
    setPriceRange(prev => {
      const newRange = [...prev] as [number, number]
      newRange[index] = newValue
      return newRange
    })
  }

  // Get card price for display
  const getCardPrice = (card: any): string => {
    if (card.tcgplayer && card.tcgplayer.prices) {
      const prices = Object.values(card.tcgplayer.prices) as CardPrice[]
      if (prices.length > 0) {
        const price = Math.min(...prices.map(p => p.market || p.mid || p.low || 0).filter(p => p > 0))
        return price > 0 ? `$${price.toFixed(2)}` : "$0"
      }
    } else if (card.cardmarket && card.cardmarket.prices) {
      const price = card.cardmarket.prices.averageSellPrice || 
                    card.cardmarket.prices.trendPrice || 
                    0
      return price > 0 ? `${price.toFixed(2)} €` : "€0"
    }
    return "$0"
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setPriceRange([0, 100000])
    setSelectedTypes(selectedTypes.map(type => ({ ...type, checked: type.value === "pokemon" })))
    setSelectedCollections(selectedCollections.map(coll => ({ ...coll, checked: false })))
    setSelectedFeatures(selectedFeatures.map(feat => ({ ...feat, checked: false })))
    setSets(sets.map(set => ({ ...set, checked: false })))
  }

  // Default cards if no search criteria
  useEffect(() => {
    // Only load default cards if no other search is active
    if (!loading && cards.length === 0 && !error && !searchQuery && 
        !sets.some(set => set.checked) && 
        !selectedCollections.some(coll => coll.checked)) {
      const loadDefaultCards = async () => {
        try {
          setLoading(true)
          // Get some recent cards from Scarlet & Violet series
          const defaultCards = await fetchCards({ 
            q: 'set.series:"Scarlet & Violet"', 
            orderBy: "-releaseDate", 
            pageSize: 20 
          })
          setCards(defaultCards)
          setLoading(false)
        } catch (err: any) {
          console.error("Error loading default cards:", err)
          setError(`Failed to load default Pokemon cards: ${err.message}`)
          setLoading(false)
        }
      }
      
      loadDefaultCards()
    }
  }, [loading, cards.length, error, searchQuery, sets, selectedCollections])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters Sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Keywords</h2>
          <div className="mb-2">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTypes.map((type) => (
              <div
                key={type.value}
                className={`px-2 py-1 border rounded cursor-pointer ${
                  type.checked ? "bg-black text-white" : "bg-white text-black"
                }`}
                onClick={() => toggleFilter(selectedTypes, type.value, setSelectedTypes)}
              >
                {type.label} {type.checked && "×"}
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Collections</h2>
          {selectedCollections.map((collection) => (
            <div key={collection.value} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={collection.value}
                checked={collection.checked}
                onChange={() => toggleFilter(selectedCollections, collection.value, setSelectedCollections)}
                className="mr-2"
              />
              <label htmlFor={collection.value}>{collection.label}</label>
            </div>
          ))}
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Price Range</h2>
          <div className="flex items-center gap-2 mb-2">
            <Input
              type="number"
              min="0"
              value={priceRange[0]}
              onChange={(e) => handlePriceRangeChange(e, 0)}
              className="w-24"
            />
            <span>-</span>
            <Input
              type="number"
              min="0"
              value={priceRange[1]}
              onChange={(e) => handlePriceRangeChange(e, 1)}
              className="w-24"
            />
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            value={priceRange[1]}
            onChange={(e) => handlePriceRangeChange(e, 1)}
            className="w-full"
          />
        </div>

        {/* Card Features */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Features</h2>
          {selectedFeatures.map((feature) => (
            <div key={feature.value} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={feature.value}
                checked={feature.checked}
                onChange={() => toggleFilter(selectedFeatures, feature.value, setSelectedFeatures)}
                className="mr-2"
              />
              <label htmlFor={feature.value}>{feature.label}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {["new", "price-ascending", "price-descending"].map((sort) => (
            <Button
              key={sort}
              variant={activeSort === sort ? "default" : "outline"}
              onClick={() => setActiveSort(sort as SortOption)}
              className={activeSort === sort ? "bg-black text-white" : ""}
            >
              {sort === "new" ? "New" : 
               sort === "price-ascending" ? "Price ascending" : 
               "Price descending"}
            </Button>
          ))}
        </div>

        {/* Card Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2">Loading cards...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            <p>{error}</p>
            <Button onClick={resetFilters} className="mt-4">
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedCards.map((card) => (
              <CardUI key={card.id} className="overflow-hidden">
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={card.images?.small || card.images?.large || '/placeholder.svg'}
                    alt={card.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{card.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{card.set.name}</p>
                  <p className="mt-2 font-semibold">{getCardPrice(card)}</p>
                </div>
              </CardUI>
            ))}
            
            {sortedCards.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p>No cards found matching your filters.</p>
                <Button onClick={resetFilters} className="mt-4">
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 