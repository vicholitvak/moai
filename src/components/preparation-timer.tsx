
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PreparationTimerProps {
  prepTimeMinutes: number;
}

export function PreparationTimer({ prepTimeMinutes }: PreparationTimerProps) {
  const totalSeconds = prepTimeMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prevSeconds) => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = (remainingSeconds / totalSeconds) * 100;

  const isLowTime = remainingSeconds <= 60; // Less than or equal to 1 minute

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-muted-foreground">Time Remaining:</span>
        <span
          className={cn(
            "font-bold text-lg tracking-wider",
            isLowTime ? "text-destructive" : "text-foreground"
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <Progress value={progress} className={cn(isLowTime && "[&>div]:bg-destructive")} />
    </div>
  );
}
