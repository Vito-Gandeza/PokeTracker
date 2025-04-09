'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function FloatingParticles() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => {
        // Generate deterministic values based on index
        const top = `${(i * 5) % 100}%`;
        const left = `${(i * 7) % 100}%`;
        const scale = 0.5 + (i % 10) / 10;
        const yMove = -50 - (i * 3) % 100;
        const xMove = ((i % 2 === 0 ? 1 : -1) * (i * 4)) % 100;
        const duration = 10 + (i % 10);
        const delay = i % 5;
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              top,
              left,
              scale
            }}
            animate={{
              y: [0, yMove],
              x: [0, xMove],
              opacity: [0, 0.7, 0]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay
            }}
          />
        );
      })}
    </div>
  );
}

export function AnimatedShapes() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
      {[...Array(5)].map((_, i) => {
        // Generate deterministic values based on index
        const width = 100 + (i * 50);
        const height = 100 + (i * 50);
        const top = `${(i * 20) % 100}%`;
        const left = `${(i * 25) % 100}%`;
        const xMove = ((i % 2 === 0 ? 1 : -1) * 50);
        const yMove = ((i % 2 === 0 ? -1 : 1) * 50);
        const duration = 10 + (i * 5);
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500 dark:bg-blue-400"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              top,
              left,
              filter: 'blur(70px)'
            }}
            animate={{
              x: [0, xMove],
              y: [0, yMove],
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          />
        );
      })}
    </div>
  );
}
