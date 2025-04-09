import React from "react";
import Link from "next/link";
import FeaturedCardBanner from "@/components/featured-card-banner";
import CardSetGrid from "@/components/card-set-grid";
import SwiperCardCarousel from "@/components/swiper-card-carousel";
import { Button } from "@/components/ui/button";

export default function Shop() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Featured Banner */}
      <section className="container mx-auto px-4 pt-8">
        <FeaturedCardBanner
          title="Scarlet & Violet: Destined Rivals"
          subtitle="Unleash Power & Prestige"
          imageUrl="/images/sets/destined-rivals.jpg"
        />
      </section>

      {/* Card Sets Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Sets</h2>
        </div>
        <CardSetGrid />
      </section>

      {/* Featured Cards Carousel */}
      <section className="container mx-auto px-4 py-12 my-8 overflow-hidden">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl -z-10"></div>
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm rounded-3xl -z-10"></div>

          {/* Content */}
          <div className="px-6 py-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Featured Rare Cards</h2>
                <p className="text-muted-foreground mt-1">Exclusive collection of rare and holo cards</p>
              </div>
              <Link href="/shop/all-cards">
                <Button variant="outline" className="border-blue-400 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">View All Cards</Button>
              </Link>
            </div>

            <SwiperCardCarousel limit={16} />
          </div>
        </div>
      </section>
    </div>
  );
}
