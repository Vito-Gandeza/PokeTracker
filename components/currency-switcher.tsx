'use client';

import React from 'react';
import { useCurrency, type CurrencyCode, CURRENCY_SYMBOLS } from '@/lib/currency-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DollarSign } from 'lucide-react';

export function CurrencySwitcher() {
  const { currency, setCurrency, currencySymbol } = useCurrency();

  const currencies: { code: CurrencyCode; label: string }[] = [
    { code: 'PHP', label: 'Philippine Peso (₱)' },
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2 border-gray-200 dark:border-gray-800">
          <DollarSign className="h-3.5 w-3.5" />
          <span>{currencySymbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={currency === curr.code ? 'bg-gray-100 dark:bg-gray-800' : ''}
          >
            <span className="mr-2">{CURRENCY_SYMBOLS[curr.code]}</span>
            {curr.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
