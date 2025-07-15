"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="font-headline text-4xl text-destructive">
          Oops! Something went wrong.
        </h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. We're sorry for the inconvenience.
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </main>
  );
}
