// src/services/binanceService.js
import axios from 'axios';

class BinanceService {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = 'https://api.binance.com/api/v3';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-MBX-APIKEY': this.apiKey
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
                    signature
                }
            });

            // Filtra apenas os ativos com saldo > 0
            return response.data.balances.filter(
                balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
            );
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
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
            console.error('Erro ao buscar preços:', error);
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

export default BinanceService;