// src/services/financialAnalysisService.js
import axios from 'axios';

class FinancialAnalysisService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api'; // URL do servidor proxy
  }

  /**
   * Calcular total de depósitos e saques
   * @param {string} exchange - Nome da exchange (binance/mexc)
   * @returns {Promise} Detalhes de depósitos e saques
   */
  async getDepositAndWithdrawHistory(exchange) {
    try {
      // Implementar endpoint no servidor para buscar histórico
      const response = await axios.get(`${this.baseUrl}/${exchange}/deposit-withdraw-history`);
      
      const deposits = response.data.deposits || [];
      const withdraws = response.data.withdraws || [];

      const totalDeposits = {
        fiat: deposits.filter(d => d.type === 'fiat').reduce((sum, d) => sum + parseFloat(d.amount), 0),
        crypto: deposits.filter(d => d.type === 'crypto').reduce((sum, d) => sum + parseFloat(d.amount), 0)
      };

      const totalWithdraws = {
        fiat: withdraws.filter(w => w.type === 'fiat').reduce((sum, w) => sum + parseFloat(w.amount), 0),
        crypto: withdraws.filter(w => w.type === 'crypto').reduce((sum, w) => sum + parseFloat(w.amount), 0)
      };

      return {
        totalDeposits,
        totalWithdraws,
        depositList: deposits,
        withdrawList: withdraws
      };
    } catch (error) {
      console.error(`Erro ao buscar histórico de depósitos/saques ${exchange}:`, error);
      return {
        totalDeposits: { fiat: 0, crypto: 0 },
        totalWithdraws: { fiat: 0, crypto: 0 },
        depositList: [],
        withdrawList: []
      };
    }
  }

  /**
   * Calcular investimento total considerando múltiplas fontes
   * @returns {Promise} Detalhes do investimento total
   */
  async calculateTotalInvestment() {
    try {
      const [binanceFinances, mexcFinances] = await Promise.all([
        this.getDepositAndWithdrawHistory('binance'),
        this.getDepositAndWithdrawHistory('mexc')
      ]);

      const totalInvestment = {
        binance: {
          totalDeposits: binanceFinances.totalDeposits.fiat + binanceFinances.totalDeposits.crypto,
          totalWithdraws: binanceFinances.totalWithdraws.fiat + binanceFinances.totalWithdraws.crypto,
          deposits: binanceFinances.depositList,
          withdraws: binanceFinances.withdrawList
        },
        mexc: {
          totalDeposits: mexcFinances.totalDeposits.fiat + mexcFinances.totalDeposits.crypto,
          totalWithdraws: mexcFinances.totalWithdraws.fiat + mexcFinances.totalWithdraws.crypto,
          deposits: mexcFinances.depositList,
          withdraws: mexcFinances.withdrawList
        }
      };

      const grandTotalDeposits = totalInvestment.binance.totalDeposits + totalInvestment.mexc.totalDeposits;
      const grandTotalWithdraws = totalInvestment.binance.totalWithdraws + totalInvestment.mexc.totalWithdraws;

      return {
        totalInvested: grandTotalDeposits,
        totalWithdrawn: grandTotalWithdraws,
        netInvestment: grandTotalDeposits - grandTotalWithdraws,
        details: totalInvestment
      };
    } catch (error) {
      console.error('Erro ao calcular investimento total:', error);
      return {
        totalInvested: 0,
        totalWithdrawn: 0,
        netInvestment: 0,
        details: {}
      };
    }
  }
}

export default FinancialAnalysisService;