import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

const PriceAlerts = () => {
  const [alerts, setAlerts] = useState(() => {
    const savedAlerts = localStorage.getItem('priceAlerts');
    return savedAlerts ? JSON.parse(savedAlerts) : [];
  });

  const [newAlert, setNewAlert] = useState({
    asset: 'BTC',
    condition: 'above',
    price: '',
    active: true
  });

  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  }, [alerts]);

  const handleAddAlert = () => {
    if (!newAlert.price) return;

    setAlerts([...alerts, { ...newAlert, id: Date.now() }]);
    setNewAlert({
      asset: 'BTC',
      condition: 'above',
      price: '',
      active: true
    });
  };

  const handleDeleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const toggleAlertStatus = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Alertas de Preço</h2>
        </div>
      </div>

      <div className="p-6">
        {/* Formulário para novo alerta */}
        <div className="flex gap-4 mb-6">
          <select
            value={newAlert.asset}
            onChange={(e) => setNewAlert({ ...newAlert, asset: e.target.value })}
            className="bg-white border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="BNB">Binance Coin (BNB)</option>
          </select>

          <select
            value={newAlert.condition}
            onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
            className="bg-white border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="above">Acima de</option>
            <option value="below">Abaixo de</option>
          </select>

          <input
            type="number"
            value={newAlert.price}
            onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
            placeholder="Preço"
            className="bg-white border border-gray-300 rounded-md px-3 py-2"
          />

          <button
            onClick={handleAddAlert}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            Adicionar Alerta
          </button>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum alerta configurado
            </div>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.active ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={alert.active}
                    onChange={() => toggleAlertStatus(alert.id)}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="font-medium">{alert.asset}</div>
                    <div className="text-sm text-gray-500">
                      {alert.condition === 'above' ? 'Acima de' : 'Abaixo de'} ${Number(alert.price).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAlerts;