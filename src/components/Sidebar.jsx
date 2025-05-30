import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: '📊' },
  { id: 'pricing', label: 'Tarification', icon: '⭐' },
];

const Sidebar = ({ activeTab, setActiveTab }) => (
  <nav className="w-64 bg-white shadow-lg h-screen sticky top-0">
    <div className="p-4">
      <ul className="space-y-2">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={activeTab === item.id ? "page" : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default Sidebar;
