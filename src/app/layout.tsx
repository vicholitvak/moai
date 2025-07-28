import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { MainNav } from '@/components/main-nav';
import { Icons } from '@/components/icons';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Moai',
  description: 'Home-cooked meals, delivered to your door.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background')}>
        <AuthProvider>
          <SidebarProvider>
            <Sidebar>
              <div className="flex flex-col h-full">
                <div className="p-4 flex items-center gap-3">
                  <Icons.logo className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-headline text-foreground">Moai</h1>
                </div>
                <MainNav />
              </div>
            </Sidebar>
            <SidebarInset>
              <Header />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
