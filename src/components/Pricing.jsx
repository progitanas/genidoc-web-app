import React from 'react';

const pricingPlans = [
  {
    name: "License Hospitalière",
    price: "10 assignations gratuites/mois",
    then: "2.99 MAD/assignation",
    features: ["Gestion des rendez-vous", "Dossiers patients", "Support 24/7"]
  },
  {
    name: "GeniDoc Agent AI",
    price: "Gratuit 30 jours",
    then: "48.99 MAD/mois",
    features: ["IA d'assistance", "Analyse prédictive", "Recommandations automatiques"]
  },
  {
    name: "GeniDoc Agent AI +",
    price: "99 MAD/mois",
    then: "",
    features: ["Toutes les fonctionnalités AI", "Intégration avancée", "Support prioritaire"]
  },
  {
    name: "Surveillance à Distance",
    price: "1 spécialité gratuite/mois",
    then: "38.99 MAD pour 2 spécialités",
    features: ["Monitoring temps réel", "Alertes automatiques", "Rapports détaillés"]
  },
  {
    name: "Base de Données IoT",
    price: "399 MAD/an",
    then: "",
    features: ["Stockage sécurisé", "Intégration IoT", "Sauvegarde automatique"]
  }
];

const Pricing = () => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Plans & Tarification</h2>
      <p className="text-gray-600">Choisissez le plan adapté à vos besoins</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pricingPlans.map((plan, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">{plan.price}</div>
            {plan.then && <div className="text-sm text-gray-600">{plan.then}</div>}
          </div>
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center space-x-2">
                <span className="text-green-500 text-lg">✔️</span>
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Choisir ce plan
          </button>
        </div>
      ))}
    </div>
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-xl text-white">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">GeniDoc - Innovation Médicale</h3>
        <p className="text-lg mb-4">Fondé par SENHAJI Anas</p>
        <p className="mb-6">Solution complète de gestion hospitalière avec surveillance IoT</p>
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-sm">Support</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">99.9%</div>
            <div className="text-sm">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">RGPD</div>
            <div className="text-sm">Conforme</div>
          </div>
        </div>
        <div className="mt-6">
          <a href="https://linkedin.com/in/spyanas" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Contacter le Fondateur
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default Pricing;
