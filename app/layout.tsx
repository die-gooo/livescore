import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Livescore MVP',
  description: 'Livescore MVP con Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
