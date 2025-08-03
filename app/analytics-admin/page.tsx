'use client';

// Separate analytics admin panel
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Simple Line Chart Component for single metrics
function SimpleLineChart({ data, title, color, icon }: { data: any[], title: string, color: string, icon: string }) {
  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate max value for scaling
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero

  // Create scaling functions
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path string
  const pathString = values.map((value, index) => 
    `${index === 0 ? 'M' : 'L'} ${xScale(index)} ${yScale(value)}`
  ).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <h4 className="text-md font-semibold text-gray-900 mb-3">{icon} {title}</h4>
      <svg width={width} height={height} className="bg-gray-50 rounded">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => {
            const y = chartHeight - (percent / 100) * chartHeight;
            const value = Math.round(minValue + (percent / 100) * valueRange);
            return (
              <g key={percent}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Line */}
          <path
            d={pathString}
            fill="none"
            stroke={color}
            strokeWidth={3}
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {data.map((point, index) => (
            <circle 
              key={index}
              cx={xScale(index)} 
              cy={yScale(point.value)} 
              r={4} 
              fill={color}
              className="drop-shadow-sm"
            />
          ))}

          {/* X-axis labels */}
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 6) === 0) { // Show fewer labels to avoid crowding
              return (
                <text
                  key={index}
                  x={xScale(index)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {new Date(point.date).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </text>
              );
            }
            return null;
          })}
        </g>
      </svg>
    </div>
  );
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const [days, setDays] = useState(30);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDay: '',
    endDay: '',
    month: '',
    year: new Date().getFullYear().toString()
  });
  const [storeFilter, setStoreFilter] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'with' | 'without'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    const daysParam = searchParams.get('days');
    setDays(daysParam ? Number(daysParam) : 30);
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [days, isAuthenticated, storeFilter, couponFilter]);

  const fetchAnalyticsData = async (customParams?: string) => {
    setLoading(true);
    setError(null);
    try {
      let params = customParams || `days=${days}`;
      
      // Add filter parameters
      const filterParams = new URLSearchParams();
      if (!customParams) {
        filterParams.set('days', days.toString());
      } else {
        // Parse existing custom params
        const existingParams = new URLSearchParams(customParams);
        existingParams.forEach((value, key) => {
          filterParams.set(key, value);
        });
      }
      
      if (storeFilter) {
        filterParams.set('storeName', storeFilter);
      }
      
      if (couponFilter !== 'all') {
        filterParams.set('hasCoupon', couponFilter === 'with' ? 'true' : 'false');
      }
      
      params = filterParams.toString();
      
      const response = await fetch(`/api/analytics/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Erro ao carregar dados de analytics');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!apiKey.trim()) {
      setAuthError('❌ Por favor, insira a API Key.');
      return;
    }

    // Test API key by making a request
    try {
      const response = await fetch(`/api/analytics/data?days=7`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('❌ API Key inválida. Tente novamente.');
      }
    } catch (error) {
      setAuthError('❌ Erro ao validar API Key. Tente novamente.');
    }
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    const url = new URL(window.location.href);
    url.searchParams.set('days', newDays.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDateFilter({
      ...dateFilter,
      [e.target.name]: e.target.value
    });
  };

  const applyDateFilter = () => {
    const { startDay, endDay, month, year } = dateFilter;
    
    if (!startDay || !endDay || !month) {
      setError('❌ Por favor, preencha todos os campos de data.');
      return;
    }

    const startDayNum = parseInt(startDay);
    const endDayNum = parseInt(endDay);
    const monthNum = parseInt(month);

    if (startDayNum < 1 || startDayNum > 31 || endDayNum < 1 || endDayNum > 31) {
      setError('❌ Dias devem estar entre 1 e 31.');
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      setError('❌ Mês deve estar entre 1 e 12.');
      return;
    }

    if (startDayNum > endDayNum) {
      setError('❌ O dia inicial não pode ser maior que o dia final.');
      return;
    }

    // Build custom params for date range
    const params = `startDay=${startDay}&endDay=${endDay}&month=${month}&year=${year}`;
    fetchAnalyticsData(params);
    setShowDateFilter(false);
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDay: '',
      endDay: '',
      month: '',
      year: new Date().getFullYear().toString()
    });
    fetchAnalyticsData();
    setShowDateFilter(false);
  };

  const handleDeleteData = async () => {
    if (!dateFilter.startDay || !dateFilter.endDay || !dateFilter.month || !dateFilter.year) {
      alert('Por favor, preencha todos os campos de data antes de apagar os dados.');
      return;
    }

    const startDate = new Date(Number(dateFilter.year), Number(dateFilter.month) - 1, Number(dateFilter.startDay));
    const endDate = new Date(Number(dateFilter.year), Number(dateFilter.month) - 1, Number(dateFilter.endDay));
    
    const startFormatted = startDate.toLocaleDateString('pt-BR');
    const endFormatted = endDate.toLocaleDateString('pt-BR');

    // First confirmation
    const firstConfirm = confirm(
      `⚠️ ATENÇÃO: Você tem certeza que deseja apagar TODOS os dados de analytics do período de ${startFormatted} até ${endFormatted}?\n\nEsta ação NÃO PODE ser desfeita!`
    );
    
    if (!firstConfirm) return;

    // Second confirmation
    const secondConfirm = confirm(
      `🚨 CONFIRMAÇÃO FINAL: Confirme novamente que deseja apagar permanentemente os dados de analytics de ${startFormatted} até ${endFormatted}.\n\nDigite OK para confirmar ou Cancelar para abortar.`
    );
    
    if (!secondConfirm) return;

    setDeleteLoading(true);
    setDeleteMessage('');

    try {
      const params = new URLSearchParams({
        startDay: dateFilter.startDay,
        endDay: dateFilter.endDay,
        month: dateFilter.month,
        year: dateFilter.year
      });

      const response = await fetch(`/api/analytics/delete?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setDeleteMessage(`✅ ${result.message}\n\nDados apagados:\n- Analytics: ${result.deletedCounts.analytics}\n- Cliques: ${result.deletedCounts.promotionClicks}\n- Visualizações: ${result.deletedCounts.promotionViews}\n- Total: ${result.deletedCounts.total} registros`);
        
        // Refresh analytics data
        fetchAnalyticsData();
        
        // Clear the modal after success
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeleteMessage('');
        }, 3000);
      } else {
        setDeleteMessage(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteMessage('❌ Erro ao apagar dados. Tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-center mb-6">🔐 Analytics Admin</h1>
            <p className="text-gray-600 text-center mb-6">
              Acesso restrito. Insira a API Key para continuar.
            </p>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua API Key..."
                  required
                />
              </div>
              
              {authError && (
                <div className="text-red-600 text-sm text-center">
                  {authError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔓 Acessar Analytics
              </button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <a 
                href="/admin" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Voltar para Admin Principal
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Analytics Dashboard</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Carregando analytics...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Analytics Dashboard</h1>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <h3 className="font-bold">⚠️ Analytics Indisponível</h3>
            <p className="mt-2">Os analytics estão sendo configurados. Possíveis causas:</p>
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Tabelas do banco ainda não foram criadas</li>
              <li>Ainda não há dados coletados</li>
              <li>Conexão temporária com o banco</li>
            </ul>
            <p className="mt-2 text-sm">
              📈 Os dados aparecerão automaticamente após algumas visitas ao site.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalPageViews,
    uniqueVisitors,
    totalClicks,
    topPages,
    topPromotions,
    topStores,
    couponStats,
    deviceStats,
    dailyStats,
    trafficSources,
    chartData,
    totalViewsValue,
    totalClicksValue,
    conversionRate
  } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <div className="flex space-x-4">
            <select 
              className="border border-gray-300 rounded px-3 py-2"
              value={days}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              📅 Filtro Personalizado
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              title="Apagar dados de analytics por período"
            >
              🗑️ Apagar Dados
            </button>
            <button
              onClick={() => fetchAnalyticsData()}
              disabled={loading}
              className={`px-4 py-2 rounded transition-colors ${
                loading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title="Atualizar dados do dashboard"
            >
              {loading ? '⏳ Carregando...' : '🔄 Atualizar Dados'}
            </button>
            <a 
              href="/admin" 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              ← Admin Principal
            </a>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-8 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏪 Filtro por Loja
              </label>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas as lojas</option>
                <option value="Amazon">Amazon</option>
                <option value="Mercado Livre">Mercado Livre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎫 Filtro por Cupom
              </label>
              <select
                value={couponFilter}
                onChange={(e) => setCouponFilter(e.target.value as 'all' | 'with' | 'without')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos (com e sem cupom)</option>
                <option value="with">Apenas com cupom</option>
                <option value="without">Apenas sem cupom</option>
              </select>
            </div>
          </div>
          {(storeFilter || couponFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {storeFilter && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                    🏪 Loja: {storeFilter}
                  </span>
                )}
                {couponFilter !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    🎫 {couponFilter === 'with' ? 'Com cupom' : 'Sem cupom'}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setStoreFilter('');
                  setCouponFilter('all');
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                🔄 Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Custom Date Filter */}
        {showDateFilter && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Filtro por Período Específico</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia Inicial
                </label>
                <input
                  type="number"
                  name="startDay"
                  min="1"
                  max="31"
                  value={dateFilter.startDay}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia Final
                </label>
                <input
                  type="number"
                  name="endDay"
                  min="1"
                  max="31"
                  value={dateFilter.endDay}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 31"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  name="month"
                  value={dateFilter.month}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  name="year"
                  min="2024"
                  max="2030"
                  value={dateFilter.year}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 2025"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={applyDateFilter}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Aplicar Filtro
              </button>
              <button
                onClick={clearDateFilter}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🔄 Limpar Filtro
              </button>
              <button
                onClick={() => setShowDateFilter(false)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Delete Data Modal */}
        {showDeleteModal && (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🗑️ Apagar Dados de Analytics</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ <strong>ATENÇÃO:</strong> Esta ação irá apagar permanentemente todos os dados de analytics do período selecionado.
              </p>
              <p className="text-red-700 text-sm mt-2">
                Incluindo: visualizações de páginas, cliques em promoções, dados de visitantes únicos e estatísticas de dispositivos.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia Inicial
                </label>
                <input
                  type="number"
                  name="startDay"
                  min="1"
                  max="31"
                  value={dateFilter.startDay}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia Final
                </label>
                <input
                  type="number"
                  name="endDay"
                  min="1"
                  max="31"
                  value={dateFilter.endDay}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 31"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  name="month"
                  value={dateFilter.month}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  name="year"
                  min="2020"
                  max="2030"
                  value={dateFilter.year}
                  onChange={handleDateFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="2024"
                />
              </div>
            </div>

            {deleteMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{deleteMessage}</pre>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleDeleteData}
                disabled={deleteLoading}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  deleteLoading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleteLoading ? '⏳ Apagando...' : '🗑️ Apagar Dados'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteMessage('');
                }}
                disabled={deleteLoading}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Visualizações"
            value={totalPageViews.toLocaleString()}
            icon="👁️"
            color="blue"
            totalValue={totalViewsValue}
          />
          <MetricCard
            title="Visitantes Únicos"
            value={uniqueVisitors.toLocaleString()}
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Cliques em Promoções"
            value={totalClicks.toLocaleString()}
            icon="🔗"
            color="purple"
            totalValue={totalClicksValue}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon="📈"
            color="orange"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Páginas Mais Visitadas</h3>
            <div className="space-y-3">
              {topPages.slice(0, 10).map((page: any, index: number) => (
                <div key={page.page} className="flex justify-between items-center">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-sm text-gray-500 w-6 flex-shrink-0">{index + 1}.</span>
                    {page.isProductPage ? (
                      <a 
                        href={`/p/${page.shortId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate ml-2"
                        title={page.title}
                      >
                        {page.title}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-900 truncate ml-2">
                        {page.title}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-blue-600 flex-shrink-0 ml-2">
                    {page._count.page}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Dispositivos</h3>
            <div className="space-y-3">
              {deviceStats.map((device: any) => {
                const percentage = ((device._count.device / totalPageViews) * 100).toFixed(1);
                return (
                  <div key={device.device} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {device.device === 'mobile' ? '📱' : 
                         device.device === 'tablet' ? '📱' : 
                         device.device === 'desktop' ? '💻' : '❓'}
                      </span>
                      <span className="text-sm text-gray-900 capitalize">
                        {device.device}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {device._count.device}
                      </div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {chartData && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Views Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <SimpleLineChart 
                data={chartData.map((d: any) => ({ date: d.date, value: d.pageViews }))}
                title="Visualizações Diárias"
                color="#2563eb"
                icon="👁️"
              />
            </div>
            
            {/* Clicks Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <SimpleLineChart 
                data={chartData.map((d: any) => ({ date: d.date, value: d.clicks }))}
                title="Cliques Diários"
                color="#9333ea"
                icon="🔗"
              />
            </div>
          </div>
        )}

        {/* Charts Row 2 - Store, Coupon and Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Stores */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏪 Lojas Mais Clicadas</h3>
            <div className="space-y-3">
              {topStores && topStores.length > 0 ? (
                topStores.slice(0, 10).map((store: any, index: number) => (
                  <div key={store.storeName} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                      <span className="text-sm text-gray-900 truncate">
                        {store.storeName}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {store.clicks} cliques
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>📊 Nenhum dado de loja disponível ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* Coupon Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Estatísticas de Cupom</h3>
            <div className="space-y-4">
              {couponStats ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🎫</span>
                      <span className="text-sm text-gray-900">Com Cupom</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {couponStats.withCoupon}
                      </div>
                      <div className="text-xs text-gray-500">
                        {totalClicks > 0 ? ((couponStats.withCoupon / totalClicks) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">❌</span>
                      <span className="text-sm text-gray-900">Sem Cupom</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {couponStats.withoutCoupon}
                      </div>
                      <div className="text-xs text-gray-500">
                        {totalClicks > 0 ? ((couponStats.withoutCoupon / totalClicks) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        Total: {couponStats.withCoupon + couponStats.withoutCoupon}
                      </div>
                      <div className="text-sm text-gray-600">
                        {couponStats.withCoupon > couponStats.withoutCoupon ? 
                          '🎫 Promoções com cupom são mais clicadas' : 
                          '❌ Promoções sem cupom são mais clicadas'
                        }
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>📊 Nenhum dado de cupom disponível ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Fontes de Tráfego</h3>
            <div className="space-y-3">
              {trafficSources && trafficSources.length > 0 ? (
                trafficSources.slice(0, 8).map((source: any, index: number) => {
                  const getSourceIcon = (sourceName: string) => {
                    switch (sourceName.toLowerCase()) {
                      case 'whatsapp': return '💬';
                      case 'instagram': return '📸';
                      case 'facebook': return '📘';
                      case 'google': return '🔍';
                      case 'twitter': return '🐦';
                      case 'youtube': return '📹';
                      case 'linkedin': return '💼';
                      case 'direto': return '🔗';
                      default: return '🌐';
                    }
                  };

                  return (
                    <div key={source.source} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <span className="text-lg mr-2">{getSourceIcon(source.source)}</span>
                        <span className="text-sm text-gray-900 truncate">
                          {source.source}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-purple-600">
                        {source.visits} visitas
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>📊 Nenhum dado de fonte disponível ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Promotions with Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Promoções Mais Clicadas</h3>
          <div className="space-y-4">
            {topPromotions && topPromotions.length > 0 ? (
              topPromotions.slice(0, 10).map((promotion: any, index: number) => (
                <div key={promotion.promotionId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-500 w-6 font-medium">{index + 1}.</span>
                        <a 
                          href={`/p/${promotion.shortId}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                          title={promotion.title}
                        >
                          {promotion.title}
                        </a>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="mr-2">🏪</span>
                          <span className="font-medium">Loja:</span>
                          <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {promotion.storeName}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="mr-2">{promotion.hasCoupon ? '🎫' : '❌'}</span>
                          <span className="font-medium">Cupom:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded ${
                            promotion.hasCoupon 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promotion.hasCoupon ? promotion.coupon || 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {promotion.clickCount}
                      </div>
                      <div className="text-xs text-gray-500">cliques</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>📊 Nenhum dado de promoção disponível ainda.</p>
                <p className="text-sm mt-2">Os dados começarão a aparecer após cliques em promoções.</p>
              </div>
            )}
          </div>
        </div>

        {/* Google Analytics Embed */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Google Analytics 4</h3>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              Para visualizar dados completos do Google Analytics:
            </p>
            <ol className="text-left text-sm text-gray-600 max-w-md mx-auto space-y-2">
              <li>1. Configure a variável NEXT_PUBLIC_GA_ID no Vercel</li>
              <li>2. Acesse <a href="https://analytics.google.com" target="_blank" className="text-blue-600 hover:underline">Google Analytics</a></li>
              <li>3. Crie uma propriedade GA4 para fareja.ai</li>
              <li>4. Use o Measurement ID no formato G-XXXXXXXXXX</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ GA4 ID atual: {process.env.NEXT_PUBLIC_GA_ID || 'Não configurado'}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Atividade Recente</h3>
          {dailyStats && dailyStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dailyStats as any[]).slice(0, 10).map((event: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.timestamp).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.sessionId ? 'Visita' : 'Evento'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>📊 Nenhum dado disponível ainda.</p>
              <p className="text-sm mt-2">Os dados começarão a aparecer após algumas visitas ao site.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Analytics Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Inicializando analytics...</span>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AnalyticsAdmin() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  color,
  totalValue 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: 'blue' | 'green' | 'purple' | 'orange';
  totalValue?: number;
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colorClasses[color]} p-6`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
          {totalValue !== undefined && totalValue > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Valor total: {formatCurrency(totalValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}