import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span role="img" aria-label="activity" className="text-white text-2xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">GeniDoc</h1>
                <p className="text-xs text-gray-600">by genidoc.ma</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-800" aria-label="notifications">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                SA
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'pricing' && <Pricing />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
