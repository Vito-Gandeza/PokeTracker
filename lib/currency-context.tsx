'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define currency types
export type CurrencyCode = 'PHP' | 'USD' | 'EUR';

// Define conversion rates (as of April 2024)
// These would ideally come from an API in a production app
const CONVERSION_RATES: Record<CurrencyCode, number> = {
  PHP: 1, // Base currency (Philippine Peso)
  USD: 0.018, // 1 PHP = 0.018 USD
  EUR: 0.016, // 1 PHP = 0.016 EUR
};

// Define currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (priceInUSD: number) => string;
  convertPrice: (priceInUSD: number) => number;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>('PHP');

  // Convert USD price to selected currency
  const convertPrice = (priceInUSD: number): number => {
    if (currency === 'USD') return priceInUSD;
    
    // Convert USD to PHP first (1 USD = 55.56 PHP approximately)
    const priceInPHP = priceInUSD * 55.56;
    
    // Then convert PHP to target currency if needed
    if (currency === 'PHP') return priceInPHP;
    
    // For EUR
    return priceInPHP * CONVERSION_RATES.EUR;
  };

  // Format price with currency symbol and proper decimal places
  const formatPrice = (priceInUSD: number): string => {
    const convertedPrice = convertPrice(priceInUSD);
    
    return `${CURRENCY_SYMBOLS[currency]}${convertedPrice.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        currencySymbol: CURRENCY_SYMBOLS[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
