// src/components/Dashboard/Dashboard.jsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import PortfolioSummary from './PortfolioSummary';
import AssetsBreakdown from './AssetsBreakdown';
import PriceHistory from './PriceHistory';
import PriceAlerts from './PriceAlerts';
import Investments from './Investments';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('portfolio');

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <div className="space-y-8">
            {/* Seção de Sumário */}
            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Visão Geral do Portfólio
              </h2>
              <PortfolioSummary />
            </section>

            {/* Grid de duas colunas para Histórico e Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Histórico de Preços
                </h2>
                <PriceHistory />
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Alertas
                </h2>
                <PriceAlerts />
              </section>
            </div>

            {/* Seção de Detalhamento */}
            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Detalhamento dos Ativos
              </h2>
              <AssetsBreakdown />
            </section>
          </div>
        );

      case 'investments':
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Análise de Investimentos
            </h2>
            <Investments />
          </div>
        );

      case 'balances':
        return (
          <div>
            {/* Aqui será renderizado o componente de Saldos */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Saldos das Exchanges
            </h2>
            {/* Placeholder para o componente de Saldos */}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Navegação */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col space-y-4 py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard de Investimentos
            </h1>
            
            {/* Navegação */}
            <nav className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'portfolio'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Portfólio
              </button>
              <button
                onClick={() => setActiveTab('investments')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'investments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Investimentos
              </button>
              <button
                onClick={() => setActiveTab('balances')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'balances'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Saldos
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      {/* Footer com informações adicionais */}
      <footer className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          Dados atualizados automaticamente a cada 5 minutos
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;