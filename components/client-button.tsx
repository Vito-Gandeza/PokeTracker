'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ClientButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function ClientButton({ onClick, className, children, variant = 'outline' }: ClientButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={className || "flex items-center gap-2"}
    >
      <RefreshCw className="h-4 w-4" />
      {children || 'Try Again'}
    </Button>
  );
}
