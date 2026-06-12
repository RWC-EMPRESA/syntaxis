import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syntaxis | Captação de Leads",
  description: "Sistema inteligente de organização de vendas para o setor de energia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
