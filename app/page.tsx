import Image from 'next/image';
import WatermarkWorkspace from './components/WatermarkWorkspace';
import logo from './assets/logo-getwatermarker.svg';

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Watermaker',
    url: 'https://get-watermaker.vercel.app',
    description:
      "Ferramenta online gratuita para adicionar marca d'água em lote com facilidade.",
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(203,254,1,0.25),_transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-10 pt-8">
        <nav className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <Image
              src={logo}
              alt="GetWaterMaker"
              className="h-8 w-auto"
              priority
            />
            <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              GetWaterMaker
            </div>
          </div>
        </nav>
        <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Watermarks em lote com controle total
          </h1>
          <p className="max-w-xl text-sm text-neutral-600">
            Carregue suas imagens, escolha uma logo e posicione cada watermark
            antes de gerar um ZIP final sem sair do navegador.
          </p>
        </header>

        <WatermarkWorkspace />

        <footer className="mt-auto border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          GetWaterMaker v1 · Tudo client-side · Suporte a PNG, JPG e WebP
        </footer>
      </div>
    </div>
  );
}
