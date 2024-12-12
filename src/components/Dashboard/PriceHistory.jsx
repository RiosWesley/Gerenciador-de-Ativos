import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import PortfolioService from '../../services/portfolioService';

const PriceHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeRange, setTimeRange] = useState('1d');
  const [priceData, setPriceData] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const portfolioService = new PortfolioService();
        const balances = await portfolioService.getConsolidatedBalance();
        
        // Obter lista única de ativos
        const assets = new Set();
        balances.binance.forEach(balance => assets.add(balance.asset));
        balances.mexc.forEach(balance => assets.add(balance.asset));
        setAvailableAssets(Array.from(assets));

        // Simular dados históricos
        const now = Date.now();
        const historicalData = Array(24).fill(0).map((_, i) => ({
          timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
          price: Math.random() * 1000 + 40000
        }));

        setPriceData(historicalData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPriceData();
    const interval = setInterval(fetchPriceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedAsset, timeRange]);

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
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Preços</h2>
        <div className="flex space-x-2">
          {/* Seletor de Ativo */}
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            {availableAssets.map(asset => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>

          {/* Seletor de Período */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="1d">1 Dia</option>
            <option value="1w">1 Semana</option>
            <option value="1m">1 Mês</option>
            <option value="3m">3 Meses</option>
            <option value="1y">1 Ano</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Preço']}
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8" 
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas do Período */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Preço Mais Alto</div>
            <div className="font-semibold">
              ${Math.max(...priceData.map(d => d.price)).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Preço Mais Baixo</div>
            <div className="font-semibold">
              ${Math.min(...priceData.map(d => d.price)).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Variação</div>
            <div className="font-semibold">
              {((priceData[priceData.length - 1].price / priceData[0].price - 1) * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceHistory;