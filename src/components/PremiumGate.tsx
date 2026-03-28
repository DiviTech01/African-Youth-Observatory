import React, { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  /** Set to true to bypass the gate and render children directly. */
  isPremium?: boolean;
}

const PremiumGate = ({ children, feature, isPremium = false }: PremiumGateProps) => {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg backdrop-blur-sm bg-background/60">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-lg font-semibold">Upgrade to Premium</p>
        <p className="text-sm text-muted-foreground">
          Unlock <span className="font-medium text-foreground">{feature}</span>
        </p>
        <Button className="mt-1">Unlock</Button>
      </div>
    </div>
  );
};

export default PremiumGate;
