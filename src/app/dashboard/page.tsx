"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "lucide-react";

export default function DashboardRedirectPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Still loading, do nothing yet
      return;
    }

    if (!user) {
      // Not logged in, redirect to the login page
      router.replace("/login");
      return;
    }

    if (userProfile) {
      // User and profile are loaded, redirect based on role
      switch (userProfile.role) {
        case 'cooker':
          router.replace('/cooks/orders');
          break;
        case 'client':
          // For clients, redirect to the homepage to find food
          router.replace('/');
          break;
        case 'delivery':
          // Placeholder for a future delivery dashboard
          router.replace('/');
          break;
        default:
          // Fallback for any other case
          router.replace('/');
      }
    }
    // If user exists but profile is still loading, the loader will show.
    // This effect will re-run once userProfile is available.
  }, [user, userProfile, loading, router]);

  // Show a loading spinner while we determine where to redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="h-8 w-8 animate-spin" />
      <p className="ml-4 text-muted-foreground">Cargando...</p>
    </div>
  );
}