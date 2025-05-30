import React, { useState } from 'react';

const Dashboard = () => {
  const [appointments] = useState([
    { id: 1, patient: 'Ahmed Benali', date: '2025-05-30', time: '09:00', type: 'Consultation', status: 'confirmed' },
    { id: 2, patient: 'Fatima Zahra', date: '2025-05-30', time: '10:30', type: 'Suivi', status: 'pending' },
    { id: 3, patient: 'Mohamed Alami', date: '2025-05-31', time: '14:00', type: 'Urgence', status: 'confirmed' }
  ]);

  const [monitoringData] = useState([
    { id: 1, patient: 'Ahmed Benali', vitals: { bp: '140/90', hr: 75, temp: 36.8, spo2: 98 }, timestamp: '2025-05-30 08:00' },
    { id: 2, patient: 'Fatima Zahra', vitals: { bp: '120/80', hr: 82, temp: 37.1, spo2: 96 }, timestamp: '2025-05-30 07:30' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord</h2>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span className="text-lg">＋</span>
            <span>Nouveau RDV</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">RDV Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
            <span className="text-blue-500 text-3xl">📅</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Patients Actifs</p>
              <p className="text-2xl font-bold text-gray-800">247</p>
            </div>
            <span className="text-green-500 text-3xl">👥</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Surveillance</p>
              <p className="text-2xl font-bold text-gray-800">18</p>
            </div>
            <span className="text-yellow-500 text-3xl">👁️</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Alertes</p>
              <p className="text-2xl font-bold text-gray-800">3</p>
            </div>
            <span className="text-purple-500 text-3xl">🔔</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Prochains Rendez-vous</h3>
          <div className="space-y-3">
            {appointments.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{apt.patient}</p>
                  <p className="text-sm text-gray-600">{apt.date} à {apt.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Surveillance Temps Réel</h3>
          <div className="space-y-3">
            {monitoringData.map(data => (
              <div key={data.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{data.patient}</p>
                  <span className="text-xs text-gray-500">{data.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 text-lg">❤️</span>
                    <span>{data.vitals.bp}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500 text-lg">💓</span>
                    <span>{data.vitals.hr} bpm</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-orange-500 text-lg">🌡️</span>
                    <span>{data.vitals.temp}°C</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-400 text-lg">🩸</span>
                    <span>{data.vitals.spo2}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
