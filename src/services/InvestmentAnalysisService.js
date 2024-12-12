// src/services/investmentAnalysisService.js
class InvestmentAnalysisService {
  /**
   * Calcula métricas detalhadas de investimento para um ativo
   * @param {Array} trades - Array de trades do ativo
   * @param {number} currentPrice - Preço atual do ativo
   * @param {number} currentHoldings - Quantidade atual do ativo
   * @returns {Object} Métricas calculadas
   */
  calculateInvestmentMetrics(trades, currentPrice, currentHoldings) {
        if (!trades || !Array.isArray(trades)) {
            console.warn('Trades inválidos:', trades);
            trades = [];
        }

        // Organiza trades por data
        const sortedTrades = [...trades].sort((a, b) => a.time - b.time);
        
        let totalBought = 0;         // Quantidade total comprada
        let totalSpentBuying = 0;    // Total gasto em compras
        let totalSold = 0;           // Quantidade total vendida
        let totalGainedSelling = 0;  // Total ganho em vendas
        let realizedProfit = 0;      // Lucro realizado
        let totalFees = 0;           // Total de taxas
        
        // Arrays para tracking de compras e vendas
        let buyTrades = [];
        let sellTrades = [];

        // Primeira passagem: separar compras e vendas
        sortedTrades.forEach(trade => {
            const quantity = parseFloat(trade.qty);
            const price = parseFloat(trade.price);
            const total = quantity * price;
            const fee = parseFloat(trade.commission || 0);
            
            totalFees += fee;

            if (trade.isBuyer) {
                buyTrades.push({ quantity, price, total });
                totalBought += quantity;
                totalSpentBuying += total;
            } else {
                sellTrades.push({ quantity, price, total });
                totalSold += quantity;
                totalGainedSelling += total;
            }
        });

        // Calcular preço médio ponderado das compras
        const averageBuyPrice = totalBought > 0 ? totalSpentBuying / totalBought : 0;

        // Calcular lucro realizado usando FIFO
        let remainingBuyTrades = [...buyTrades];
        sellTrades.forEach(sell => {
            let remainingToSell = sell.quantity;
            
            while (remainingToSell > 0 && remainingBuyTrades.length > 0) {
                const buy = remainingBuyTrades[0];
                const soldQuantity = Math.min(remainingToSell, buy.quantity);
                
                // Calcular lucro realizado para esta parte da venda
                const buyValue = soldQuantity * buy.price;
                const sellValue = soldQuantity * sell.price;
                realizedProfit += sellValue - buyValue;
                
                // Atualizar quantidades restantes
                remainingToSell -= soldQuantity;
                buy.quantity -= soldQuantity;
                
                if (buy.quantity === 0) {
                    remainingBuyTrades.shift();
                }
            }
        });

        // Calcular custos remanescentes para holdings atuais
        let remainingCost = 0;
        let remainingQuantity = 0;
        
        remainingBuyTrades.forEach(trade => {
            remainingCost += trade.quantity * trade.price;
            remainingQuantity += trade.quantity;
        });

        // Se ainda temos holdings mas não temos trades suficientes,
        // usar o preço médio de compra para o restante
        if (currentHoldings > remainingQuantity) {
            const extraQuantity = currentHoldings - remainingQuantity;
            remainingCost += extraQuantity * averageBuyPrice;
            remainingQuantity = currentHoldings;
        }

        // Calcular preço médio atual
        const averageCost = remainingQuantity > 0 ? remainingCost / remainingQuantity : averageBuyPrice;

        // Calcular valor e lucro atual
        const currentValue = currentHoldings * currentPrice;
        const unrealizedProfit = currentValue - (currentHoldings * averageCost);
        const totalProfit = realizedProfit + unrealizedProfit;
        
        // Calcular ROI
        const totalInvested = currentHoldings * averageCost;
        const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

        // Análise de preços
        const prices = sortedTrades.map(t => parseFloat(t.price));
        const highestPrice = Math.max(...prices, currentPrice);
        const lowestPrice = Math.min(...prices);
        const priceVolatility = lowestPrice > 0 ? ((highestPrice - lowestPrice) / lowestPrice) * 100 : 0;

        // Debug info
        console.log(`Análise para holdings: ${currentHoldings}`, {
            totalBought,
            totalSpentBuying,
            averageBuyPrice,
            remainingQuantity,
            remainingCost,
            averageCost,
            currentValue,
            unrealizedProfit
        });

        return {
            currentHoldings,
            currentValue,
            metrics: {
                averageCost,            // Preço médio atual considerando holdings
                averageBuyPrice,        // Preço médio de todas as compras
                currentPrice,
                totalInvested,
                realizedProfit,
                unrealizedProfit,
                totalProfit,
                roi,
                priceVolatility
            },
            trading: {
                totalBought,
                totalSold,
                totalSpentBuying,
                totalGainedSelling,
                totalFees,
                numberOfTrades: sortedTrades.length,
                buyTrades: buyTrades.length,
                sellTrades: sellTrades.length
            },
            priceRange: {
                highest: highestPrice,
                lowest: lowestPrice,
                current: currentPrice
            }
        };
    }

  /**
   * Calcula métricas agregadas do portfolio
   * @param {Array} assetsMetrics - Array de métricas de cada ativo
   * @param {number} minValueFilter - Valor mínimo em USD para incluir o ativo
   * @returns {Object} Métricas agregadas do portfolio
   */
  calculatePortfolioMetrics(assetsMetrics, minValueFilter = 5) {
    // Filtrar ativos com valor mínimo
    const filteredAssets = assetsMetrics.filter(asset => 
      asset.currentValue >= minValueFilter
    );

    const portfolio = {
      totalInvested: 0,  // Total investido inicialmente
      currentValue: 0,   // Valor atual total
      realizedProfit: 0, // Lucro realizado
      unrealizedProfit: 0, // Lucro não realizado
      totalProfit: 0,    // Lucro total
      totalFees: 0,      // Taxas totais
      numberOfTrades: 0, // Número total de trades
      assets: filteredAssets.length // Número de ativos
    };

    filteredAssets.forEach(asset => {
      // Acumular métricas
      portfolio.totalInvested += asset.metrics.totalInvested || 0;
      portfolio.currentValue += asset.currentValue || 0;
      portfolio.realizedProfit += asset.metrics.realizedProfit || 0;
      portfolio.unrealizedProfit += asset.metrics.unrealizedProfit || 0;
      portfolio.totalProfit += asset.metrics.totalProfit || 0;
      portfolio.totalFees += asset.trading?.totalFees || 0;
      portfolio.numberOfTrades += asset.trading?.numberOfTrades || 0;
    });

    // Calcular ROI Total
    portfolio.totalRoi = portfolio.totalInvested > 0 
      ? (portfolio.totalProfit / portfolio.totalInvested) * 100 
      : 0;

    // Distribuição dos ativos
    portfolio.distribution = filteredAssets
      .map(asset => ({
        symbol: asset.symbol,
        percentage: (asset.currentValue / portfolio.currentValue) * 100,
        value: asset.currentValue
      }))
      .sort((a, b) => b.value - a.value);

    console.log('Portfolio Metrics:', portfolio); // Debug log

    return portfolio;
  }
}

export default InvestmentAnalysisService;