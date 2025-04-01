import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-slate-800 text-white">
          <div className="absolute inset-0 bg-[url('/images/cover_page.png')] bg-cover bg-center opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="container relative mx-auto px-4 py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 relative">
                  <svg viewBox="0 0 100 100" className="fill-white">
                    <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0z" />
                    <path d="M35 30L65 50L35 70V30z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">COLLECTOR'S CORNER</h1>
              <p className="mt-4 text-lg">
                Welcome to Collector's Corner! Here to provide you the best collectible products at the best prices.
              </p>
              <div className="mt-8">
                <Button
                  variant="outline"
                  className="rounded-md border-white text-white hover:bg-white hover:text-slate-800"
                >
                  Learn more &gt;
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What's New Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">WHAT'S NEW!</h2>

            <div className="space-y-6">
              {/* Card 1 */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Image
                        src="/images/best_grade.png"
                        alt="Best Cards to Grade"
                        width={150}
                        height={150}
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">BEST CARDS TO GRADE!</h3>
                      <p className="text-muted-foreground mb-4">
                        Don't know which card to grade and enhance your prized collection? Collector's Corner recommends
                        these 3 cards from the Sword and Shield era...
                      </p>
                      <Button variant="outline" size="sm">
                        Learn more &gt;
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 relative">
                      <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        NEW!
                      </div>
                      <Image
                        src="/images/pre_alert.png"
                        alt="Pre-order Alert"
                        width={150}
                        height={150}
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">PRE-ORDER ALERT!</h3>
                      <p className="text-muted-foreground mb-4">
                        Collector's Corner's is now offering pre-order for Scarlet and Violet Stellar Crown! Hunt for
                        the prized hits of Teragagos, Starters and more!
                      </p>
                      <Button variant="outline" size="sm">
                        Learn more &gt;
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Image
                        src="/images/week_bazaar.png"
                        alt="Weekend Bazaar"
                        width={150}
                        height={150}
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">WEEKEND BAZAAR!</h3>
                      <p className="text-muted-foreground mb-4">
                        Our binders, stash, and slabs are all stocked up to give you trainers the best possible Pokemon
                        pieces! See you trainers at Festival Mall from March 22-23 and let's talk all about Pokemon and
                        collectibles!
                      </p>
                      <Button variant="outline" size="sm">
                        Learn more &gt;
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Sign up for more updates!</h2>
              <div className="flex gap-2">
                <Button asChild variant="default" className="bg-black text-white hover:bg-gray-800">
                  <Link href="/signup">Sign up</Link>
                </Button>
                <Button variant="outline">Subscribe</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

