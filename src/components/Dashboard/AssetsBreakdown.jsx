import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import PortfolioService from '../../services/portfolioService';

const AssetsBreakdown = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetData, setAssetData] = useState([]);

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        const portfolioService = new PortfolioService();
        const balances = await portfolioService.getConsolidatedBalance();
        const prices = await portfolioService.getAllPrices();
        
        // Processar dados dos ativos
        const processedData = [];
        
        // Processar Binance
        balances.binance.forEach(balance => {
          const price = prices.binance.find(p => p.symbol === `${balance.asset}USDT`);
          if (price) {
            const value = (parseFloat(balance.free) + parseFloat(balance.locked)) * parseFloat(price.price);
            processedData.push({
              asset: balance.asset,
              exchange: 'Binance',
              amount: parseFloat(balance.free) + parseFloat(balance.locked),
              value: value,
              price: parseFloat(price.price)
            });
          }
        });

        // Processar MEXC
        balances.mexc.forEach(balance => {
          const price = prices.mexc.find(p => p.symbol === `${balance.asset}USDT`);
          if (price) {
            const value = (parseFloat(balance.free) + parseFloat(balance.locked)) * parseFloat(price.price);
            processedData.push({
              asset: balance.asset,
              exchange: 'MEXC',
              amount: parseFloat(balance.free) + parseFloat(balance.locked),
              value: value,
              price: parseFloat(price.price)
            });
          }
        });

        // Ordenar por valor
        processedData.sort((a, b) => b.value - a.value);
        setAssetData(processedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAssetData();
    const interval = setInterval(fetchAssetData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-4">
      {/* Gráfico de Barras */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-4">Distribuição de Ativos</div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset" />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
              />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Ativos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-4">Lista de Ativos</div>
        <div className="divide-y">
          {assetData.map((asset, index) => (
            <div key={`${asset.asset}-${asset.exchange}`} className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{asset.asset}</div>
                  <div className="text-sm text-gray-500">{asset.exchange}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {asset.amount.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} {asset.asset}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /unidade
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetsBreakdown;