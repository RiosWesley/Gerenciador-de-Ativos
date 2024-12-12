import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  binance: {
    apiKey: process.env.VITE_REACT_APP_BINANCE_API_KEY,
    apiSecret: process.env.VITE_REACT_APP_BINANCE_API_SECRET,
    baseUrl: 'https://api.binance.com'
  },
  mexc: {
    apiKey: process.env.VITE_REACT_APP_MEXC_API_KEY,
    apiSecret: process.env.VITE_REACT_APP_MEXC_API_SECRET,
    baseUrl: 'https://api.mexc.com'
  }
};

// Função para gerar assinatura Binance
function generateBinanceSignature(queryString, apiSecret) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// Função para gerar assinatura MEXC
function generateMEXCSignature(params, apiSecret) {
  // Garantir que todos os valores são strings
  const orderedParams = Object.keys(params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = String(params[key]);
      return obj;
    }, {});

  // Criar string de consulta ordenada
  const queryString = Object.entries(orderedParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  // Gerar assinatura HMAC SHA256
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  console.log('Query String para assinatura:', queryString); // Debug
  console.log('Assinatura gerada:', signature); // Debug

  return { signature, queryString };
}

// Endpoint para saldo Binance
app.get('/api/binance/balance', async (req, res) => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = generateBinanceSignature(queryString, config.binance.apiSecret);

    console.log('Debug Binance Request:');
    console.log('API Key:', config.binance.apiKey);
    console.log('Query String:', queryString);
    console.log('Signature:', signature);

    const response = await axios({
      method: 'GET',
      url: `${config.binance.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
      headers: {
        'Content-Type': 'application/json',
        'X-MBX-APIKEY': config.binance.apiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro Binance:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data,
      requestDetails: {
        timestamp: Date.now(),
        apiKeyPresent: !!config.binance.apiKey,
        apiSecretPresent: !!config.binance.apiSecret
      }
    });
  }
});

// Endpoint para saldo MEXC
app.get('/api/mexc/balance', async (req, res) => {
  try {
    const timestamp = Date.now();
    const params = {
      timestamp,
      recvWindow: '60000'
    };

    // Gerar assinatura e queryString
    const { signature, queryString } = generateMEXCSignature(params, config.mexc.apiSecret);

    console.log('Debug MEXC Request:');
    console.log('API Key:', config.mexc.apiKey);
    console.log('Query String:', queryString);
    console.log('Signature:', signature);

    // Fazer requisição com assinatura
    const response = await axios({
      method: 'GET',
      url: `${config.mexc.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
      headers: {
        'Content-Type': 'application/json',
        'X-MEXC-APIKEY': config.mexc.apiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro MEXC:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data,
      requestDetails: {
        timestamp: Date.now(),
        apiKeyPresent: !!config.mexc.apiKey,
        apiSecretPresent: !!config.mexc.apiSecret
      }
    });
  }
});

