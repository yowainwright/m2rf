import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'm2rf Studio',
  description: 'CRUD Mermaid input into React Flow graph output.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
