import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import TradeAnalysis from './TradeAnalysis';
import PortfolioService from '../../services/portfolioService';

const Investments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalReturn: 0,
    totalReturnPercentage: 0
  });

  useEffect(() => {
    const fetchInvestmentData = async () => {
      try {
        const portfolioService = new PortfolioService();
        const balances = await portfolioService.getConsolidatedBalance();
        const prices = await portfolioService.getAllPrices();

        let totalValue = 0;
        let totalInvested = 0;

        // Processar Binance
        for (const balance of balances.binance || []) {
          const price = prices.binance?.find(p => p.symbol === `${balance.asset}USDT`);
          
          if (price) {
            const totalHoldings = parseFloat(balance.free) + parseFloat(balance.locked);
            const valueUSD = totalHoldings * parseFloat(price.price);

            // Filtrar ativos com menos de $5
            if (valueUSD >= 5) {
              totalValue += valueUSD;

              // Buscar trades para calcular valor investido
              const trades = await portfolioService.getBinanceTradeHistory(balance.asset);
              const investedValue = trades
                .filter(trade => trade.isBuyer)
                .reduce((sum, trade) => 
                  sum + (parseFloat(trade.price) * parseFloat(trade.qty)), 
                0);

              totalInvested += investedValue;
            }
          }
        }

        // Processar MEXC
        for (const balance of balances.mexc || []) {
          const price = prices.mexc?.find(p => p.symbol === `${balance.asset}USDT`);
          
          if (price) {
            const totalHoldings = parseFloat(balance.free) + parseFloat(balance.locked);
            const valueUSD = totalHoldings * parseFloat(price.price);

            // Filtrar ativos com menos de $5
            if (valueUSD >= 5) {
              totalValue += valueUSD;

              // Buscar trades para calcular valor investido
              const trades = await portfolioService.getMEXCTradeHistory(balance.asset);
              const investedValue = trades
                .filter(trade => trade.isBuyer)
                .reduce((sum, trade) => 
                  sum + (parseFloat(trade.price) * parseFloat(trade.qty)), 
                0);

              totalInvested += investedValue;
            }
          }
        }

        // Calcular retornos
        const totalReturn = totalValue - totalInvested;
        const totalReturnPercentage = (totalReturn / totalInvested) * 100;

        setSummaryData({
          totalInvested,
          totalValue,
          totalReturn,
          totalReturnPercentage
        });

        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInvestmentData();
    const interval = setInterval(fetchInvestmentData, 30000);
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Investido</div>
          <div className="text-2xl font-bold">
            ${summaryData.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Valor Atual</div>
          <div className="text-2xl font-bold">
            ${summaryData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Retorno Total</div>
          <div className={`text-2xl font-bold flex items-center gap-2 ${
            summaryData.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summaryData.totalReturn >= 0 ? (
              <TrendingUp className="h-6 w-6" />
            ) : (
              <TrendingDown className="h-6 w-6" />
            )}
            ${Math.abs(summaryData.totalReturn).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Retorno (%)</div>
          <div className={`text-2xl font-bold ${
            summaryData.totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summaryData.totalReturnPercentage >= 0 ? '+' : ''}
            {summaryData.totalReturnPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Análise Detalhada
        </h2>
        <TradeAnalysis />
      </section>
    </div>
  );
};

export default Investments;