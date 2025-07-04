'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    price_from: '',
    storeName: '',
    affiliateLink: '',
    coupon: '',
    apiKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${formData.apiKey}`
        },
        body: JSON.stringify({
          title: formData.title,
          price: formData.price,
          price_from: formData.price_from || undefined,
          storeName: formData.storeName,
          affiliateLink: formData.affiliateLink,
          coupon: formData.coupon || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Promoção adicionada com sucesso!\n🔗 Link do site: ${result.siteLink}`);
        setFormData({
          title: '',
          price: '',
          price_from: '',
          storeName: '',
          affiliateLink: '',
          coupon: '',
          apiKey: formData.apiKey // Manter a chave API
        });
      } else {
        const error = await response.json();
        setMessage(`Erro: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Erro de conexão: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Adicionar Promoção</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave da API
              </label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Sua chave secreta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do Produto *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço com Desconto *
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="R$ 99,99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Original (opcional)
              </label>
              <input
                type="text"
                name="price_from"
                value={formData.price_from}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="R$ 149,99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja *
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Amazon, Americanas, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link de Afiliado *
              </label>
              <input
                type="url"
                name="affiliateLink"
                value={formData.affiliateLink}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://amzn.to/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cupom (opcional)
              </label>
              <input
                type="text"
                name="coupon"
                value={formData.coupon}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="DESCONTO10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500'
              }`}
            >
              {loading ? 'Adicionando...' : 'Adicionar Promoção'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('sucesso') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{message}</pre>
              {message.includes('🔗 Link do site:') && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      const link = message.split('🔗 Link do site: ')[1];
                      navigator.clipboard.writeText(link);
                      alert('Link copiado para a área de transferência!');
                    }}
                    className="text-sm bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    📋 Copiar Link
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-orange-500 hover:text-orange-600 text-sm"
            >
              ← Voltar para o site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}