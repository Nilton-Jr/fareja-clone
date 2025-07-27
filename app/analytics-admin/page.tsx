// Separate analytics admin panel
import { getAnalyticsData } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

interface AnalyticsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnalyticsAdmin({ searchParams }: AnalyticsPageProps) {
  let params: any = {};
  let days = 30;
  let analyticsData = null;

  try {
    params = await searchParams;
    days = Number(params.days) || 30;
    
    // Get analytics data with error handling
    analyticsData = await getAnalyticsData(days);
  } catch (error) {
    console.error('Analytics page error:', error);
    analyticsData = null;
  }
  
  if (!analyticsData) {
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
    deviceStats,
    dailyStats,
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
              defaultValue={days}
              onChange={(e) => window.location.href = `?days=${e.target.value}`}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <a 
              href="/admin" 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              ← Admin Principal
            </a>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Visualizações"
            value={totalPageViews.toLocaleString()}
            icon="👁️"
            color="blue"
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
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon="📈"
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Páginas Mais Visitadas</h3>
            <div className="space-y-3">
              {topPages.slice(0, 10).map((page: any, index: number) => (
                <div key={page.page} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <span className="text-sm text-gray-900 truncate">
                      {page.page === '/' ? 'Homepage' : page.page}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
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
                      Eventos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dailyStats as any[]).slice(0, 10).map((day: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.timestamp).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day._count?.id || 0}
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

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: 'blue' | 'green' | 'purple' | 'orange'; 
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50'
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colorClasses[color]} p-6`}>
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
}