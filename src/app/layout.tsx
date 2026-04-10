import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DUDIA | Terminal Financeiro de Alta Precisão",
  description: "Engenharia de fluxo de caixa, projeções IA e dashboard de alta densidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${inter.className} min-h-full antialiased`}>
          <Providers>
            <ToastProvider>{children}</ToastProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}