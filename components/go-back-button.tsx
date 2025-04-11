'use client';

import { Button } from '@/components/ui/button';

interface GoBackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function GoBackButton({ className, children }: GoBackButtonProps) {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleGoBack}
      className={className}
    >
      {children || 'Go Back'}
    </Button>
  );
}
