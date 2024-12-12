// src/services/mexcService.js
import axios from 'axios';

class MEXCService {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = 'https://api.mexc.com/api/v3';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-MEXC-APIKEY': this.apiKey,
            }
        });
    }

    /**
     * Obtém o saldo de todas as moedas da conta
     * @returns {Promise} Promise com array de saldos
     */
    async getAccountBalance() {
        try {
            const timestamp = Date.now();
            const signature = this.generateSignature(`timestamp=${timestamp}`);
            
            const response = await this.client.get('/account', {
                params: {
                    timestamp,
                    signature,
                }
            });

            // Filtra apenas os ativos com saldo > 0
            return response.data.balances.filter(
                balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
            );
        } catch (error) {
            console.error('Erro ao buscar saldo MEXC:', error);
            throw error;
        }
    }

    /**
     * Obtém os preços atuais de todas as moedas
     * @returns {Promise} Promise com array de preços
     */
    async getCurrentPrices() {
        try {
            const response = await this.client.get('/ticker/price');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar preços MEXC:', error);
            throw error;
        }
    }

    /**
     * Obtém o histórico de trades
     * @param {string} symbol - Par de trading (ex: 'BTCUSDT')
     * @param {number} limit - Número de registros (default: 500, max: 1000)
     * @returns {Promise} Promise com array de trades
     */
    async getTradeHistory(symbol, limit = 500) {
        try {
            const timestamp = Date.now();
            const queryString = `symbol=${symbol}&limit=${limit}&timestamp=${timestamp}`;
            const signature = this.generateSignature(queryString);

            const response = await this.client.get('/myTrades', {
                params: {
                    symbol,
                    limit,
                    timestamp,
                    signature,
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar histórico de trades MEXC:', error);
            throw error;
        }
    }

    /**
     * Gera a assinatura para autenticação
     * @param {string} queryString - String de parâmetros da query
     * @returns {string} Assinatura HMAC SHA256
     */
    generateSignature(queryString) {
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', this.apiSecret)
            .update(queryString)
            .digest('hex');
    }
}

export default MEXCService;