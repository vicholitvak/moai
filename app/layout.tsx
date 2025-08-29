import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { UserProfileProvider } from '../context/UserProfileContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthHandler from '../context/AuthHandler';
import { Toaster } from '../components/ui/sonner';
import NotificationInitializer from '../components/NotificationInitializer';
import FloatingChatButton from '../components/chat/FloatingChatButton';
import ChatNotificationHandler from '../components/ChatNotificationHandler';
import { ThemeScript } from './theme-script';
import { SupportButton } from '../components/support/SupportButton';
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <UserProfileProvider>
                <CartProvider>
                  <ServiceWorkerRegistration />
                  <NotificationInitializer />
                  <ChatNotificationHandler />
                  <AuthHandler>{children}</AuthHandler>
                  <FloatingChatButton />
                  <SupportButton />
                  <Toaster />
                </CartProvider>
              </UserProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}