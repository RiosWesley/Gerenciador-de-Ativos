// src/components/Dashboard/TradeAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';
import PortfolioService from '../../services/portfolioService';
import InvestmentAnalysisService from '../../services/InvestmentAnalysisService';

const TradeAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);

  useEffect(() => {
    const fetchAndAnalyzeData = async () => {
      try {
        const portfolioService = new PortfolioService();
        const analysisService = new InvestmentAnalysisService();
        
        // Buscar dados necessários
        const balances = await portfolioService.getConsolidatedBalance();
        const prices = await portfolioService.getAllPrices();
        const assetsMetrics = [];

        // Processar ativos da Binance
        for (const balance of balances.binance || []) {
          if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
            const currentPrice = prices.binance?.find(p => p.symbol === `${balance.asset}USDT`)?.price;
            
            if (currentPrice) {
              const trades = await portfolioService.getBinanceTradeHistory(balance.asset);
              const totalHoldings = parseFloat(balance.free) + parseFloat(balance.locked);
              
              const analysis = analysisService.calculateInvestmentMetrics(
                trades,
                parseFloat(currentPrice),
                totalHoldings
              );

              assetsMetrics.push({
                symbol: balance.asset,
                exchange: 'Binance',
                ...analysis
              });
            }
          }
        }

        // Processar ativos da MEXC
        for (const balance of balances.mexc || []) {
          if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
            const currentPrice = prices.mexc?.find(p => p.symbol === `${balance.asset}USDT`)?.price;
            
            if (currentPrice) {
              const trades = await portfolioService.getMEXCTradeHistory(balance.asset);
              const totalHoldings = parseFloat(balance.free) + parseFloat(balance.locked);
              
              const analysis = analysisService.calculateInvestmentMetrics(
                trades,
                parseFloat(currentPrice),
                totalHoldings
              );

              assetsMetrics.push({
                symbol: balance.asset,
                exchange: 'MEXC',
                ...analysis
              });
            }
          }
        }

        // Calcular métricas do portfolio completo
        const portfolio = analysisService.calculatePortfolioMetrics(assetsMetrics);

        setAnalysisData(assetsMetrics);
        setPortfolioMetrics(portfolio);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAndAnalyzeData();
    const interval = setInterval(fetchAndAnalyzeData, 5 * 60 * 1000);
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
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {portfolioMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm">Portfolio Total</span>
            </div>
            <div className="text-2xl font-bold">
              ${portfolioMetrics.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {portfolioMetrics.assets} ativos
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <BarChart2 className="h-5 w-5" />
              <span className="text-sm">ROI Total</span>
            </div>
            <div className={`text-2xl font-bold ${portfolioMetrics.totalRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioMetrics.totalRoi >= 0 ? '+' : ''}
              {portfolioMetrics.totalRoi.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {portfolioMetrics.numberOfTrades} trades
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Lucro Realizado</span>
            </div>
            <div className={`text-2xl font-bold ${portfolioMetrics.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${portfolioMetrics.realizedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm">Taxas Totais</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              ${portfolioMetrics.totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Asset Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Análise por Ativo</h3>
        </div>
        <div className="divide-y">
          {analysisData.map((asset) => (
            <div key={`${asset.symbol}-${asset.exchange}`} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-lg">{asset.symbol}</div>
                  <div className="text-sm text-gray-500">{asset.exchange}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {asset.currentHoldings.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} {asset.symbol}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Preço Médio */}
                <div>
                  <div className="text-sm text-gray-500">Preço Médio de Compra</div>
                  <div className="font-medium">
                    ${asset.metrics.averageBuyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* ROI */}
                <div>
                  <div className="text-sm text-gray-500">ROI</div>
                  <div className={`font-medium ${
                    asset.metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.metrics.roi >= 0 ? '+' : ''}
                    {asset.metrics.roi.toFixed(2)}%
                  </div>
                </div>

                {/* Lucro/Prejuízo */}
                <div>
                  <div className="text-sm text-gray-500">Lucro/Prejuízo Total</div>
                  <div className={`font-medium flex items-center gap-1 ${
                    asset.metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.metrics.totalProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    ${Math.abs(asset.metrics.totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Volume de Trading */}
                <div>
                  <div className="text-sm text-gray-500">Volume de Trading</div>
                  <div className="font-medium">
                    ${asset.trading.totalSpentBuying.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {asset.trading.numberOfTrades} trades
                  </div>
                </div>
              </div>

              {/* Detalhes Adicionais */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-sm text-gray-500">Faixa de Preço</div>
                  <div className="text-sm">
                    <span className="text-green-600">Alta: ${asset.priceRange.highest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <br />
                    <span className="text-red-600">Baixa: ${asset.priceRange.lowest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Lucro Realizado</div>
                  <div className={`text-sm ${
                    asset.metrics.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${asset.metrics.realizedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Volatilidade</div>
                  <div className="text-sm">
                    {asset.metrics.priceVolatility.toFixed(2)}%
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

export default TradeAnalysis;