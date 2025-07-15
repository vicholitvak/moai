
"use client";

import { useState, useEffect } from "react";
import { ChefHat, Truck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DriverTrackingMapProps {
  initialETA: number; // Initial ETA in minutes
}

export function DriverTrackingMap({ initialETA }: DriverTrackingMapProps) {
  const totalSeconds = initialETA * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">Driver Tracking</h4>
        <div className="text-right">
          <p className="font-bold text-lg text-primary">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p className="text-xs text-muted-foreground">Estimated Arrival</p>
        </div>
      </div>
      <div className="relative w-full h-10 bg-border rounded-full overflow-hidden">
        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
          <ChefHat className="h-6 w-6 text-foreground" />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 ease-linear"
          style={{ left: `calc(${progress}% - 12px)` }}
        >
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
          </div>
        </div>
        <Progress value={progress} className="absolute top-1/2 -translate-y-1/2 h-2" />
      </div>
      <p className="text-sm text-center text-muted-foreground">
        Your driver is on the way! Please prepare the order for handoff.
      </p>
    </div>
  );
}
