import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { HeaderActions } from '@/components/HeaderActions';

export const metadata: Metadata = {
  title: 'MamaArisan - Buku Arisan Ibu-Ibu Modern',
  description: 'Kelola grup arisan dengan mudah, adil, dan menyenangkan.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <AuthProvider>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary font-headline">MamaArisan</h1>
                <p className="text-muted-foreground hidden sm:block">Teman Setia Ibu Kelola Arisan</p>
              </div>
              <HeaderActions />
            </header>
            <main>{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