// Endpoint para preços Binance
app.get('/api/binance/prices', async (req, res) => {
  try {
    const response = await axios.get(`${config.binance.baseUrl}/api/v3/ticker/price`);
    res.json(response.data);
  } catch (error) {
    console.error('Erro Binance Prices:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para preços MEXC
app.get('/api/mexc/prices', async (req, res) => {
  try {
    const response = await axios.get(`${config.mexc.baseUrl}/api/v3/ticker/price`);
    res.json(response.data);
  } catch (error) {
    console.error('Erro MEXC Prices:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Adicione estes endpoints ao server.js

// Endpoint para histórico de trades Binance
app.get('/api/binance/trades', async (req, res) => {
  try {
    const { symbol } = req.query;
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}USDT&timestamp=${timestamp}`;
    const signature = generateBinanceSignature(queryString, config.binance.apiSecret);

    console.log('Debug Binance Trades Request:');
    console.log('Symbol:', symbol);
    console.log('Query String:', queryString);

    const response = await axios({
      method: 'GET',
      url: `${config.binance.baseUrl}/api/v3/myTrades?${queryString}&signature=${signature}`,
      headers: {
        'X-MBX-APIKEY': config.binance.apiKey
      }
    });

    // Processar e formatar os trades
    const formattedTrades = response.data.map(trade => ({
      symbol: trade.symbol,
      id: trade.id,
      orderId: trade.orderId,
      price: trade.price,
      qty: trade.qty,
      quoteQty: trade.quoteQty,
      commission: trade.commission,
      commissionAsset: trade.commissionAsset,
      time: trade.time,
      isBuyer: trade.isBuyer,
      isMaker: trade.isMaker
    }));

    res.json(formattedTrades);
  } catch (error) {
    console.error('Erro ao buscar trades Binance:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Endpoint para histórico de trades MEXC
app.get('/api/mexc/trades', async (req, res) => {
  try {
    const { symbol } = req.query;
    const timestamp = Date.now();
    const params = {
      symbol: `${symbol}USDT`,
      timestamp,
      recvWindow: '60000'
    };

    const { signature, queryString } = generateMEXCSignature(params, config.mexc.apiSecret);

    console.log('Debug MEXC Trades Request:');
    console.log('Symbol:', symbol);
    console.log('Query String:', queryString);

    const response = await axios({
      method: 'GET',
      url: `${config.mexc.baseUrl}/api/v3/myTrades?${queryString}&signature=${signature}`,
      headers: {
        'X-MEXC-APIKEY': config.mexc.apiKey
      }
    });

    // Processar e formatar os trades
    const formattedTrades = response.data.map(trade => ({
      symbol: trade.symbol,
      id: trade.id,
      orderId: trade.orderId,
      price: trade.price,
      qty: trade.qty,
      quoteQty: trade.quoteQty,
      commission: trade.commission,
      commissionAsset: trade.commissionAsset,
      time: trade.time,
      isBuyer: trade.isBuyer,
      isMaker: trade.isMaker
    }));

    res.json(formattedTrades);
  } catch (error) {
    console.error('Erro ao buscar trades MEXC:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
// Endpoint para saldo de futuros MEXC (Usando API de Ativos)
app.get('/api/mexc/futures/balance', async (req, res) => {
  try {
    const timestamp = Date.now();
    const params = {
      timestamp,
      recvWindow: '5000'
    };

    // Gerar assinatura e queryString
    const { signature, queryString } = generateMEXCSignature(params, config.mexc.apiSecret);

    console.log('MEXC Futures Assets Request - Raw Params:', params);
    console.log('MEXC Futures Assets Request - Query String:', queryString);
    console.log('MEXC Futures Assets Request - Signature:', signature);

    // Usar endpoint de ativos de futuros
    const response = await axios({
      method: 'GET',
      url: `${config.mexc.baseUrl}/api/v1/private/account/assets?${queryString}&signature=${signature}`,
      headers: {
        'Content-Type': 'application/json',
        'X-MEXC-APIKEY': config.mexc.apiKey
      }
    });

    console.log('MEXC Futures Assets Full Response:', JSON.stringify(response.data, null, 2));

    // Encontrar o ativo USDT
    const usdtAsset = response.data.find(asset => asset.currency === 'USDT');
    
    if (!usdtAsset) {
      console.error('Nenhum ativo USDT encontrado');
      return res.status(400).json({ error: 'Nenhum ativo USDT encontrado' });
    }

    // Calcular saldo total
    const totalBalance = parseFloat(usdtAsset.equity || 0);
    const availableBalance = parseFloat(usdtAsset.availableBalance || 0);
    const frozenBalance = parseFloat(usdtAsset.frozenBalance || 0);
    const unrealizedPnl = parseFloat(usdtAsset.unrealized || 0);

    console.log('Detalhes do Saldo de Futuros USDT:', {
      equity: usdtAsset.equity,
      availableBalance: usdtAsset.availableBalance,
      frozenBalance: usdtAsset.frozenBalance,
      unrealizedPnl: usdtAsset.unrealized
    });

    res.json({ 
      totalBalance,
      availableBalance,
      frozenBalance,
      unrealizedPnl,
      rawData: usdtAsset
    });

  } catch (error) {
    console.error('Erro completo ao buscar saldo de futuros:', error);
    
    // Log detalhado do erro da API
    if (error.response) {
      console.error('Detalhes da resposta de erro:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }

    res.status(500).json({ 
      error: 'Erro ao buscar dados de futuros', 
      details: error.message,
      fullError: error.response?.data 
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Verificando variáveis de ambiente:');
  console.log('BINANCE_API_KEY:', config.binance.apiKey ? 'Definida' : 'Indefinida');
  console.log('BINANCE_API_SECRET:', config.binance.apiSecret ? 'Definida' : 'Indefinida');
  console.log('MEXC_API_KEY:', config.mexc.apiKey ? 'Definida' : 'Indefinida');
  console.log('MEXC_API_SECRET:', config.mexc.apiSecret ? 'Definida' : 'Indefinida');
});