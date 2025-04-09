'use client';


import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface CardSet {
  id: string;
  name: string;
  image_url: string;
}

export default function CardSetGrid() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  const cardSets: CardSet[] = [
    {
      id: 'scarlet-violet-journey-together',
      name: 'Scarlet & Violet: Journey Together',
      image_url: '/images/sets/journey-together.jpg'
    },
    {
      id: 'scarlet-violet-surging-sparks',
      name: 'Scarlet & Violet: Surging Sparks',
      image_url: '/images/sets/surging-storm.jpg'
    },
    {
      id: 'scarlet-violet-prismatic-evolutions',
      name: 'Scarlet & Violet: Prismatic Evolutions',
      image_url: '/images/sets/prismatic-solutions.jpg'
    },
    {
      id: 'scarlet-violet-stellar-crown',
      name: 'Scarlet & Violet: Stellar Crown',
      image_url: '/images/sets/stellar-crown.jpg'
    },
    {
      id: 'scarlet-violet-twilight-masquerade',
      name: 'Scarlet & Violet: Twilight Masquerade',
      image_url: '/images/sets/twilight-masquerade.jpg'
    },
    {
      id: 'scarlet-violet-temporal-forces',
      name: 'Scarlet & Violet: Temporal Forces',
      image_url: '/images/sets/temporal-forces.jpg'
    }
  ];

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {cardSets.map((set, index) => (
        <motion.div
          key={set.id}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -10 }}
          className="group relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700"
        >
          <Tilt
            className="h-full"
            tiltMaxAngleX={5}
            tiltMaxAngleY={5}
            perspective={1000}
            transitionSpeed={1500}
            scale={1.02}
            gyroscope={true}
          >
          <div className="relative h-52 w-full overflow-hidden">
            <Image
              src={set.image_url}
              alt={set.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              style={{ animationDelay: `${index * 100}ms` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-80 group-hover:opacity-70 transition-opacity"></div>
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white transform transition-transform duration-300 group-hover:translate-y-[-5px]">
            <h3 className="text-xl font-bold mb-4 group-hover:text-blue-300 transition-colors">{set.name}</h3>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full text-xs py-1 px-4 shadow-lg transform transition-transform group-hover:translate-x-1"
            >
              <Link href={`/shop/all-cards?set=${set.id}`}>Browse Cards</Link>
            </Button>
          </div>
          </Tilt>
        </motion.div>
      ))}
    </motion.div>
  );
}
