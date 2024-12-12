import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import PortfolioService from '../../services/portfolioService';

const PortfolioSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    total: 0,
    binance: 0,
    mexc: 0
  });

  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F'];

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const portfolioService = new PortfolioService();
        const balances = await portfolioService.getConsolidatedBalance();
        const prices = await portfolioService.getAllPrices();
        const portfolio = portfolioService.calculatePortfolioValue(balances, prices);
        
        setPortfolioData(portfolio);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: 'Binance', value: portfolioData.binance },
    { name: 'MEXC', value: portfolioData.mexc }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Erro ao carregar dados: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Card de Valor Total */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-2">Valor Total</div>
        <div className="text-2xl font-bold">
          ${portfolioData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Card de Distribuição por Exchange */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-2">Distribuição por Exchange</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[0] }} />
            <span>Binance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[1] }} />
            <span>MEXC</span>
          </div>
        </div>
      </div>

      {/* Card de Detalhes por Exchange */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-4">Detalhes por Exchange</div>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Binance</div>
            <div className="text-xl font-semibold">
              ${portfolioData.binance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">MEXC</div>
            <div className="text-xl font-semibold">
              ${portfolioData.mexc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;