import type { Metadata } from "next";
import "./globals.css";

const title = "m2rf - Mermaid to ReactFlow";
const description =
  "Render Mermaid diagrams as interactive ReactFlow graphs with embedded React components";

export const metadata: Metadata = {
  title,
  description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
