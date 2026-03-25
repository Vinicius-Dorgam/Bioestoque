import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300", className)}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}