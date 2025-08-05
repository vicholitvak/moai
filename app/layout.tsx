import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { UserProfileProvider } from '../context/UserProfileContext';
import AuthHandler from '../context/AuthHandler';
import { Toaster } from '../components/ui/sonner';
import NotificationInitializer from '../components/NotificationInitializer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LicanÑam",
  description: "Descubre deliciosa comida casera de cocineros locales",
  icons: {
    icon: '/llama-icon.jpg',
    apple: '/llama-icon.jpg',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FF6600',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <UserProfileProvider>
            <CartProvider>
              <NotificationInitializer />
              <AuthHandler>{children}</AuthHandler>
              <Toaster />
            </CartProvider>
          </UserProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}