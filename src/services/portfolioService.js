import axios from 'axios';
import crypto from 'crypto';

class PortfolioService {
  constructor() {
    this.binanceApiKey = import.meta.env.VITE_BINANCE_API_KEY;
    this.binanceApiSecret = import.meta.env.VITE_BINANCE_API_SECRET;
    this.mexcApiKey = import.meta.env.REACT_APP_MEXC_API_KEY;
    this.mexcApiSecret = import.meta.env.REACT_APP_MEXC_API_SECRET;


    this.binanceBaseUrl = '/binance-api';
    this.mexcBaseUrl = '/mexc-api';
  }

  // Gera assinatura para requisições autenticadas Binance
  generateBinanceSignature(queryString) {
    return crypto
      .createHmac('sha256', this.binanceApiSecret)
      .update(queryString)
      .digest('hex');
  }

  // Gera assinatura para requisições autenticadas MEXC
  generateMEXCSignature(params) {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    return crypto
      .createHmac('sha256', this.mexcApiSecret)
      .update(signString)
      .digest('hex');
  }

  // Busca saldos da Binance
  async fetchBinanceBalances() {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = this.generateBinanceSignature(queryString);

    try {
      const response = await axios.get(`${this.binanceBaseUrl}/api/v3/account`, {
        headers: {
          'X-MBX-APIKEY': this.binanceApiKey
        },
        params: {
          timestamp,
          signature
        }
      });

      return response.data.balances
        .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map(balance => ({
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked
        }));
    } catch (error) {
      console.error('Erro ao buscar saldos da Binance:', error.response ? error.response.data : error.message);
      return [];
    }
  }

  // Busca saldos da MEXC
  async fetchMEXCBalances() {
    const timestamp = Date.now();
    const params = {
      api_key: this.mexcApiKey,
      recvWindow: 5000,
      timestamp
    };

    const signature = this.generateMEXCSignature(params);

    try {
      const response = await axios.get(`${this.mexcBaseUrl}/api/v3/account`, {
        params: {
          ...params,
          signature
        }
      });

      return response.data.balances
        .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map(balance => ({
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked
        }));
    } catch (error) {
      console.error('Erro ao buscar saldos da MEXC:', error.response ? error.response.data : error.message);
      return [];
    }
  }

  // Busca preços atuais da Binance
  async fetchBinancePrices() {
    try {
      const response = await axios.get(`${this.binanceBaseUrl}/api/v3/ticker/price`);
      return response.data.filter(price => price.symbol.endsWith('USDT'));
    } catch (error) {
      console.error('Erro ao buscar preços da Binance:', error.message);
      return [];
    }
  }

  // Busca preços atuais da MEXC
  async fetchMEXCPrices() {
    try {
      const response = await axios.get(`${this.mexcBaseUrl}/api/v3/ticker/price`);
      return response.data.filter(price => price.symbol.endsWith('USDT'));
    } catch (error) {
      console.error('Erro ao buscar preços da MEXC:', error.message);
      return [];
    }
  }

  // Métodos existentes mantidos igual ao anterior
  async getConsolidatedBalance() {
    try {
      const binanceBalances = await this.fetchBinanceBalances();
      const mexcBalances = await this.fetchMEXCBalances();

      return {
        binance: binanceBalances,
        mexc: mexcBalances
      };
    } catch (error) {
      console.error('Erro ao obter saldos consolidados:', error);
      return { binance: [], mexc: [] };
    }
  }

  async getAllPrices() {
    try {
      const binancePrices = await this.fetchBinancePrices();
      const mexcPrices = await this.fetchMEXCPrices();

      return {
        binance: binancePrices,
        mexc: mexcPrices
      };
    } catch (error) {
      console.error('Erro ao obter preços:', error);
      return { binance: [], mexc: [] };
    }
  }

  calculatePortfolioValue(balances, prices) {
    let totalBinance = 0;
    let totalMEXC = 0;

    // Calcular valor na Binance
    balances.binance.forEach(balance => {
      const price = prices.binance.find(p => p.symbol === `${balance.asset}USDT`);
      if (price) {
        const totalBalance = parseFloat(balance.free) + parseFloat(balance.locked);
        totalBinance += totalBalance * parseFloat(price.price);
      }
    });

    // Calcular valor na MEXC
    balances.mexc.forEach(balance => {
      const price = prices.mexc.find(p => p.symbol === `${balance.asset}USDT`);
      if (price) {
        const totalBalance = parseFloat(balance.free) + parseFloat(balance.locked);
        totalMEXC += totalBalance * parseFloat(price.price);
      }
    });

    return {
      total: totalBinance + totalMEXC,
      binance: totalBinance,
      mexc: totalMEXC
    };
  }
}

export default PortfolioService;