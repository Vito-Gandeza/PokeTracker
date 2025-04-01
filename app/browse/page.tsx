import React from "react"
import Image from "next/image"
import Link from "next/link"
import PokemonBrowseGallery from "@/components/pokemon-browse-gallery"

export default function BrowseCards() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[400px] w-full overflow-hidden">
          <Image
            src="/images/browse_cover.png"
            alt="Pokemon cards collection"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold">BROWSE CARDS</h1>
        </div>
      </section>

      {/* Card Gallery */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <PokemonBrowseGallery />
        </div>
      </section>
    </div>
  )
} 