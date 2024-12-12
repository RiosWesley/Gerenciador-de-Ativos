import axios from 'axios';

class PortfolioService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api'; // URL do servidor proxy
  }

  // Binance API calls
  async getBinanceBalance() {
    try {
      const response = await axios.get(`${this.baseUrl}/binance/balance`);
      return response.data.balances.filter(
        b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      );
    } catch (error) {
      console.error('Erro ao buscar saldo Binance:', error);
      return [];
    }
  }

  // MEXC API calls
  async getMEXCBalance() {
    try {
      const response = await axios.get(`${this.baseUrl}/mexc/balance`);
      return response.data.balances.filter(
        b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      );
    } catch (error) {
      console.error('Erro ao buscar saldo MEXC:', error);
      return [];
    }
  }

  // Buscar preços atualizados
  async getBinancePrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/binance/prices`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar preços Binance:', error);
      return [];
    }
  }

  async getMEXCPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/mexc/prices`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar preços MEXC:', error);
      return [];
    }
  }

  // Consolidar saldos
  async getConsolidatedBalance() {
    try {
      const [binanceBalance, mexcBalance] = await Promise.allSettled([
        this.getBinanceBalance(),
        this.getMEXCBalance()
      ]);

      return {
        binance: binanceBalance.status === 'fulfilled' ? binanceBalance.value : [],
        mexc: mexcBalance.status === 'fulfilled' ? mexcBalance.value : []
      };
    } catch (error) {
      console.error('Erro ao obter saldos consolidados:', error);
      return { binance: [], mexc: [] };
    }
  }

  // Buscar todos os preços
  async getAllPrices() {
    const [binancePrices, mexcPrices] = await Promise.allSettled([
      this.getBinancePrices(),
      this.getMEXCPrices()
    ]);

    return {
      binance: binancePrices.status === 'fulfilled' ? binancePrices.value : [],
      mexc: mexcPrices.status === 'fulfilled' ? mexcPrices.value : []
    };
  }

  calculatePortfolioValue(balances, prices) {
    try {
      let totalBinance = 0;
      let totalMEXC = 0;

      // Processar saldos Binance
      if (balances.binance && prices.binance) {
        balances.binance.forEach(balance => {
          const price = prices.binance.find(p => p.symbol === `${balance.asset}USDT`);
          if (price) {
            const amount = parseFloat(balance.free) + parseFloat(balance.locked);
            const value = amount * parseFloat(price.price);
            
            // Log detalhado para debug
            console.log(`Binance Asset: ${balance.asset}, Amount: ${amount}, Price: ${price.price}, Value: ${value}`);
            
            totalBinance += value;
          }
        });
      }

      // Processar saldos MEXC
      if (balances.mexc && prices.mexc) {
        balances.mexc.forEach(balance => {
          const price = prices.mexc.find(p => p.symbol === `${balance.asset}USDT`);
          if (price) {
            const amount = parseFloat(balance.free) + parseFloat(balance.locked);
            const value = amount * parseFloat(price.price);
            
            // Log detalhado para debug
            console.log(`MEXC Asset: ${balance.asset}, Amount: ${amount}, Price: ${price.price}, Value: ${value}`);
            
            totalMEXC += value;
          }
        });
      }

      return {
        total: totalBinance + totalMEXC,
        binance: totalBinance,
        mexc: totalMEXC
      };
    } catch (error) {
      console.error('Erro ao calcular valor do portfólio:', error);
      return { total: 0, binance: 0, mexc: 0 };
    }
  }

  // Método para buscar saldo de futuros
  async getMEXCFuturesBalance() {
    try {
      const response = await axios.get(`${this.baseUrl}/mexc/futures/balance`);
      
      console.log('MEXC Futures Balance Full Response:', response.data);
      
      // Priorizar campos de saldo de futuros
      const futuresBalance = 
        Number(response.data?.totalBalance || 
        response.data?.availableBalance || 
        response.data?.unrealizedPnl || 0);
      
      console.log('Parsed Futures Balance:', futuresBalance);
      console.log('Futures Balance Details:', {
        totalBalance: response.data?.totalBalance,
        availableBalance: response.data?.availableBalance,
        frozenBalance: response.data?.frozenBalance,
        unrealizedPnl: response.data?.unrealizedPnl
      });
      
      return futuresBalance;
    } catch (error) {
      console.error('Erro ao buscar saldo de futuros MEXC:', error.response?.data || error.message);
      return 0; // Retorna 0 em caso de erro
    }
  }

  // Métodos adicionais mantidos na íntegra
  async getBinanceTradeHistory(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/binance/trades`, {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico Binance:', error);
      return [];
    }
  }

  async getMEXCTradeHistory(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/mexc/trades`, {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico MEXC:', error);
      return [];
    }
  }

  calculateTradeMetrics(trades, currentPrice) {
    if (!trades.length) return {
      averagePrice: 0,
      totalCost: 0,
      profitLoss: 0,
      profitLossPercentage: 0
    };

    let totalQuantity = 0;
    let totalCost = 0;

    // Calcular preço médio ponderado
    trades.forEach(trade => {
      const quantity = parseFloat(trade.qty);
      const price = parseFloat(trade.price);
      totalQuantity += quantity;
      totalCost += quantity * price;
    });

    const averagePrice = totalCost / totalQuantity;
    const currentValue = totalQuantity * currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercentage = (profitLoss / totalCost) * 100;

    return {
      averagePrice,
      totalCost,
      profitLoss,
      profitLossPercentage
    };
  }
}

export default PortfolioService;