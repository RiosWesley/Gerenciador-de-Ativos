import React from 'react';
import { DistributionChart } from './DistributionChart';
import { HistoryChart } from './HistoryChart';

export const PortfolioDetails = ({ distribution, history }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Distribuição do Portfólio</h3>
        <DistributionChart data={distribution} />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Histórico de Valor</h3>
        <HistoryChart data={history} />
      </div>
    </div>
  );
};

export default PortfolioDetails;