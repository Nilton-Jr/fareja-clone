'use client';

import { useState, useEffect } from 'react';

interface Promotion {
  id: string;
  title: string;
  price: string;
  price_from?: string;
  storeName: string;
  affiliateLink: string;
  coupon?: string;
  shortId: string;
  createdAt: string;
}

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
  const [errorLog, setErrorLog] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [dateDeleteForm, setDateDeleteForm] = useState({
    startDay: '',
    endDay: '',
    month: '',
    year: new Date().getFullYear().toString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorLog('');

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
        
        // Log detalhado do erro
        const logDetails = {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          timestamp: new Date().toISOString(),
          requestData: {
            title: formData.title,
            price: formData.price,
            price_from: formData.price_from,
            storeName: formData.storeName,
            affiliateLink: formData.affiliateLink,
            coupon: formData.coupon
          },
          responseError: error
        };
        setErrorLog(JSON.stringify(logDetails, null, 2));
      }
    } catch (error) {
      setMessage(`Erro de conexão: ${error}`);
      
      // Log detalhado do erro de conexão
      const logDetails = {
        type: 'CONNECTION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        requestData: {
          title: formData.title,
          price: formData.price,
          price_from: formData.price_from,
          storeName: formData.storeName,
          affiliateLink: formData.affiliateLink,
          coupon: formData.coupon
        }
      };
      setErrorLog(JSON.stringify(logDetails, null, 2));
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

  const fetchPromotions = async () => {
    if (!formData.apiKey) return;
    
    setLoadingList(true);
    try {
      const response = await fetch('/api/promotions', {
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      } else {
        setMessage('Erro ao carregar promoções. Verifique sua chave API.');
      }
    } catch (error) {
      setMessage('Erro de conexão ao carregar promoções.');
    } finally {
      setLoadingList(false);
    }
  };

  const deletePromotion = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/promotions?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`
        }
      });

      if (response.ok) {
        setMessage('✅ Promoção deletada com sucesso!');
        fetchPromotions(); // Reload the list
      } else {
        const error = await response.json();
        setMessage(`Erro ao deletar: ${error.error}`);
      }
    } catch (error) {
      setMessage('Erro de conexão ao deletar promoção.');
    }
  };

  const deleteAllPromotions = async () => {
    if (!confirm('⚠️ ATENÇÃO: Tem certeza que deseja deletar TODAS as promoções? Esta ação não pode ser desfeita!')) {
      return;
    }

    if (!confirm('Esta é sua última chance! Confirma que deseja deletar TODAS as promoções?')) {
      return;
    }

    setLoadingList(true);
    try {
      const response = await fetch('/api/promotions?deleteAll=true', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Todas as promoções foram deletadas! Total: ${result.deletedCount}`);
        setPromotions([]);
      } else {
        const error = await response.json();
        setMessage(`Erro ao deletar todas as promoções: ${error.error}`);
      }
    } catch (error) {
      setMessage('Erro de conexão ao deletar todas as promoções.');
    } finally {
      setLoadingList(false);
    }
  };

  const deletePromotionsByDate = async () => {
    const { startDay, endDay, month, year } = dateDeleteForm;
    
    if (!startDay || !endDay || !month) {
      setMessage('❌ Por favor, preencha todos os campos de data.');
      return;
    }

    const startDayNum = parseInt(startDay);
    const endDayNum = parseInt(endDay);
    const monthNum = parseInt(month);

    if (startDayNum < 1 || startDayNum > 31 || endDayNum < 1 || endDayNum > 31) {
      setMessage('❌ Dias devem estar entre 1 e 31.');
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      setMessage('❌ Mês deve estar entre 1 e 12.');
      return;
    }

    if (startDayNum > endDayNum) {
      setMessage('❌ O dia inicial não pode ser maior que o dia final.');
      return;
    }

    const dateRange = `${startDay}/${month}/${year} até ${endDay}/${month}/${year}`;
    
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja deletar todas as promoções do período ${dateRange}? Esta ação não pode ser desfeita!`)) {
      return;
    }

    setLoadingList(true);
    try {
      const params = new URLSearchParams({
        startDay,
        endDay,
        month,
        year
      });

      const response = await fetch(`/api/promotions?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Promoções deletadas com sucesso! Período: ${result.dateRange}, Total: ${result.deletedCount}`);
        fetchPromotions(); // Reload the list
      } else {
        const error = await response.json();
        setMessage(`Erro ao deletar promoções por data: ${error.error}`);
      }
    } catch (error) {
      setMessage('Erro de conexão ao deletar promoções por data.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleDateDeleteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDateDeleteForm({
      ...dateDeleteForm,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    if (activeTab === 'list' && formData.apiKey) {
      fetchPromotions();
    }
  }, [activeTab, formData.apiKey]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Painel Admin</h1>
          
          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'add'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Adicionar Promoção
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'list'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Gerenciar Promoções
            </button>
          </div>
          
          {/* Add Promotion Tab */}
          {activeTab === 'add' && (
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
          )}
          
          {/* List Promotions Tab */}
          {activeTab === 'list' && (
            <div>
              {!formData.apiKey ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Por favor, insira sua chave API na aba "Adicionar Promoção" primeiro.</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Promoções Cadastradas</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={fetchPromotions}
                        disabled={loadingList}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        {loadingList ? 'Carregando...' : '🔄 Atualizar'}
                      </button>
                      <button
                        onClick={deleteAllPromotions}
                        disabled={loadingList || promotions.length === 0}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                      >
                        🗑️ Deletar Tudo
                      </button>
                    </div>
                  </div>
                  
                  {/* Date Range Delete Section */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">🗓️ Deletar por Período</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Dia Inicial
                        </label>
                        <input
                          type="number"
                          name="startDay"
                          min="1"
                          max="31"
                          value={dateDeleteForm.startDay}
                          onChange={handleDateDeleteChange}
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Dia Final
                        </label>
                        <input
                          type="number"
                          name="endDay"
                          min="1"
                          max="31"
                          value={dateDeleteForm.endDay}
                          onChange={handleDateDeleteChange}
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="31"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Mês
                        </label>
                        <select
                          name="month"
                          value={dateDeleteForm.month}
                          onChange={handleDateDeleteChange}
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Selecione</option>
                          <option value="1">Janeiro</option>
                          <option value="2">Fevereiro</option>
                          <option value="3">Março</option>
                          <option value="4">Abril</option>
                          <option value="5">Maio</option>
                          <option value="6">Junho</option>
                          <option value="7">Julho</option>
                          <option value="8">Agosto</option>
                          <option value="9">Setembro</option>
                          <option value="10">Outubro</option>
                          <option value="11">Novembro</option>
                          <option value="12">Dezembro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Ano
                        </label>
                        <input
                          type="number"
                          name="year"
                          min="2020"
                          max="2030"
                          value={dateDeleteForm.year}
                          onChange={handleDateDeleteChange}
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={deletePromotionsByDate}
                        disabled={loadingList || !dateDeleteForm.startDay || !dateDeleteForm.endDay || !dateDeleteForm.month}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        🗑️ Deletar Período
                      </button>
                      <span className="text-sm text-red-600">
                        {dateDeleteForm.startDay && dateDeleteForm.endDay && dateDeleteForm.month ? 
                          `Irá deletar de ${dateDeleteForm.startDay}/${dateDeleteForm.month}/${dateDeleteForm.year} até ${dateDeleteForm.endDay}/${dateDeleteForm.month}/${dateDeleteForm.year}` :
                          'Preencha os campos para visualizar o período'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {loadingList ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Carregando promoções...</p>
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Nenhuma promoção cadastrada ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promotions.map((promotion) => (
                        <div key={promotion.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{promotion.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Loja:</span> {promotion.storeName}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Preço:</span> {promotion.price}
                                {promotion.price_from && <span className="text-gray-400 line-through ml-2">{promotion.price_from}</span>}
                              </p>
                              {promotion.coupon && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Cupom:</span> {promotion.coupon}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                <span className="font-medium">Link do site:</span> 
                                <a href={`/p/${promotion.shortId}`} target="_blank" className="text-blue-600 hover:underline ml-1">
                                  {window.location.origin}/p/{promotion.shortId}
                                </a>
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/p/${promotion.shortId}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Link copiado!');
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                📋 Copiar
                              </button>
                              <button
                                onClick={() => deletePromotion(promotion.id, promotion.title)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

          {errorLog && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <h3 className="text-sm font-medium text-gray-800 mb-2">📋 Log Detalhado do Erro:</h3>
              <pre className="text-xs text-gray-700 overflow-auto max-h-40 bg-white p-2 rounded border">
                {errorLog}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorLog);
                  alert('Log copiado para a área de transferência!');
                }}
                className="mt-2 text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
              >
                📋 Copiar Log
              </button>
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