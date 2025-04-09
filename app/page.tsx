"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import EnhancedCardCarousel from "@/components/enhanced-card-carousel"
import CardSetGrid from "@/components/card-set-grid"
import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronRight, Sparkles, Star, TrendingUp, Award, Clock, Grid } from "lucide-react"
import dynamic from "next/dynamic"

// Import client-side only components
const FloatingParticles = dynamic(
  () => import('@/components/animated-background').then(mod => mod.FloatingParticles),
  { ssr: false }
)

const AnimatedShapes = dynamic(
  () => import('@/components/animated-background').then(mod => mod.AnimatedShapes),
  { ssr: false }
)

// Import client-side only components with dynamic imports
let gsap: any;
let ScrollTrigger: any;

if (typeof window !== "undefined") {
  // Only import GSAP on the client side
  import("gsap").then((module) => {
    gsap = module.default;
    // Import ScrollTrigger
    import("gsap/ScrollTrigger").then((module) => {
      ScrollTrigger = module.ScrollTrigger;
      // Register the plugin
      gsap.registerPlugin(ScrollTrigger);
    });
  });
}

export default function Home() {
  const heroRef = useRef(null);
  const sectionRefs = useRef<HTMLElement[]>([]);
  const { scrollY } = useScroll();

  // Parallax effect for hero section
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Initialize GSAP animations
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Animate sections on scroll
    sectionRefs.current.forEach((section) => {
      if (!section) return;

      gsap.fromTo(
        section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Cleanup
    return () => {
      // Only run cleanup if ScrollTrigger is available
      if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger?.getAll) {
        ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
      }
    };
  }, []);
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="relative h-[85vh] overflow-hidden">
          {/* Background Image with Parallax Effect */}
          <div className="absolute inset-0">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute inset-0 bg-[url('/images/cover_page.png')] bg-cover bg-bottom"
            ></motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black from-30% via-black/90 via-40% to-transparent"></div>

            {/* Animated Overlay Elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.15, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-20 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.15, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute top-40 left-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl"
            ></motion.div>

            {/* Floating particles */}
            <FloatingParticles />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                 <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> COLLECTOR'S CORNER</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-white max-w-2xl">
                  Welcome to the premier destination for Pokémon card collectors. Discover rare finds and complete your collection today.
                </p>
                <div className="mt-8 mb-2 flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="default"
                      className="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                    >
                      Browse Collection <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      className="rounded-md bg-transparent border-white text-white hover:bg-white hover:text-black transition-colors"
                    >
                      Learn more
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Sets Section */}
        <section
          ref={(el: HTMLElement | null) => { if (el) sectionRefs.current[0] = el; }}
          className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 relative overflow-hidden"
        >
          {/* Background animated shapes */}
          <AnimatedShapes />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <Grid className="h-7 w-7 text-blue-500" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Latest Pokémon Sets</h2>
            </motion.div>
            <CardSetGrid />
          </div>
        </section>

        {/* Featured Cards Carousel Section */}
        <section
          ref={(el: HTMLElement | null) => { if (el) sectionRefs.current[1] = el; }}
          className="py-16 relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-950/30 dark:to-purple-950/30">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 dark:from-blue-900/20 dark:to-purple-900/20"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <EnhancedCardCarousel
              limit={20}
              title="Featured Pokémon Cards"
              subtitle="Explore our collection of rare and unique cards"
            />
          </div>
        </section>

        {/* Announcements Section */}
        <section
          ref={(el: HTMLElement | null) => { if (el) sectionRefs.current[2] = el; }}
          className="py-16 relative overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-50/20 dark:to-yellow-950/20">
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <Award className="h-7 w-7 text-yellow-500" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">Announcements</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Collection Card 1 */}
              <motion.div
                whileHover={{ y: -10, scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="overflow-hidden h-full border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/images/best_grade.png"
                      alt="Rare Collection"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-300">NEWS</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Rare & Holo Cards</h3>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      Discover our selection of the most sought-after Pokémon cards, including rare holos and limited editions.
                    </p>
                    <Button variant="outline" size="sm" className="w-full justify-between group">
                      Explore Collection
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Collection Card 2 */}
              <motion.div
                whileHover={{ y: -10, scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="overflow-hidden h-full border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/images/pre_alert.png"
                      alt="New Releases"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        NEW!
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">PRE-ORDER</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Stellar Crown</h3>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      Pre-order the latest Scarlet and Violet Stellar Crown set! Hunt for the prized hits of Teragagos, Starters and more!
                    </p>
                    <Button variant="outline" size="sm" className="w-full justify-between group">
                      Pre-order Now
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Collection Card 3 */}
              <motion.div
                whileHover={{ y: -10, scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="overflow-hidden h-full border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/images/week_bazaar.png"
                      alt="Trending Cards"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-medium text-green-300">EVENT</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Weekend Bazaar</h3>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      Our binders, stash, and slabs are all stocked up! Visit us at Festival Mall from March 22-23 and let's talk all about Pokémon collectibles!
                    </p>
                    <Button variant="outline" size="sm" className="w-full justify-between group">
                      Learn More
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-t border-b border-blue-100 dark:border-blue-900/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Stay Updated with New Releases</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our community of collectors and be the first to know about new card releases, special events, and exclusive offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg w-full sm:w-auto">
                    <Link href="/signup">Create Account</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 w-full sm:w-auto">
                    Subscribe to Newsletter
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

