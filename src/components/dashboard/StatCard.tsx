import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'info' | 'accent';
}

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    glow: 'shadow-[0_0_20px_hsl(142_76%_52%/0.15)]'
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    glow: 'shadow-[0_0_20px_hsl(142_76%_52%/0.15)]'
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    glow: 'shadow-[0_0_20px_hsl(45_93%_58%/0.15)]'
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    glow: 'shadow-[0_0_20px_hsl(217_91%_60%/0.15)]'
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    glow: 'shadow-[0_0_20px_hsl(45_93%_58%/0.15)]'
  },
};

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <Card className="premium-card border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6 relative">
        {/* Background glow effect */}
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl",
          colors.bg
        )} />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
            <p className="text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                "text-sm mt-3 font-medium flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                <span className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  trend.isPositive ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {trend.isPositive ? '↑' : '↓'}
                </span>
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            colors.bg,
            colors.text
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
