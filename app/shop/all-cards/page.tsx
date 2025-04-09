'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import OrganizedCardCollection from "@/components/organized-card-collection";

export default function AllCards() {
  const [activeTab, setActiveTab] = useState('sets');
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[250px] w-full overflow-hidden">
          <Image
            src="/images/browse_cover.png"
            alt="Pokemon Card Collection"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Pokémon Cards</h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">Discover our extensive collection of rare and unique cards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8 -mt-24 relative z-10">
        <Card className="p-6 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl border-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <Tabs
            defaultValue="sets"
            className="w-full"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {activeTab === 'sets' ? 'Browse By Set' : 'All Cards'}
                </h2>
                <p className="text-muted-foreground">Find the perfect cards to add to your collection</p>
              </div>
              <TabsList className="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <TabsTrigger value="sets" className="rounded-md px-4 py-2">By Set</TabsTrigger>
                <TabsTrigger value="all" className="rounded-md px-4 py-2">All Cards</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sets" className="mt-0">
              <OrganizedCardCollection
                key="by-set-view"
                showSearch={true}
                showFilters={true}
                groupBySet={true}
                initialLimit={1000}
              />
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <OrganizedCardCollection
                key="all-cards-view"
                showSearch={true}
                showFilters={true}
                groupBySet={false}
                initialLimit={50}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </section>
    </div>
  );
}
