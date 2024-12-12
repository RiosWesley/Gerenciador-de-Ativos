import React from 'react';
import { HomeIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-xl font-bold">Crypto Portfolio</h1>
      </div>
      <nav className="mt-4">
        <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
          <HomeIcon className="w-5 h-5 mr-2" />
          Dashboard
        </a>
        <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
          <ChartBarIcon className="w-5 h-5 mr-2" />
          Portfolio
        </a>
        <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
          <CogIcon className="w-5 h-5 mr-2" />
          Configurações
        </a>
      </nav>
    </div>
  );
}

export default Sidebar;