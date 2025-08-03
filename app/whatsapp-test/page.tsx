import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teste WhatsApp Preview',
  description: 'Página de teste para WhatsApp preview',
  openGraph: {
    title: 'Teste WhatsApp Preview',
    description: 'Testando preview do WhatsApp',
    url: 'https://fareja.ai/whatsapp-test',
    siteName: 'Fareja',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://fareja.ai/api/whatsapp-image?url=https%3A%2F%2Fvia.placeholder.com%2F800x800%2FFF0000%2FFFFFFF%3Ftext%3DTeste%2BWhatsApp',
        width: 800,
        height: 800,
        alt: 'Teste WhatsApp',
        type: 'image/jpeg',
      }
    ],
  },
  other: {
    'og:image:width': '800',
    'og:image:height': '800',
    'og:image:type': 'image/jpeg',
  },
};

export default function WhatsAppTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Teste WhatsApp Preview</h1>
        <p className="mb-4">Esta é uma página de teste para verificar se o preview do WhatsApp está funcionando.</p>
        <div className="bg-red-500 text-white p-4 rounded-lg text-center font-bold">
          TESTE WHATSAPP
        </div>
        <p className="mt-4 text-sm text-gray-600">
          URL para testar: https://fareja.ai/whatsapp-test
        </p>
      </div>
    </div>
  );
}