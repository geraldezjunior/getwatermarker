import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://getwatermarker.getsmaker.com'), // TODO: Substituir pelo seu domínio oficial
  title: {
    default: "Watermaker | Adicionar Marca D'água em Lote Grátis",
    template: '%s | Watermaker',
  },
  description:
    "Ferramenta online gratuita para adicionar sua logomarca como marca d'água em várias imagens simultaneamente. Simples, rápido e não requer cadastro.",
  keywords: [
    "marca d'água online",
    'adicionar logo em imagem',
    "colocar marca d'agua em lote",
    'proteger fotos online',
    'watermark',
    'aplicar logomarca em lote',
  ],
  authors: [{ name: 'Watermaker' }],
  openGraph: {
    title: "Watermaker | Adicione Marca D'água em Lote Rapidamente",
    description:
      'Proteja suas fotos e aplique sua logo em múltiplas fomatando simultaneamente com o Watermaker.',
    url: '/',
    siteName: 'Watermaker',
    images: [
      {
        url: '/og.png.png', // Imagem fornecida pelo usuário
        width: 1200,
        height: 630,
        alt: 'Watermaker Banner de Compartilhamento',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Watermaker | Adicionar Marca D'água em Lote",
    description:
      'Aplique sua logo em várias fotos ao mesmo tempo. Ferramenta grátis e direto ao ponto.',
    images: ['/og.png.png'],
  },
  icons: {
    icon: '/icon-512.png',
    shortcut: '/icon-512.png',
    apple: '/icon-180.png',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
